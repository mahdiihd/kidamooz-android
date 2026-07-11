export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface StoriesQuery {
  categoryId?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}
