import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

import { MEDIA_CACHE_POLICY } from '../config/cache-policy';
import { AudioCacheEntry, AudioCacheIndex } from '../models/audio-cache.model';

@Injectable({ providedIn: 'root' })
export class AudioCacheService {
  private readonly directory = Directory.Cache;
  private readonly inflight = new Map<string, Promise<void>>();
  private cachedIndex: AudioCacheIndex | null = null;

  async resolvePlayUrl(storyId: string, remoteUrl: string): Promise<string> {
    if (!Capacitor.isNativePlatform() || !remoteUrl) {
      return remoteUrl;
    }

    const entry = await this.findValidEntry(storyId, remoteUrl);
    if (!entry) {
      return remoteUrl;
    }

    await this.touch(storyId);
    const uri = await Filesystem.getUri({
      path: entry.path,
      directory: this.directory,
    });
    return Capacitor.convertFileSrc(uri.uri);
  }

  ensureCached(storyId: string, remoteUrl: string): Promise<void> {
    if (!Capacitor.isNativePlatform() || !storyId || !remoteUrl) {
      return Promise.resolve();
    }

    const existing = this.inflight.get(storyId);
    if (existing) {
      return existing;
    }

    const task = this.downloadAndStore(storyId, remoteUrl)
      .catch(() => undefined)
      .finally(() => {
        this.inflight.delete(storyId);
      });
    this.inflight.set(storyId, task);
    return task;
  }

  async touch(storyId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const index = await this.loadIndex();
    const entry = index.entries.find((item) => item.storyId === storyId);
    if (!entry) {
      return;
    }

    entry.lastPlayedAt = Date.now();
    await this.saveIndex(index);
  }

  async isCached(storyId: string, remoteUrl: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const entry = await this.findValidEntry(storyId, remoteUrl);
    return entry != null;
  }

  private async downloadAndStore(storyId: string, remoteUrl: string): Promise<void> {
    const valid = await this.findValidEntry(storyId, remoteUrl);
    if (valid) {
      await this.touch(storyId);
      return;
    }

    await this.removeEntry(storyId);

    const path = this.buildPath(storyId, remoteUrl);
    await this.ensureAudioDirectory();

    await Filesystem.downloadFile({
      url: remoteUrl,
      path,
      directory: this.directory,
      recursive: true,
    });

    let sizeBytes = 0;
    try {
      const stat = await Filesystem.stat({
        path,
        directory: this.directory,
      });
      sizeBytes = Number(stat.size) || 0;
    } catch {
      sizeBytes = 0;
    }

    const index = await this.loadIndex();
    index.entries = index.entries.filter((item) => item.storyId !== storyId);
    index.entries.push({
      storyId,
      remoteUrl,
      path,
      sizeBytes,
      lastPlayedAt: Date.now(),
    });

    await this.saveIndex(index);
    await this.evictIfNeeded();
  }

  private async findValidEntry(
    storyId: string,
    remoteUrl: string,
  ): Promise<AudioCacheEntry | null> {
    const index = await this.loadIndex();
    const entry = index.entries.find((item) => item.storyId === storyId);
    if (!entry || entry.remoteUrl !== remoteUrl) {
      return null;
    }

    try {
      await Filesystem.stat({
        path: entry.path,
        directory: this.directory,
      });
      return entry;
    } catch {
      await this.removeEntry(storyId);
      return null;
    }
  }

  private async evictIfNeeded(): Promise<void> {
    const index = await this.loadIndex();
    let total = index.entries.reduce((sum, item) => sum + item.sizeBytes, 0);
    if (total <= MEDIA_CACHE_POLICY.offlineQuotaBytes) {
      return;
    }

    const ordered = [...index.entries].sort(
      (left, right) => left.lastPlayedAt - right.lastPlayedAt,
    );

    for (const entry of ordered) {
      if (total <= MEDIA_CACHE_POLICY.offlineQuotaBytes) {
        break;
      }

      await this.deleteFile(entry.path);
      index.entries = index.entries.filter((item) => item.storyId !== entry.storyId);
      total -= entry.sizeBytes;
    }

    await this.saveIndex(index);
  }

  private async removeEntry(storyId: string): Promise<void> {
    const index = await this.loadIndex();
    const entry = index.entries.find((item) => item.storyId === storyId);
    if (!entry) {
      return;
    }

    await this.deleteFile(entry.path);
    index.entries = index.entries.filter((item) => item.storyId !== storyId);
    await this.saveIndex(index);
  }

  private async deleteFile(path: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path,
        directory: this.directory,
      });
    } catch {
      return;
    }
  }

  private async ensureAudioDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: MEDIA_CACHE_POLICY.audioDirectory,
        directory: this.directory,
        recursive: true,
      });
    } catch {
      return;
    }
  }

  private buildPath(storyId: string, remoteUrl: string): string {
    const extension = this.extensionFromUrl(remoteUrl);
    const safeId = storyId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${MEDIA_CACHE_POLICY.audioDirectory}/${safeId}${extension}`;
  }

  private extensionFromUrl(remoteUrl: string): string {
    try {
      const pathname = new URL(remoteUrl).pathname;
      const match = pathname.match(/\.(mp3|m4a|aac|ogg|wav)$/i);
      if (match) {
        return `.${match[1].toLowerCase()}`;
      }
    } catch {
      return '.mp3';
    }

    return '.mp3';
  }

  private async loadIndex(): Promise<AudioCacheIndex> {
    if (this.cachedIndex) {
      return this.cachedIndex;
    }

    this.cachedIndex = await this.readIndex();
    return this.cachedIndex;
  }

  private async readIndex(): Promise<AudioCacheIndex> {
    const result = await Preferences.get({ key: MEDIA_CACHE_POLICY.audioIndexKey });
    if (!result.value) {
      return { entries: [] };
    }

    try {
      const parsed = JSON.parse(result.value) as AudioCacheIndex;
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      };
    } catch {
      return { entries: [] };
    }
  }

  private async saveIndex(index: AudioCacheIndex): Promise<void> {
    this.cachedIndex = index;
    await Preferences.set({
      key: MEDIA_CACHE_POLICY.audioIndexKey,
      value: JSON.stringify(index),
    });
  }
}
