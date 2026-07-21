import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const KEY = 'kidamooz.deviceId';

@Injectable({ providedIn: 'root' })
export class DeviceIdService {
  private cached: string | null = null;

  async getDeviceId(): Promise<string> {
    if (this.cached) {
      return this.cached;
    }

    const existing = await Preferences.get({ key: KEY });
    if (existing.value && existing.value.length >= 8) {
      this.cached = existing.value;
      return this.cached;
    }

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await Preferences.set({ key: KEY, value: id });
    this.cached = id;
    return id;
  }
}
