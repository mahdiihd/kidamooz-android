export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface StoriesQuery {
  categoryId?: string;
  page?: number;
  limit?: number;
}
