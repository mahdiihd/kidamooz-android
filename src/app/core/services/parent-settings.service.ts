import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { ChildProfile } from '../models/member-feature.model';
import { ChildProfileApiService } from './child-profile-api.service';
import { MemberAuthService } from './member-auth.service';

const ActiveChildKey = 'kidamooz.activeChildId';
const PinHashKey = 'kidamooz.parentPinHash';

@Injectable({ providedIn: 'root' })
export class ParentSettingsService {
  private readonly childrenApi = inject(ChildProfileApiService);
  private readonly auth = inject(MemberAuthService);

  private readonly childrenState = signal<ChildProfile[]>([]);
  private readonly activeChildIdState = signal<string | null>(null);
  private readonly hasPinState = signal(false);
  private unlockedUntil = 0;

  readonly children = this.childrenState.asReadonly();
  readonly activeChildId = this.activeChildIdState.asReadonly();
  readonly hasPin = this.hasPinState.asReadonly();
  readonly activeChild = computed(() => {
    const id = this.activeChildIdState();
    return this.childrenState().find((c) => c.id === id) ?? this.childrenState()[0] ?? null;
  });
  readonly activeAge = computed(() => this.activeChild()?.age ?? null);

  isUnlocked(): boolean {
    return Date.now() < this.unlockedUntil;
  }

  lock(): void {
    this.unlockedUntil = 0;
  }

  unlockForMinutes(minutes = 15): void {
    this.unlockedUntil = Date.now() + minutes * 60_000;
  }

  async ensureReady(): Promise<void> {
    const pin = await Preferences.get({ key: PinHashKey });
    this.hasPinState.set(!!pin.value);

    const active = await Preferences.get({ key: ActiveChildKey });
    if (active.value) {
      this.activeChildIdState.set(active.value);
    }

    await this.auth.ensureHydrated();
    if (this.auth.isLoggedIn()) {
      await this.refreshChildren();
    }
  }

  async refreshChildren(): Promise<void> {
    try {
      const items = await new Promise<ChildProfile[]>((resolve, reject) => {
        this.childrenApi.list().subscribe({ next: resolve, error: reject });
      });
      this.childrenState.set(items);
      const current = this.activeChildIdState();
      if (!current || !items.some((c) => c.id === current)) {
        const nextId = items[0]?.id ?? null;
        this.activeChildIdState.set(nextId);
        if (nextId) {
          await Preferences.set({ key: ActiveChildKey, value: nextId });
        }
      }
    } catch {
      this.childrenState.set([]);
    }
  }

  async setActiveChild(id: string): Promise<void> {
    this.activeChildIdState.set(id);
    await Preferences.set({ key: ActiveChildKey, value: id });
  }

  async setPin(pin: string): Promise<void> {
    const normalized = pin.trim();
    if (!/^\d{4}$/.test(normalized)) {
      throw new Error('pinInvalid');
    }
    const hash = await this.hash(normalized);
    await Preferences.set({ key: PinHashKey, value: hash });
    this.hasPinState.set(true);
    this.unlockForMinutes();
  }

  async verifyPin(pin: string): Promise<boolean> {
    const stored = await Preferences.get({ key: PinHashKey });
    if (!stored.value) {
      this.unlockForMinutes();
      return true;
    }
    const hash = await this.hash(pin.trim());
    const ok = hash === stored.value;
    if (ok) {
      this.unlockForMinutes();
    }
    return ok;
  }

  async clearPin(): Promise<void> {
    await Preferences.remove({ key: PinHashKey });
    this.hasPinState.set(false);
  }

  private async hash(value: string): Promise<string> {
    const data = new TextEncoder().encode(`kidamooz-parent:${value}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
