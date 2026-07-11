import { Injectable, inject } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MOCK_CATALOG_VERSION } from '../data/mock-catalog-version';
import { MOCK_CATEGORIES, MOCK_STORIES } from '../data/mock-data';
import {
  mapCategory,
  mapStory,
  mapStoryDetail,
} from '../mappers/catalog.mapper';
import { PaginatedResponse, StoriesQuery } from '../models/api-response.model';
import { CatalogVersion } from '../models/catalog-version.model';
import { Category } from '../models/category.model';
import { Story, StoryDetail } from '../models/story.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StoryApiService {
  private readonly api = inject(ApiService);

  getCatalogVersion(): Observable<CatalogVersion> {
    if (environment.useMock) {
      return of({
        version: MOCK_CATALOG_VERSION,
        updatedAt: new Date().toISOString(),
      });
    }

    return this.api.get<CatalogVersion>('/api/v1/catalog/version');
  }

  getCategories(): Observable<Category[]> {
    if (environment.useMock) {
      return of(MOCK_CATEGORIES);
    }

    return this.api
      .get<unknown[]>('/api/v1/categories')
      .pipe(map((items) => items.map((item) => mapCategory(item as never))));
  }

  getStories(query: StoriesQuery = {}): Observable<PaginatedResponse<Story>> {
    if (environment.useMock) {
      return of(this.filterMockStories(query));
    }

    const params = new URLSearchParams();
    if (query.categoryId) {
      params.set('categoryId', query.categoryId);
    }
    if (query.featured != null) {
      params.set('featured', String(query.featured));
    }
    if (query.page) {
      params.set('page', String(query.page));
    }
    if (query.limit) {
      params.set('limit', String(query.limit));
    }

    const queryString = params.toString();
    const path = queryString
      ? `/api/v1/stories?${queryString}`
      : '/api/v1/stories';

    return this.api.get<PaginatedResponse<unknown>>(path).pipe(
      map((response) => ({
        items: response.items.map((item) => mapStory(item as never)),
        total: response.total,
      })),
    );
  }

  getStoryById(id: string): Observable<StoryDetail> {
    if (environment.useMock) {
      const story = MOCK_STORIES.find((item) => item.id === id);
      if (!story) {
        return throwError(() => new Error('Story not found'));
      }
      return of(story);
    }

    return this.api
      .get<unknown>(`/api/v1/stories/${id}`)
      .pipe(map((item) => mapStoryDetail(item as never)));
  }

  private filterMockStories(query: StoriesQuery): PaginatedResponse<Story> {
    let filtered = query.categoryId
      ? MOCK_STORIES.filter((story) => story.categoryId === query.categoryId)
      : MOCK_STORIES;

    if (query.featured != null) {
      filtered = filtered.filter((story) => Boolean(story.featured) === query.featured);
    }

    const limit = query.limit ?? filtered.length;
    const page = query.page ?? 1;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total: filtered.length };
  }
}
