import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DeviceIdService } from './device-id.service';
import { MemberAuthService } from './member-auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly deviceIds = inject(DeviceIdService);
  private readonly auth = inject(MemberAuthService);

  get<T>(path: string): Observable<T> {
    return this.withHeaders((headers) =>
      this.http.get<T>(`${environment.apiBaseUrl}${path}`, { headers })
    );
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.withHeaders((headers) =>
      this.http.post<T>(`${environment.apiBaseUrl}${path}`, body, { headers })
    );
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.withHeaders((headers) =>
      this.http.patch<T>(`${environment.apiBaseUrl}${path}`, body, { headers })
    );
  }

  postForm<T>(path: string, form: FormData): Observable<T> {
    return from(
      Promise.all([this.deviceIds.getDeviceId(), this.auth.getAccessToken()])
    ).pipe(
      switchMap(([deviceId, token]) => {
        let headers = new HttpHeaders({ 'X-Device-Id': deviceId });
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return this.http.post<T>(`${environment.apiBaseUrl}${path}`, form, { headers });
      })
    );
  }

  private withHeaders<T>(call: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(
      Promise.all([this.deviceIds.getDeviceId(), this.auth.getAccessToken()])
    ).pipe(
      switchMap(([deviceId, token]) => {
        let headers = new HttpHeaders({ 'X-Device-Id': deviceId });
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return call(headers);
      })
    );
  }
}
