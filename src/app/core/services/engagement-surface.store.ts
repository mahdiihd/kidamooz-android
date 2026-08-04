import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';

import { CACHE_POLICY } from '../config/cache-policy';
import { StoryOfTheDay, WeeklyChallenge } from '../models/member-feature.model';
import { EngagementApiService } from './engagement-api.service';

interface EngagementSurfacePayload {
  storyOfDay: StoryOfTheDay | null;
  challenge: WeeklyChallenge | null;
  fetchedAt: number;
}

@Injectable({ providedIn: 'root' })
export class EngagementSurfaceStore {
  private readonly api = inject(EngagementApiService);

  readonly storyOfDay = signal<StoryOfTheDay | null>(null);
  readonly challenge = signal<WeeklyChallenge | null>(null);

  private fetchedAt = 0;
  private hydrated = false;
  private loadPromise?: Promise<void>;

  async ensureReady(force = false): Promise<void> {
    if (!force && this.isMemoryFresh()) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.load(force);
    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = undefined;
    }
  }

  private async load(force: boolean): Promise<void> {
    if (!force && !this.isMemoryFresh()) {
      await this.hydrateFromDisk();
      if (this.isMemoryFresh()) {
        return;
      }
    }

    await this.fetchAndPersist();
  }

  private isMemoryFresh(): boolean {
    return this.isPayloadFresh({
      storyOfDay: this.storyOfDay(),
      challenge: this.challenge(),
      fetchedAt: this.fetchedAt,
    });
  }

  private isPayloadFresh(payload: EngagementSurfacePayload | null): boolean {
    if (!payload?.fetchedAt) {
      return false;
    }

    if (Date.now() - payload.fetchedAt >= CACHE_POLICY.engagementSurfaceTtlMs) {
      return false;
    }

    const today = this.todayKey();
    const story = payload.storyOfDay;
    if (story?.pickDate && this.dateKey(story.pickDate) !== today) {
      return false;
    }

    const challenge = payload.challenge;
    if (challenge?.weekEnd) {
      const end = Date.parse(challenge.weekEnd);
      if (!Number.isNaN(end) && Date.now() > end) {
        return false;
      }
    }

    return true;
  }

  private async hydrateFromDisk(): Promise<void> {
    if (this.hydrated && this.fetchedAt) {
      return;
    }

    const payload = await this.readDisk();
    this.hydrated = true;
    if (!payload || !this.isPayloadFresh(payload)) {
      return;
    }

    this.applyPayload(payload);
  }

  private async fetchAndPersist(): Promise<void> {
    let storyOfDay: StoryOfTheDay | null = null;
    let challenge: WeeklyChallenge | null = null;

    try {
      storyOfDay = await firstValueFrom(this.api.storyOfTheDay());
    } catch {
      storyOfDay = null;
    }

    try {
      challenge = await firstValueFrom(this.api.weeklyChallenge());
    } catch {
      challenge = null;
    }

    const payload: EngagementSurfacePayload = {
      storyOfDay,
      challenge,
      fetchedAt: Date.now(),
    };

    this.applyPayload(payload);
    await this.writeDisk(payload);
  }

  private applyPayload(payload: EngagementSurfacePayload): void {
    this.storyOfDay.set(payload.storyOfDay);
    this.challenge.set(payload.challenge);
    this.fetchedAt = payload.fetchedAt;
    this.hydrated = true;
  }

  private async readDisk(): Promise<EngagementSurfacePayload | null> {
    const raw = await this.readRaw();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as EngagementSurfacePayload;
    } catch {
      await this.clearDisk();
      return null;
    }
  }

  private async writeDisk(payload: EngagementSurfacePayload): Promise<void> {
    const json = JSON.stringify(payload);
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({
        key: CACHE_POLICY.engagementSurfaceStorageKey,
        value: json,
      });
      return;
    }

    localStorage.setItem(CACHE_POLICY.engagementSurfaceStorageKey, json);
  }

  private async clearDisk(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: CACHE_POLICY.engagementSurfaceStorageKey });
      return;
    }

    localStorage.removeItem(CACHE_POLICY.engagementSurfaceStorageKey);
  }

  private async readRaw(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const result = await Preferences.get({
        key: CACHE_POLICY.engagementSurfaceStorageKey,
      });
      return result.value;
    }

    return localStorage.getItem(CACHE_POLICY.engagementSurfaceStorageKey);
  }

  private todayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private dateKey(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return value;
    }

    const date = new Date(parsed);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
