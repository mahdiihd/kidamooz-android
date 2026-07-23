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

  readonly ids = this.favoriteIdsState.asReadonly();

  async ensureReady(): Promise<void> {
    if (this.ready) {
      return;
    }

    const result = await Preferences.get({ key: FAVORITES_KEY });
    if (result.value) {
      try {
        const parsed = JSON.parse(result.value) as string[];
        this.favoriteIdsState.set(new Set(Array.isArray(parsed) ? parsed : []));
      } catch {
        this.favoriteIdsState.set(new Set());
      }
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

      const merged = new Set([...this.favoriteIdsState(), ...remote]);
      this.favoriteIdsState.set(merged);
      await this.persist(merged);
      await this.pushToServer([...merged]);
    } catch {
      /* offline */
    }
  }

  private async pushToServer(storyIds: string[]): Promise<void> {
    await new Promise<void>((resolve) => {
      this.api.put('/api/v1/me/favorites', { storyIds }).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      });
    });
  }

  private async persist(ids: Set<string>): Promise<void> {
    await Preferences.set({
      key: FAVORITES_KEY,
      value: JSON.stringify([...ids]),
    });
  }
}
