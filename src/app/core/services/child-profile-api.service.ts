import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ChildProfile } from '../models/member-feature.model';
import { sanitizePlainText } from '../utils/sanitize.util';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ChildProfileApiService {
  private readonly api = inject(ApiService);
  private readonly base = '/api/v1/me/children';

  list(): Observable<ChildProfile[]> {
    return this.api.get<unknown>(this.base).pipe(
      map((items) => (Array.isArray(items) ? items : []).map((raw) => this.normalize(raw)))
    );
  }

  create(body: { name: string; age: number; avatarKey?: string }): Observable<ChildProfile> {
    return this.api
      .post<unknown>(this.base, {
        name: sanitizePlainText(body.name, 100),
        age: body.age,
        avatarKey: body.avatarKey ?? 'moon',
      })
      .pipe(map((raw) => this.normalize(raw)));
  }

  update(
    id: string,
    body: { name: string; age: number; avatarKey?: string }
  ): Observable<ChildProfile> {
    return this.api
      .patch<unknown>(`${this.base}/${id}`, {
        name: sanitizePlainText(body.name, 100),
        age: body.age,
        avatarKey: body.avatarKey ?? 'moon',
      })
      .pipe(map((raw) => this.normalize(raw)));
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }

  private normalize(raw: unknown): ChildProfile {
    const data = (raw ?? {}) as Record<string, unknown>;
    return {
      id: String(data['id'] ?? data['Id'] ?? ''),
      name: sanitizePlainText(String(data['name'] ?? data['Name'] ?? ''), 100),
      age: Number(data['age'] ?? data['Age'] ?? 5),
      avatarKey: String(data['avatarKey'] ?? data['AvatarKey'] ?? 'moon'),
      isActive: Boolean(data['isActive'] ?? data['IsActive'] ?? true),
      createdAt: String(data['createdAt'] ?? data['CreatedAt'] ?? ''),
      updatedAt: String(data['updatedAt'] ?? data['UpdatedAt'] ?? ''),
    };
  }
}
