import { Category } from './category.model';
import { StoryDetail } from './story.model';

export interface CatalogCachePayload {
  version: string;
  categories: Category[];
  stories: StoryDetail[];
  fetchedAt: number;
}

export type CatalogStoreStatus = 'idle' | 'hydrating' | 'ready' | 'error';
