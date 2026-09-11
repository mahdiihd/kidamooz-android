import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonInput, IonItem, IonList, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline } from 'ionicons/icons';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({ logInOutline, personOutline });

export function normalizeAuthDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0))).trim();
}

@Component({
  selector: 'app-member-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, IonInput, IonItem, IonList, IonSpinner, PageHeaderComponent, StarsBackgroundComponent, TranslatePipe],
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
  private sentMobile = '';
  private retryAt = 0;

  constructor() {
    const timer = setInterval(() => this.remaining.set(Math.max(0, Math.ceil((this.retryAt - Date.now()) / 1000))), 1000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
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
    this.auth.requestOtp(mobile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.sentMobile = mobile;
        this.code = '';
        this.codeSent.set(true);
        this.retryAt = Date.now() + result.retryAfterSeconds * 1000;
        this.remaining.set(result.retryAfterSeconds);
        this.loading.set(false);
      },
      error: err => this.showError(err),
    });
  }

  changeMobile(): void {
    if (this.loading()) return;
    this.codeSent.set(false);
    this.code = '';
    this.error.set('');
  }

  private openDestination(): void {
    void this.router.navigateByUrl(this.auth.profile()?.profileComplete === false ? '/tabs/profile' : '/tabs/home', { replaceUrl: true });
  }

  private showError(err: { error?: { message?: string } }): void {
    this.loading.set(false);
    this.error.set(err?.error?.message || this.translations.translate('auth.failed'));
  }
}
