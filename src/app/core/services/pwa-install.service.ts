import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

type InstallHint = 'android' | 'ios' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const NeverShowKey = 'pwa_install_never';
const LastShownDayKey = 'pwa_install_last_shown_day';
const ShowDelayMs = 1600;

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  readonly visible = signal(false);
  readonly hint = signal<InstallHint>('other');
  readonly canNativePrompt = signal(false);

  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform() || this.isStandalone() || !this.isMobileBrowser()) {
      return;
    }

    if (await this.shouldNeverShow()) {
      return;
    }

    if (await this.wasShownToday()) {
      return;
    }

    this.hint.set(this.detectHint());
    this.bindInstallEvents();

    this.showTimer = setTimeout(() => {
      void this.revealOnceToday();
    }, ShowDelayMs);
  }

  async install(): Promise<void> {
    const promptEvent = this.deferredPrompt;
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    this.deferredPrompt = null;
    this.canNativePrompt.set(false);

    if (choice.outcome === 'accepted') {
      await this.markInstalledForever();
    }
  }

  async dismiss(): Promise<void> {
    this.visible.set(false);
    this.clearShowTimer();
    await this.markShownToday();
  }

  private async revealOnceToday(): Promise<void> {
    if (this.isStandalone() || (await this.shouldNeverShow()) || (await this.wasShownToday())) {
      return;
    }

    this.visible.set(true);
    await this.markShownToday();
  }

  private async markInstalledForever(): Promise<void> {
    this.visible.set(false);
    this.clearShowTimer();
    await Preferences.set({ key: NeverShowKey, value: '1' });
  }

  private async markShownToday(): Promise<void> {
    await Preferences.set({
      key: LastShownDayKey,
      value: this.todayKey(),
    });
  }

  private async shouldNeverShow(): Promise<boolean> {
    if (this.isStandalone()) {
      return true;
    }
    const stored = await Preferences.get({ key: NeverShowKey });
    return stored.value === '1';
  }

  private async wasShownToday(): Promise<boolean> {
    const stored = await Preferences.get({ key: LastShownDayKey });
    return stored.value === this.todayKey();
  }

  private todayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private clearShowTimer(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private bindInstallEvents(): void {
    window.addEventListener('beforeinstallprompt', ((event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canNativePrompt.set(true);
    }) as EventListener);

    window.addEventListener('appinstalled', () => {
      void this.markInstalledForever();
    });
  }

  private isStandalone(): boolean {
    const media = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return media || iosStandalone;
  }

  private isMobileBrowser(): boolean {
    if (window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches) {
      return true;
    }
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  private detectHint(): InstallHint {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      return 'ios';
    }
    if (/Android/i.test(ua)) {
      return 'android';
    }
    return 'other';
  }
}
