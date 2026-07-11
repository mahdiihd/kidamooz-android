import { Category } from '../models/category.model';
import { Story, StoryChapter, StoryDetail } from '../models/story.model';

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
  durationSeconds: number;
  ageMin: number;
  ageMax: number;
  categoryId: string;
  featured?: boolean;
  sortOrder?: number;
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
      fa: value || fallbackFa || '',
      en: fallbackEn || value || fallbackFa || '',
    };
  }

  return {
    fa: value?.fa || fallbackFa || value?.en || '',
    en: value?.en || fallbackEn || value?.fa || '',
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
    iconUrl: dto.iconUrl,
    color: dto.color,
  };
}

export function mapStory(dto: StoryApiDto): Story {
  const titleFa = dto.titleFa || dto.title || '';
  const titleEn = dto.titleEn || dto.title || titleFa;
  const descriptionFa = dto.descriptionFa || dto.description || '';
  const descriptionEn = dto.descriptionEn || dto.description || descriptionFa;

  return {
    id: dto.id,
    title: titleFa,
    titleFa,
    titleEn,
    description: descriptionFa,
    descriptionFa,
    descriptionEn,
    coverUrl: dto.coverUrl,
    audioUrl: dto.audioUrl,
    durationSeconds: dto.durationSeconds,
    ageMin: dto.ageMin,
    ageMax: dto.ageMax,
    categoryId: dto.categoryId,
    featured: dto.featured,
    sortOrder: dto.sortOrder,
  };
}

export function mapChapter(dto: ChapterApiDto): StoryChapter {
  const title = resolveLocalized(dto.title, dto.titleFa, dto.titleEn);
  return {
    title: title.fa,
    titleFa: title.fa,
    titleEn: title.en,
    startSeconds: dto.startSeconds,
    imageUrl: dto.imageUrl,
  };
}

export function mapStoryDetail(dto: StoryApiDto): StoryDetail {
  return {
    ...mapStory(dto),
    chapters: dto.chapters?.map(mapChapter),
  };
}
