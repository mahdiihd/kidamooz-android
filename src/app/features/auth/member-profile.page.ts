import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({ checkmarkOutline, logOutOutline, personOutline });

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, IonSpinner, PageHeaderComponent, StarsBackgroundComponent, TranslatePipe],
  templateUrl: './member-profile.page.html',
  styleUrl: './member-profile.page.scss',
})
export class MemberProfilePage implements ViewWillEnter {
  readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);
  displayName = '';
  readonly savingName = signal(false);
  readonly nameSaved = signal(false);
  readonly nameError = signal('');

  ionViewWillEnter(): void {
    this.displayName = this.auth.profile()?.displayName ?? '';
    this.nameSaved.set(false);
    this.nameError.set('');
  }

  saveName(): void {
    if (this.savingName()) return;
    this.nameError.set('');
    this.nameSaved.set(false);
    if (!this.displayName.trim()) {
      this.nameError.set('nameEmpty');
      return;
    }
    const completing = this.auth.profile()?.profileComplete === false;
    this.savingName.set(true);
    this.auth.updateProfile(this.displayName.trim()).subscribe({
      next: user => {
        this.displayName = user.displayName;
        this.savingName.set(false);
        this.nameSaved.set(true);
        if (completing) void this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      },
      error: () => {
        this.savingName.set(false);
        this.nameError.set('saveNameFailed');
      },
    });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
