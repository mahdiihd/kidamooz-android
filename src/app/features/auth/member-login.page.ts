import { Component, DestroyRef, OnInit, inject, signal, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { IonContent, IonIcon, IonInput, IonItem, IonList, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, refreshOutline, createOutline } from 'ionicons/icons';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MoonMascotComponent } from '../../shared/components/moon-mascot/moon-mascot.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({ logInOutline, refreshOutline, createOutline });

interface OtpReaderPlugin {
  start(): Promise<{ code: string }>;
  stop(): Promise<void>;
}

const OtpReader = registerPlugin<OtpReaderPlugin>('OtpReader');

export function normalizeAuthDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0))).trim();
}

@Component({
  selector: 'app-member-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, IonInput, IonItem, IonList, IonSpinner, PageHeaderComponent, MoonMascotComponent, StarsBackgroundComponent, TranslatePipe],
  templateUrl: './member-login.page.html',
  styleUrl: './member-login.page.scss',
})
export class MemberLoginPage implements OnInit {
  private readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);
  private readonly translations = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
  mobile = '';
  code = '';
  readonly codeSent = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly remaining = signal(0);
  private readonly zone = inject(NgZone);
  private sentMobile = '';
  private retryAt = 0;

  constructor() {
    const timer = setInterval(() => this.remaining.set(Math.max(0, Math.ceil((this.retryAt - Date.now()) / 1000))), 1000);
    this.destroyRef.onDestroy(() => { clearInterval(timer); this.stopOtpAutofill(); });
  }

  async ngOnInit(): Promise<void> {
    await this.auth.getAccessToken();
    if (this.auth.loggedIn()) this.openDestination();
  }

  submit(): void {
    if (this.loading()) return;
    if (!this.codeSent()) { this.sendCode(); return; }
    const code = normalizeAuthDigits(this.code);
    if (!/^\d{6}$/.test(code)) {
      this.error.set(this.translations.translate('auth.invalidCode'));
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.stopOtpAutofill();
    this.auth.verifyOtp(this.sentMobile, code).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.loading.set(false); this.openDestination(); },
      error: err => this.showError(err),
    });
  }

  sendCode(): void {
    if (this.loading() || this.remaining() > 0) return;
    const mobile = normalizeAuthDigits(this.mobile);
    if (!/^09\d{9}$/.test(mobile)) {
      this.error.set(this.translations.translate('auth.invalidMobile'));
      return;
    }
    this.mobile = mobile;
    this.error.set('');
    this.loading.set(true);
    this.code = '';
    this.startOtpAutofill(mobile);
    this.auth.requestOtp(mobile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.sentMobile = mobile;
        this.codeSent.set(true);
        this.retryAt = Date.now() + result.retryAfterSeconds * 1000;
        this.remaining.set(result.retryAfterSeconds);
        this.loading.set(false);
        if (/^\d{6}$/.test(normalizeAuthDigits(this.code))) this.submit();
      },
      error: err => {
        if (err?.status === 429) {
          this.sentMobile = mobile;
          this.codeSent.set(true);
          this.retryAt = Date.now() + 60000;
          this.remaining.set(60);
        }
        if (err?.status !== 429) this.stopOtpAutofill();
        this.showError(err);
      },
    });
  }

  enterExistingCode(): void {
    const mobile = normalizeAuthDigits(this.mobile);
    if (this.loading()) return;
    if (!/^09\d{9}$/.test(mobile)) {
      this.error.set(this.translations.translate('auth.invalidMobile'));
      return;
    }
    this.mobile = mobile;
    this.sentMobile = mobile;
    this.codeSent.set(true);
    this.error.set('');
  }

  changeMobile(): void {
    if (this.loading()) return;
    this.stopOtpAutofill();
    this.codeSent.set(false);
    this.code = '';
    this.error.set('');
  }

  private stopOtpAutofill(): void {
    if (Capacitor.isNativePlatform()) void OtpReader.stop().catch(() => undefined);
  }

  private startOtpAutofill(mobile: string): void {
    if (Capacitor.isNativePlatform()) {
      void OtpReader.start().then(result => {
        if (normalizeAuthDigits(this.mobile) !== mobile) return;
        const code = normalizeAuthDigits(result.code ?? '');
        if (/^\d{6}$/.test(code)) this.applyAutofilledCode(code);
      }).catch(() => { /* Consent denial and unsupported devices retain manual entry. */ });
    }
  }

  private applyAutofilledCode(code: string): void {
    this.zone.run(() => {
      this.code = code;
      if (this.codeSent() && !this.loading()) this.submit();
    });
  }

  private openDestination(): void {
    void this.router.navigateByUrl(this.auth.profile()?.profileComplete === false ? '/tabs/profile' : '/tabs/home', { replaceUrl: true });
  }

  private showError(err: { error?: { message?: string } }): void {
    this.loading.set(false);
    this.error.set(err?.error?.message || this.translations.translate('auth.failed'));
  }
}
