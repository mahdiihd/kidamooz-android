import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline } from 'ionicons/icons';

import { MemberAuthService } from '../../core/services/member-auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({ logInOutline, personOutline });

@Component({
  selector: 'app-member-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonSpinner,
    PageHeaderComponent,
    StarsBackgroundComponent,
    TranslatePipe,
  ],
  templateUrl: './member-login.page.html',
  styleUrl: './member-login.page.scss',
})
export class MemberLoginPage implements OnInit {
  private readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);

  mobile = '';
  password = '';
  displayName = '';
  readonly loading = signal(false);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureHydrated();
    if (this.auth.loggedIn()) {
      void this.router.navigateByUrl('/tabs/more', { replaceUrl: true });
    }
  }

  async submit(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.error.set('');
    const mobile = this.mobile.trim();
    const password = this.password.trim();
    if (!/^09\d{9}$/.test(mobile)) {
      this.error.set('شماره موبایل را مثل 09121234567 وارد کنید.');
      return;
    }
    if (password.length < 4) {
      this.error.set('رمز عبور حداقل ۴ کاراکتر باشد.');
      return;
    }

    await this.tapFeedback();
    this.loading.set(true);
    this.auth.loginOrRegister(mobile, password, this.displayName.trim() || undefined).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/tabs/more', { replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.message || 'ورود ناموفق بود.');
      },
    });
  }

  private async tapFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      return;
    }
  }
}
