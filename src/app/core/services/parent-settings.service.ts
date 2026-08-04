import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { ChildProfile } from '../models/member-feature.model';
import { ChildProfileApiService } from './child-profile-api.service';
import { MemberAuthService } from './member-auth.service';

const ActiveChildKey = 'kidamooz.activeChildId';

@Injectable({ providedIn: 'root' })
export class ParentSettingsService {
  private readonly childrenApi = inject(ChildProfileApiService);
  private readonly auth = inject(MemberAuthService);

  private readonly childrenState = signal<ChildProfile[]>([]);
  private readonly activeChildIdState = signal<string | null>(null);
  private boundUserId: string | null = null;
  private refreshSeq = 0;

  readonly children = this.childrenState.asReadonly();
  readonly activeChildId = this.activeChildIdState.asReadonly();
  readonly activeChild = computed(() => {
    const id = this.activeChildIdState();
    return this.childrenState().find((c) => c.id === id) ?? this.childrenState()[0] ?? null;
  });
  readonly activeAge = computed(() => this.activeChild()?.age ?? null);

  async clearSession(): Promise<void> {
    this.refreshSeq += 1;
    this.boundUserId = null;
    this.childrenState.set([]);
    this.activeChildIdState.set(null);
    await Preferences.remove({ key: ActiveChildKey });
  }

  async ensureReady(): Promise<void> {
    await this.auth.ensureHydrated();
    const userId = this.auth.profile()?.id ?? null;

    if (userId !== this.boundUserId) {
      this.childrenState.set([]);
      this.activeChildIdState.set(null);
      this.boundUserId = userId;

      if (!userId) {
        await Preferences.remove({ key: ActiveChildKey });
        return;
      }

      const active = await Preferences.get({ key: this.activeChildStorageKey(userId) });
      if (active.value) {
        this.activeChildIdState.set(active.value);
      }
    }

    if (this.auth.isLoggedIn()) {
      await this.refreshChildren();
    }
  }

  async refreshChildren(): Promise<void> {
    const userId = this.auth.profile()?.id ?? null;
    if (!userId) {
      this.childrenState.set([]);
      this.activeChildIdState.set(null);
      return;
    }

    const seq = ++this.refreshSeq;
    try {
      const items = await new Promise<ChildProfile[]>((resolve, reject) => {
        this.childrenApi.list().subscribe({ next: resolve, error: reject });
      });

      if (seq !== this.refreshSeq || this.auth.profile()?.id !== userId) {
        return;
      }

      this.childrenState.set(items);
      const current = this.activeChildIdState();
      if (!current || !items.some((c) => c.id === current)) {
        const nextId = items[0]?.id ?? null;
        this.activeChildIdState.set(nextId);
        if (nextId) {
          await Preferences.set({ key: this.activeChildStorageKey(userId), value: nextId });
        } else {
          await Preferences.remove({ key: this.activeChildStorageKey(userId) });
          await Preferences.remove({ key: ActiveChildKey });
        }
      }
    } catch {
      if (seq !== this.refreshSeq || this.auth.profile()?.id !== userId) {
        return;
      }
      this.childrenState.set([]);
      this.activeChildIdState.set(null);
    }
  }

  async setActiveChild(id: string): Promise<void> {
    this.activeChildIdState.set(id);
    const userId = this.auth.profile()?.id;
    if (userId) {
      await Preferences.set({ key: this.activeChildStorageKey(userId), value: id });
    }
    await Preferences.set({ key: ActiveChildKey, value: id });
  }

  private activeChildStorageKey(userId: string): string {
    return `${ActiveChildKey}.${userId}`;
  }
}
