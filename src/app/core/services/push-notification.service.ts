import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';
import { catchError, of } from 'rxjs';

import { ApiService } from './api.service';

export interface InAppPushBanner {
  title: string;
  body: string;
  storyId?: string;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly banner = signal<InAppPushBanner | null>(null);

  private bannerHideTimer: ReturnType<typeof setTimeout> | null = null;
  private listenersBound = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      await this.ensureChannel();
      this.bindListeners();

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        return;
      }

      await PushNotifications.register();
    } catch {
      return;
    }
  }

  dismissBanner(): void {
    this.clearBannerTimer();
    this.banner.set(null);
  }

  openBannerStory(): void {
    const storyId = this.banner()?.storyId;
    this.dismissBanner();
    if (storyId) {
      void this.router.navigateByUrl(`/story/${storyId}`);
    }
  }

  private bindListeners(): void {
    if (this.listenersBound) {
      return;
    }
    this.listenersBound = true;

    void PushNotifications.addListener('registration', (token: Token) => {
      void this.registerToken(token.value);
    });

    void PushNotifications.addListener('registrationError', () => undefined);

    void PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        this.showInAppBanner(notification);
      },
    );

    void PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        this.openFromNotification(action.notification);
      },
    );
  }

  private async ensureChannel(): Promise<void> {
    await PushNotifications.createChannel({
      id: 'kidamooz_stories',
      name: 'قصه‌های کیدآموز',
      description: 'خبر قصه‌ها و پیام‌های کوتاه برای کوچولوها',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#FFD166',
    });
  }

  private async registerToken(token: string): Promise<void> {
    let appVersion: string | undefined;
    try {
      const info = await App.getInfo();
      appVersion = info.version;
    } catch {
      appVersion = undefined;
    }

    this.api
      .post<void>('/api/v1/devices/register', {
        token,
        platform: 'android',
        appVersion,
      })
      .pipe(catchError(() => of(void 0)))
      .subscribe();
  }

  private showInAppBanner(notification: PushNotificationSchema): void {
    const storyId = this.readStoryId(notification);
    this.clearBannerTimer();
    this.banner.set({
      title: notification.title?.trim() || 'کیدآموز',
      body: notification.body?.trim() || '',
      storyId,
    });
    this.bannerHideTimer = setTimeout(() => this.dismissBanner(), 5200);
  }

  private openFromNotification(notification: PushNotificationSchema): void {
    const storyId = this.readStoryId(notification);
    if (storyId) {
      void this.router.navigateByUrl(`/story/${storyId}`);
    }
  }

  private readStoryId(notification: PushNotificationSchema): string | undefined {
    const data = notification.data as Record<string, unknown> | undefined;
    const raw = data?.['storyId'] ?? data?.['story_id'];
    if (typeof raw !== 'string') {
      return undefined;
    }

    const storyId = raw.trim();
    return storyId.length > 0 ? storyId : undefined;
  }

  private clearBannerTimer(): void {
    if (this.bannerHideTimer) {
      clearTimeout(this.bannerHideTimer);
      this.bannerHideTimer = null;
    }
  }
}
