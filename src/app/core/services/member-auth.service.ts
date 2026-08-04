import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable, from, map, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MemberAuthResponse, MemberProfile } from '../models/story-draft.model';
import { sanitizePlainText } from '../utils/sanitize.util';
import { FavoritesService } from './favorites.service';
import { ParentSettingsService } from './parent-settings.service';

const TokenKey = 'kidamooz.memberToken';
const ProfileKey = 'kidamooz.memberProfile';

@Injectable({ providedIn: 'root' })
export class MemberAuthService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly base = `${environment.apiBaseUrl}/api/v1/auth`;

  private readonly token = signal<string | null>(null);
  readonly profile = signal<MemberProfile | null>(null);
  readonly loggedIn = computed(() => !!this.token() && !!this.profile());

  private hydratePromise: Promise<void> | null = null;

  ensureHydrated(): Promise<void> {
    if (!this.hydratePromise) {
      this.hydratePromise = this.readFromStorage();
    }
    return this.hydratePromise;
  }

  async getAccessToken(): Promise<string | null> {
    await this.ensureHydrated();
    return this.token();
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  loginOrRegister(
    mobile: string,
    password: string,
    displayName?: string
  ): Observable<MemberProfile> {
    return this.http
      .post<MemberAuthResponse & Record<string, unknown>>(
        `${this.base}/login-or-register`,
        {
          mobile,
          password,
          displayName: displayName || undefined,
        }
      )
      .pipe(
        map((raw) => this.normalizeAuthResponse(raw)),
        switchMap((res) => from(this.persist(res)).pipe(map(() => res.user)))
      );
  }

  refreshProfile(): Observable<MemberProfile> {
    return from(this.getAccessToken()).pipe(
      switchMap((accessToken) =>
        this.http.get<MemberProfile & Record<string, unknown>>(`${this.base}/me`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        })
      ),
      map((raw) => this.normalizeProfile(raw)),
      tap((user) => {
        void this.saveProfile(user);
      })
    );
  }

  updateProfile(displayName: string): Observable<MemberProfile> {
    return from(this.getAccessToken()).pipe(
      switchMap((accessToken) =>
        this.http.patch<MemberProfile & Record<string, unknown>>(
          `${this.base}/me`,
          { displayName: sanitizePlainText(displayName, 200) },
          { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
        )
      ),
      map((raw) => this.normalizeProfile(raw)),
      switchMap((user) => from(this.saveProfile(user)).pipe(map(() => user)))
    );
  }

  async logout(): Promise<void> {
    this.token.set(null);
    this.profile.set(null);
    this.hydratePromise = null;
    await Preferences.remove({ key: TokenKey });
    await Preferences.remove({ key: ProfileKey });
    await this.clearUserScopedCaches();
  }

  private async readFromStorage(): Promise<void> {
    try {
      const [tokenResult, profileResult] = await Promise.all([
        Preferences.get({ key: TokenKey }),
        Preferences.get({ key: ProfileKey }),
      ]);
      this.token.set(tokenResult.value || null);
      if (profileResult.value) {
        this.profile.set(JSON.parse(profileResult.value) as MemberProfile);
      } else {
        this.profile.set(null);
      }
    } catch {
      this.token.set(null);
      this.profile.set(null);
    }
  }

  private async persist(res: MemberAuthResponse): Promise<void> {
    if (!res.accessToken || !res.user?.id) {
      throw new Error('پاسخ ورود نامعتبر بود.');
    }
    const previousUserId = this.profile()?.id ?? null;
    this.token.set(res.accessToken);
    this.profile.set(res.user);
    this.hydratePromise = Promise.resolve();
    await Preferences.set({ key: TokenKey, value: res.accessToken });
    await Preferences.set({ key: ProfileKey, value: JSON.stringify(res.user) });
    if (previousUserId !== res.user.id) {
      await this.clearUserScopedCaches();
      await this.injector.get(ParentSettingsService).ensureReady();
      await this.injector.get(FavoritesService).ensureReady();
    }
  }

  private async clearUserScopedCaches(): Promise<void> {
    await this.injector.get(ParentSettingsService).clearSession();
    await this.injector.get(FavoritesService).clearSession();
  }

  private async saveProfile(user: MemberProfile): Promise<void> {
    this.profile.set(user);
    await Preferences.set({ key: ProfileKey, value: JSON.stringify(user) });
  }

  private normalizeAuthResponse(raw: MemberAuthResponse & Record<string, unknown>): MemberAuthResponse {
    const accessToken =
      (raw.accessToken as string | undefined) ||
      (raw['AccessToken'] as string | undefined) ||
      '';
    const userRaw =
      (raw.user as MemberProfile & Record<string, unknown> | undefined) ||
      (raw['User'] as MemberProfile & Record<string, unknown> | undefined);
    return {
      accessToken,
      user: this.normalizeProfile(userRaw ?? {}),
    };
  }

  private normalizeProfile(raw: Partial<MemberProfile> & Record<string, unknown>): MemberProfile {
    return {
      id: String(raw.id ?? raw['Id'] ?? ''),
      mobile: String(raw.mobile ?? raw['Mobile'] ?? ''),
      displayName: sanitizePlainText(String(raw.displayName ?? raw['DisplayName'] ?? ''), 200),
    };
  }
}
