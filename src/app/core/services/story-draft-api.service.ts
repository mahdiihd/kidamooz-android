import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { sanitizeStoryDraft } from '../mappers/story-draft.mapper';
import { StoryDraft, StoryDraftQuota } from '../models/story-draft.model';
import { sanitizePlainText } from '../utils/sanitize.util';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StoryDraftApiService {
  private readonly api = inject(ApiService);
  private readonly base = '/api/v1/me/story-drafts';

  list(): Observable<StoryDraft[]> {
    return this.api
      .get<StoryDraft[]>(this.base)
      .pipe(map((items) => items.map(sanitizeStoryDraft)));
  }

  quota(): Observable<StoryDraftQuota> {
    return this.api.get<StoryDraftQuota & Record<string, unknown>>(`${this.base}/quota`).pipe(
      map((raw) => ({
        canCreateToday: Boolean(raw.canCreateToday ?? raw['CanCreateToday']),
        dailyLimit: Number(raw.dailyLimit ?? raw['DailyLimit'] ?? 1),
        usedToday: Number(raw.usedToday ?? raw['UsedToday'] ?? 0),
        nextAvailableAt:
          (raw.nextAvailableAt as string | null | undefined) ??
          (raw['NextAvailableAt'] as string | null | undefined) ??
          null,
        planTier: String(raw.planTier ?? raw['PlanTier'] ?? 'free'),
        isPlus: Boolean(raw.isPlus ?? raw['IsPlus']),
      }))
    );
  }

  get(id: string): Observable<StoryDraft> {
    return this.api
      .get<StoryDraft>(`${this.base}/${id}`)
      .pipe(map(sanitizeStoryDraft));
  }

  createFromDrawing(file: Blob, fileName: string): Observable<StoryDraft> {
    const form = new FormData();
    form.append('drawing', file, fileName);
    return this.api.postForm<StoryDraft>(this.base, form).pipe(map(sanitizeStoryDraft));
  }

  update(
    id: string,
    body: {
      titleFa?: string;
      descriptionFa?: string;
      storyScript?: string;
      challengeTag?: string | null;
    }
  ): Observable<StoryDraft> {
    return this.api
      .patch<StoryDraft>(`${this.base}/${id}`, {
        titleFa: body.titleFa == null ? undefined : sanitizePlainText(body.titleFa, 300),
        descriptionFa:
          body.descriptionFa == null
            ? undefined
            : sanitizePlainText(body.descriptionFa, 2000),
        storyScript:
          body.storyScript == null ? undefined : sanitizePlainText(body.storyScript, 8000),
        challengeTag: body.challengeTag,
      })
      .pipe(map(sanitizeStoryDraft));
  }

  rewrite(id: string, mode: 'polish' | 'shorter' = 'polish'): Observable<StoryDraft> {
    return this.api
      .post<StoryDraft>(`${this.base}/${id}/rewrite`, { mode })
      .pipe(map(sanitizeStoryDraft));
  }

  regenerateCover(id: string): Observable<StoryDraft> {
    return this.api
      .post<StoryDraft>(`${this.base}/${id}/cover/regenerate`, {})
      .pipe(map(sanitizeStoryDraft));
  }

  uploadAudio(
    id: string,
    file: Blob,
    fileName: string,
    durationSeconds?: number
  ): Observable<StoryDraft> {
    const form = new FormData();
    form.append('audio', file, fileName);
    if (durationSeconds != null) {
      form.append('durationSeconds', String(Math.round(durationSeconds)));
    }
    return this.api
      .postForm<StoryDraft>(`${this.base}/${id}/audio`, form)
      .pipe(map(sanitizeStoryDraft));
  }

  submit(id: string): Observable<StoryDraft> {
    return this.api
      .post<StoryDraft>(`${this.base}/${id}/submit`, {})
      .pipe(map(sanitizeStoryDraft));
  }
}
