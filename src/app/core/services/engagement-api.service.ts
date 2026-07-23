import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  MemberEngagement,
  StoryOfTheDay,
  WeeklyChallenge,
} from '../models/member-feature.model';
import { sanitizeMediaUrl, sanitizePlainText } from '../utils/sanitize.util';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EngagementApiService {
  private readonly api = inject(ApiService);

  storyOfTheDay(): Observable<StoryOfTheDay> {
    return this.api
      .get<StoryOfTheDay & Record<string, unknown>>('/api/v1/engagement/story-of-the-day')
      .pipe(map((raw) => this.normalizeStoryOfDay(raw)));
  }

  weeklyChallenge(): Observable<WeeklyChallenge> {
    return this.api
      .get<WeeklyChallenge & Record<string, unknown>>('/api/v1/engagement/weekly-challenge')
      .pipe(map((raw) => this.normalizeChallenge(raw)));
  }

  me(): Observable<MemberEngagement> {
    return this.api
      .get<MemberEngagement & Record<string, unknown>>('/api/v1/me/engagement')
      .pipe(map((raw) => this.normalizeEngagement(raw)));
  }

  recordListen(storyId: string, positionSeconds?: number): Observable<MemberEngagement> {
    return this.api
      .post<MemberEngagement & Record<string, unknown>>('/api/v1/me/engagement/listen', {
        storyId,
        positionSeconds,
      })
      .pipe(map((raw) => this.normalizeEngagement(raw)));
  }

  redeemPlus(code: string): Observable<MemberEngagement> {
    return this.api
      .post<MemberEngagement & Record<string, unknown>>('/api/v1/me/engagement/redeem-plus', {
        code,
      })
      .pipe(map((raw) => this.normalizeEngagement(raw)));
  }

  private normalizeStoryOfDay(raw: StoryOfTheDay & Record<string, unknown>): StoryOfTheDay {
    return {
      pickDate: String(raw.pickDate ?? raw['PickDate'] ?? ''),
      storyId: String(raw.storyId ?? raw['StoryId'] ?? ''),
      titleFa: sanitizePlainText(String(raw.titleFa ?? raw['TitleFa'] ?? ''), 300),
      coverUrl: sanitizeMediaUrl(
        (raw.coverUrl as string | null | undefined) ??
          (raw['CoverUrl'] as string | null | undefined) ??
          null
      ),
      durationSeconds: Number(raw.durationSeconds ?? raw['DurationSeconds'] ?? 0),
    };
  }

  private normalizeChallenge(raw: WeeklyChallenge & Record<string, unknown>): WeeklyChallenge {
    return {
      id: String(raw.id ?? raw['Id'] ?? ''),
      titleFa: sanitizePlainText(String(raw.titleFa ?? raw['TitleFa'] ?? ''), 200),
      themeTag: String(raw.themeTag ?? raw['ThemeTag'] ?? ''),
      descriptionFa: sanitizePlainText(
        String(raw.descriptionFa ?? raw['DescriptionFa'] ?? ''),
        500
      ),
      weekStart: String(raw.weekStart ?? raw['WeekStart'] ?? ''),
      weekEnd: String(raw.weekEnd ?? raw['WeekEnd'] ?? ''),
    };
  }

  private normalizeEngagement(raw: MemberEngagement & Record<string, unknown>): MemberEngagement {
    return {
      listenStreak: Number(raw.listenStreak ?? raw['ListenStreak'] ?? 0),
      createStreak: Number(raw.createStreak ?? raw['CreateStreak'] ?? 0),
      lastPlayedStoryId:
        (raw.lastPlayedStoryId as string | null | undefined) ??
        (raw['LastPlayedStoryId'] as string | null | undefined) ??
        null,
      lastPlayedPositionSeconds:
        (raw.lastPlayedPositionSeconds as number | null | undefined) ??
        (raw['LastPlayedPositionSeconds'] as number | null | undefined) ??
        null,
      planTier: String(raw.planTier ?? raw['PlanTier'] ?? 'free'),
      plusExpiresAt:
        (raw.plusExpiresAt as string | null | undefined) ??
        (raw['PlusExpiresAt'] as string | null | undefined) ??
        null,
      canDownloadOffline: Boolean(raw.canDownloadOffline ?? raw['CanDownloadOffline']),
      adsEnabled: Boolean(raw.adsEnabled ?? raw['AdsEnabled'] ?? true),
      dailyCreateLimit: Number(raw.dailyCreateLimit ?? raw['DailyCreateLimit'] ?? 1),
    };
  }
}
