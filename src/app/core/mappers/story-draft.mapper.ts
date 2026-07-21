import { StoryDraft } from '../models/story-draft.model';
import { sanitizeMediaUrl, sanitizePlainText } from '../utils/sanitize.util';

export function sanitizeStoryDraft(draft: StoryDraft): StoryDraft {
  return {
    ...draft,
    drawingUrl: sanitizeMediaUrl(draft.drawingUrl),
    coverUrl: sanitizeMediaUrl(draft.coverUrl),
    audioUrl: sanitizeMediaUrl(draft.audioUrl),
    titleFa: sanitizePlainText(draft.titleFa, 300),
    descriptionFa: sanitizePlainText(draft.descriptionFa, 2000),
    storyScript: sanitizePlainText(draft.storyScript, 8000),
    errorMessage: draft.errorMessage
      ? sanitizePlainText(draft.errorMessage, 500)
      : draft.errorMessage,
    rejectReason: draft.rejectReason
      ? sanitizePlainText(draft.rejectReason, 500)
      : draft.rejectReason,
    authorName: draft.authorName
      ? sanitizePlainText(draft.authorName, 200)
      : draft.authorName,
  };
}
