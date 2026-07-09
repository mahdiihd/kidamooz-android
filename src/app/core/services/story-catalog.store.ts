import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';

import { CACHE_POLICY } from '../config/cache-policy';
import { Category } from '../models/category.model';
import {
  CatalogCachePayload,
  CatalogStoreStatus,
} from '../models/catalog-cache.model';
import { StoryDetail } from '../models/story.model';
import { CatalogStorageService } from './catalog-storage.service';
import { StoryApiService } from './story-api.service';

@Injectable({ providedIn: 'root' })
export class StoryCatalogStore {
  private readonly storyApi = inject(StoryApiService);
  private readonly storage = inject(CatalogStorageService);

  readonly categories = signal<Category[]>([]);
  readonly stories = signal<StoryDetail[]>([]);
  readonly status = signal<CatalogStoreStatus>('idle');

  readonly hasCachedData = computed(
    () => this.categories().length > 0 || this.stories().length > 0
  );

  private cachedVersion: string | null = null;
  private fetchedAt = 0;
  private bootstrapPromise?: Promise<void>;
  private refreshPromise?: Promise<void>;

  async bootstrap(): Promise<void> {
    if (this.bootstrapPromise) {
      return this.bootstrapPromise;
    }

    this.bootstrapPromise = this.runBootstrap();
    try {
      await this.bootstrapPromise;
    } finally {
      this.bootstrapPromise = undefined;
    }
  }

  async ensureReady(): Promise<void> {
    if (this.status() === 'ready' && this.hasCachedData()) {
      return;
    }

    return this.bootstrap();
  }

  async refresh(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchAndPersist(true);
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  getStoriesByCategory(categoryId: string | null): StoryDetail[] {
    const all = this.stories();
    if (!categoryId) {
      return all;
    }

    return all.filter((story) => story.categoryId === categoryId);
  }

  getStoryById(id: string): StoryDetail | undefined {
    return this.stories().find((story) => story.id === id);
  }

  getFeaturedStories(limit: number): StoryDetail[] {
    return this.stories().slice(0, limit);
  }

  upsertStory(story: StoryDetail): void {
    const stories = [...this.stories()];
    const index = stories.findIndex((item) => item.id === story.id);
    if (index === -1) {
      stories.push(story);
    } else {
      stories[index] = story;
    }

    this.stories.set(stories);
    void this.persistCurrent();
  }

  private async runBootstrap(): Promise<void> {
    const hadCache = await this.hydrateFromDisk();

    if (hadCache) {
      this.status.set('ready');
      void this.syncIfNeeded();
      return;
    }

    this.status.set('hydrating');
    await this.fetchAndPersist(false);
  }

  private async hydrateFromDisk(): Promise<boolean> {
    const cached = await this.storage.load();
    if (!cached) {
      return false;
    }

    this.applyPayload(cached);
    return true;
  }

  private async syncIfNeeded(): Promise<void> {
    try {
      const remoteVersion = await firstValueFrom(this.storyApi.getCatalogVersion());
      const versionChanged = remoteVersion.version !== this.cachedVersion;
      const ttlExpired = this.isTtlExpired();

      if (versionChanged || ttlExpired) {
        await this.fetchAndPersist(false);
      }
    } catch {
      if (!this.hasCachedData()) {
        this.status.set('error');
      }
    }
  }

  private async fetchAndPersist(forceError: boolean): Promise<void> {
    if (!this.hasCachedData()) {
      this.status.set('hydrating');
    }

    try {
      const [version, categories, storiesResponse] = await firstValueFrom(
        forkJoin([
          this.storyApi.getCatalogVersion(),
          this.storyApi.getCategories(),
          this.storyApi.getStories(),
        ])
      );

      const payload: CatalogCachePayload = {
        version: version.version,
        categories,
        stories: storiesResponse.items,
        fetchedAt: Date.now(),
      };

      this.applyPayload(payload);
      await this.storage.save(payload);
      this.status.set('ready');
    } catch {
      if (forceError || !this.hasCachedData()) {
        this.status.set('error');
        return;
      }

      this.status.set('ready');
    }
  }

  private applyPayload(payload: CatalogCachePayload): void {
    this.cachedVersion = payload.version;
    this.fetchedAt = payload.fetchedAt;
    this.categories.set(payload.categories);
    this.stories.set(payload.stories);
  }

  private async persistCurrent(): Promise<void> {
    if (!this.cachedVersion) {
      return;
    }

    const payload: CatalogCachePayload = {
      version: this.cachedVersion,
      categories: this.categories(),
      stories: this.stories(),
      fetchedAt: Date.now(),
    };

    this.fetchedAt = payload.fetchedAt;
    await this.storage.save(payload);
  }

  private isTtlExpired(): boolean {
    if (!this.fetchedAt) {
      return true;
    }

    return Date.now() - this.fetchedAt > CACHE_POLICY.catalogTtlMs;
  }
}
