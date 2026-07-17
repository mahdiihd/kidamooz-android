import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const FAVORITES_KEY = 'kidamooz.favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
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
    await Preferences.set({
      key: FAVORITES_KEY,
      value: JSON.stringify([...next]),
    });
    return added;
  }
}
