import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

import { CACHE_POLICY } from '../config/cache-policy';
import { CatalogCachePayload } from '../models/catalog-cache.model';

@Injectable({ providedIn: 'root' })
export class CatalogStorageService {
  async load(): Promise<CatalogCachePayload | null> {
    const raw = await this.readRaw();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CatalogCachePayload;
    } catch {
      await this.clear();
      return null;
    }
  }

  async save(payload: CatalogCachePayload): Promise<boolean> {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json).length;

    if (bytes > CACHE_POLICY.maxCatalogBytes) {
      console.warn(
        `Catalog cache (${bytes} bytes) exceeds limit (${CACHE_POLICY.maxCatalogBytes}), skipping persist`
      );
      return false;
    }

    if (Capacitor.isNativePlatform()) {
      await Preferences.set({
        key: CACHE_POLICY.catalogStorageKey,
        value: json,
      });
    } else {
      localStorage.setItem(CACHE_POLICY.catalogStorageKey, json);
    }

    return true;
  }

  async clear(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: CACHE_POLICY.catalogStorageKey });
      return;
    }

    localStorage.removeItem(CACHE_POLICY.catalogStorageKey);
  }

  private async readRaw(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const result = await Preferences.get({ key: CACHE_POLICY.catalogStorageKey });
      return result.value;
    }

    return localStorage.getItem(CACHE_POLICY.catalogStorageKey);
  }
}
