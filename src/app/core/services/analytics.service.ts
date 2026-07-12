import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';

import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ApiService);

  trackAppOpen(): void {
    this.api
      .post<void>('/api/v1/analytics/app-open')
      .pipe(catchError(() => of(void 0)))
      .subscribe();
  }
}
