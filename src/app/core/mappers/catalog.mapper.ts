import { Category } from '../models/category.model';
import { Story, StoryChapter, StoryDetail } from '../models/story.model';
import { sanitizeMediaUrl, sanitizePlainText } from '../utils/sanitize.util';

interface LocalizedTextDto {
  fa?: string;
  en?: string;
}

interface CategoryApiDto {
  id: string;
  title?: string | LocalizedTextDto;
  titleFa?: string;
  titleEn?: string;
  slug: string;
  iconUrl: string;
  color: string;
}

interface StoryApiDto {
  id: string;
  title?: string;
  titleFa?: string;
  titleEn?: string;
  description?: string;
  descriptionFa?: string;
  descriptionEn?: string;
  coverUrl: string;
  audioUrl: string;
  uploadedAudioUrl?: string | null;
  preferredNarration?: 'ai' | 'user' | string;
  durationSeconds: number;
  ageMin: number;
  ageMax: number;
  categoryId: string;
  progressIcon?: string;
  featured?: boolean;
  sortOrder?: number;
  authorName?: string | null;
  chapters?: ChapterApiDto[];
}

interface ChapterApiDto {
  title?: string | LocalizedTextDto;
  titleFa?: string;
  titleEn?: string;
  startSeconds: number;
  imageUrl: string;
}

function resolveLocalized(
  value: string | LocalizedTextDto | undefined,
  fallbackFa?: string,
  fallbackEn?: string,
): { fa: string; en: string } {
  if (typeof value === 'string') {
    return {
      fa: sanitizePlainText(value || fallbackFa || '', 300),
      en: sanitizePlainText(fallbackEn || value || fallbackFa || '', 300),
    };
  }

  return {
    fa: sanitizePlainText(value?.fa || fallbackFa || value?.en || '', 300),
    en: sanitizePlainText(value?.en || fallbackEn || value?.fa || '', 300),
  };
}

export function mapCategory(dto: CategoryApiDto): Category {
  const title = resolveLocalized(dto.title, dto.titleFa, dto.titleEn);
  return {
    id: dto.id,
    title: title.fa,
    titleFa: title.fa,
    titleEn: title.en,
    slug: dto.slug,
    iconUrl: sanitizeMediaUrl(dto.iconUrl) ?? '',
    color: dto.color,
  };
}

export function mapStory(dto: StoryApiDto): Story {
  const titleFa = sanitizePlainText(dto.titleFa || dto.title || '', 300);
  const titleEn = sanitizePlainText(dto.titleEn || dto.title || titleFa, 300);
  const descriptionFa = sanitizePlainText(dto.descriptionFa || dto.description || '', 2000);
  const descriptionEn = sanitizePlainText(
    dto.descriptionEn || dto.description || descriptionFa,
    2000,
  );

  return {
    id: dto.id,
    title: titleFa,
    titleFa,
    titleEn,
    description: descriptionFa,
    descriptionFa,
    descriptionEn,
    coverUrl: sanitizeMediaUrl(dto.coverUrl) ?? '',
    audioUrl: sanitizeMediaUrl(dto.audioUrl) ?? '',
    uploadedAudioUrl: sanitizeMediaUrl(dto.uploadedAudioUrl ?? null),
    preferredNarration: dto.preferredNarration === 'user' ? 'user' : 'ai',
    durationSeconds: dto.durationSeconds,
    ageMin: dto.ageMin,
    ageMax: dto.ageMax,
    categoryId: dto.categoryId,
    progressIcon: dto.progressIcon,
    featured: dto.featured,
    sortOrder: dto.sortOrder,
    authorName: dto.authorName
      ? sanitizePlainText(dto.authorName, 200)
      : null,
  };
}

export function mapChapter(dto: ChapterApiDto): StoryChapter {
  const title = resolveLocalized(dto.title, dto.titleFa, dto.titleEn);
  return {
    title: title.fa,
    titleFa: title.fa,
    titleEn: title.en,
    startSeconds: dto.startSeconds,
    imageUrl: sanitizeMediaUrl(dto.imageUrl) ?? '',
  };
}

export function mapStoryDetail(dto: StoryApiDto): StoryDetail {
  return {
    ...mapStory(dto),
    chapters: dto.chapters?.map(mapChapter),
  };
}
