import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { ApiService } from './api.service';
import { MemberAuthService } from './member-auth.service';

const FAVORITES_KEY = 'kidamooz.favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(MemberAuthService);
  private readonly favoriteIdsState = signal<Set<string>>(new Set());
  private ready = false;
  private boundUserId: string | null | undefined = undefined;
  private pullSeq = 0;

  readonly ids = this.favoriteIdsState.asReadonly();

  async clearSession(): Promise<void> {
    this.pullSeq += 1;
    this.boundUserId = null;
    this.favoriteIdsState.set(new Set());
    this.ready = false;
    await Preferences.remove({ key: FAVORITES_KEY });
  }

  async ensureReady(): Promise<void> {
    await this.auth.ensureHydrated();
    const userId = this.auth.profile()?.id ?? null;

    if (userId !== this.boundUserId) {
      this.boundUserId = userId;
      this.favoriteIdsState.set(new Set());
      this.ready = false;

      if (userId) {
        const result = await Preferences.get({ key: this.storageKey(userId) });
        if (result.value) {
          try {
            const parsed = JSON.parse(result.value) as string[];
            this.favoriteIdsState.set(new Set(Array.isArray(parsed) ? parsed : []));
          } catch {
            this.favoriteIdsState.set(new Set());
          }
        }
      } else {
        await Preferences.remove({ key: FAVORITES_KEY });
      }
    }

    if (this.ready) {
      return;
    }

    this.ready = true;
    void this.pullFromServer();
  }

  isFavorite(storyId: string): boolean {
    return this.favoriteIdsState().has(storyId);
  }

  async toggle(storyId: string): Promise<boolean> {
    await this.ensureReady();
    const next = new Set(this.favoriteIdsState());
    const added = !next.has(storyId);
    if (added) {
      next.add(storyId);
    } else {
      next.delete(storyId);
    }

    this.favoriteIdsState.set(next);
    await this.persist(next);

    await this.auth.ensureHydrated();
    if (this.auth.isLoggedIn()) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.api.post<{ isFavorite?: boolean }>(`/api/v1/me/favorites/${storyId}/toggle`, {}).subscribe({
            next: () => resolve(),
            error: reject,
          });
        });
      } catch {
        /* keep local */
      }
    }

    return added;
  }

  async pullFromServer(): Promise<void> {
    await this.auth.ensureHydrated();
    if (!this.auth.isLoggedIn()) {
      return;
    }

    const userId = this.auth.profile()?.id ?? null;
    if (!userId) {
      return;
    }

    const seq = ++this.pullSeq;
    try {
      const remote = await new Promise<string[]>((resolve, reject) => {
        this.api
          .get<{ storyIds?: string[]; StoryIds?: string[] }>('/api/v1/me/favorites')
          .subscribe({
            next: (raw) => {
              const ids = raw.storyIds ?? raw.StoryIds ?? [];
              resolve(Array.isArray(ids) ? ids.map(String) : []);
            },
            error: reject,
          });
      });

      if (seq !== this.pullSeq || this.auth.profile()?.id !== userId) {
        return;
      }

      const next = new Set(remote);
      this.favoriteIdsState.set(next);
      await this.persist(next);
    } catch {
      /* offline */
    }
  }

  private storageKey(userId: string): string {
    return `${FAVORITES_KEY}.${userId}`;
  }

  private async persist(ids: Set<string>): Promise<void> {
    const userId = this.auth.profile()?.id;
    const value = JSON.stringify([...ids]);
    if (userId) {
      await Preferences.set({ key: this.storageKey(userId), value });
    }
    await Preferences.set({ key: FAVORITES_KEY, value });
  }
}
