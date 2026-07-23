import { StoryDraft } from '../models/story-draft.model';
import { sanitizeMediaUrl, sanitizePlainText } from '../utils/sanitize.util';

export function sanitizeStoryDraft(raw: StoryDraft | Record<string, unknown>): StoryDraft {
  const draft = raw as StoryDraft & Record<string, unknown>;
  return {
    id: String(draft.id ?? draft['Id'] ?? ''),
    status: String(draft.status ?? draft['Status'] ?? ''),
    drawingUrl: sanitizeMediaUrl(
      (draft.drawingUrl as string | null | undefined) ??
        (draft['DrawingUrl'] as string | null | undefined) ??
        null
    ),
    coverUrl: sanitizeMediaUrl(
      (draft.coverUrl as string | null | undefined) ??
        (draft['CoverUrl'] as string | null | undefined) ??
        null
    ),
    usedFallbackCover: Boolean(draft.usedFallbackCover ?? draft['UsedFallbackCover']),
    titleFa: sanitizePlainText(String(draft.titleFa ?? draft['TitleFa'] ?? ''), 300),
    descriptionFa: sanitizePlainText(
      String(draft.descriptionFa ?? draft['DescriptionFa'] ?? ''),
      2000
    ),
    storyScript: sanitizePlainText(String(draft.storyScript ?? draft['StoryScript'] ?? ''), 8000),
    challengeTag: (() => {
      const raw =
        (draft.challengeTag as string | null | undefined) ??
        (draft['ChallengeTag'] as string | null | undefined) ??
        null;
      return raw ? sanitizePlainText(raw, 64) : null;
    })(),
    audioUrl: sanitizeMediaUrl(
      (draft.audioUrl as string | null | undefined) ??
        (draft['AudioUrl'] as string | null | undefined) ??
        null
    ),
    durationSeconds:
      (draft.durationSeconds as number | null | undefined) ??
      (draft['DurationSeconds'] as number | null | undefined) ??
      null,
    publishedStoryId:
      (draft.publishedStoryId as string | null | undefined) ??
      (draft['PublishedStoryId'] as string | null | undefined) ??
      null,
    errorMessage: draft.errorMessage || draft['ErrorMessage']
      ? sanitizePlainText(String(draft.errorMessage ?? draft['ErrorMessage']), 500)
      : null,
    rejectReason: draft.rejectReason || draft['RejectReason']
      ? sanitizePlainText(String(draft.rejectReason ?? draft['RejectReason']), 500)
      : null,
    authorName: draft.authorName || draft['AuthorName']
      ? sanitizePlainText(String(draft.authorName ?? draft['AuthorName']), 200)
      : null,
    authorMobile:
      (draft.authorMobile as string | null | undefined) ??
      (draft['AuthorMobile'] as string | null | undefined) ??
      null,
    submittedAt:
      (draft.submittedAt as string | null | undefined) ??
      (draft['SubmittedAt'] as string | null | undefined) ??
      null,
    createdAt: String(draft.createdAt ?? draft['CreatedAt'] ?? ''),
    updatedAt: String(draft.updatedAt ?? draft['UpdatedAt'] ?? ''),
  };
}
