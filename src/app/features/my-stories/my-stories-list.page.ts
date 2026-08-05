import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonContent, IonIcon, IonSpinner, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  brushOutline,
  checkmarkOutline,
  chevronForwardOutline,
  logOutOutline,
  personOutline,
  trashOutline,
} from 'ionicons/icons';
import { Subscription, filter } from 'rxjs';

import { StoryDraft } from '../../core/models/story-draft.model';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { StoryDraftApiService } from '../../core/services/story-draft-api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { CoverUrlPipe } from '../../shared/pipes/cover-url.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  brushOutline,
  checkmarkOutline,
  chevronForwardOutline,
  logOutOutline,
  personOutline,
  trashOutline,
});

@Component({
  selector: 'app-my-stories-list',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner,
    PageHeaderComponent,
    StarsBackgroundComponent,
    TranslatePipe,
    CoverUrlPipe,
  ],
  templateUrl: './my-stories-list.page.html',
  styleUrl: './my-stories-list.page.scss',
})
export class MyStoriesListPage implements OnInit, ViewWillEnter {
  private readonly api = inject(StoryDraftApiService);
  private readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private nameSavedTimer: ReturnType<typeof setTimeout> | null = null;
  private limitNoticeTimer: ReturnType<typeof setTimeout> | null = null;
  private listSub?: Subscription;
  private quotaSub?: Subscription;
  private loadGeneration = 0;
  private wasLoggedIn: boolean | null = null;

  readonly items = signal<StoryDraft[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly savingName = signal(false);
  readonly nameSaved = signal(false);
  readonly nameError = signal('');
  readonly canCreateToday = signal(true);
  readonly dailyLimitNotice = signal(false);
  readonly loggedIn = computed(() => this.auth.loggedIn());
  displayName = '';

  constructor() {
    effect(() => {
      const isLoggedIn = this.auth.loggedIn();
      this.displayName = this.auth.profile()?.displayName ?? '';

      if (this.wasLoggedIn === null) {
        this.wasLoggedIn = isLoggedIn;
        return;
      }

      if (isLoggedIn && !this.wasLoggedIn) {
        this.wasLoggedIn = true;
        this.reload();
        return;
      }

      if (!isLoggedIn && this.wasLoggedIn) {
        this.wasLoggedIn = false;
        this.resetGuestState();
        return;
      }

      this.wasLoggedIn = isLoggedIn;
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.get('dailyLimit') !== '1') {
        return;
      }
      this.canCreateToday.set(false);
      this.showDailyLimitNotice();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        if (!event.urlAfterRedirects.includes('/tabs/more')) {
          return;
        }
        if (this.auth.loggedIn()) {
          this.reload();
        }
      });
  }

  async ngOnInit(): Promise<void> {
    await this.auth.ensureHydrated();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.auth.ensureHydrated();
    if (this.auth.loggedIn()) {
      this.reload();
    } else {
      this.resetGuestState();
    }
  }

  reload(): void {
    if (!this.auth.loggedIn()) {
      this.resetGuestState();
      return;
    }

    const generation = ++this.loadGeneration;
    this.listSub?.unsubscribe();
    this.quotaSub?.unsubscribe();

    this.loading.set(true);
    this.error.set('');
    this.listSub = this.api.list().subscribe({
      next: (items) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.error.set('loadFailed');
        this.loading.set(false);
      },
    });
    this.quotaSub = this.api.quota().subscribe({
      next: (quota) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.canCreateToday.set(quota.canCreateToday);
      },
      error: () => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.canCreateToday.set(true);
      },
    });
  }

  async goLogin(): Promise<void> {
    await this.tapFeedback();
    void this.router.navigateByUrl('/auth/login');
  }

  async logout(): Promise<void> {
    await this.tapFeedback();
    await this.auth.logout();
    this.resetGuestState();
    this.nameSaved.set(false);
    this.nameError.set('');
  }

  async saveName(): Promise<void> {
    const name = this.displayName.trim();
    this.nameError.set('');
    this.nameSaved.set(false);

    if (!name) {
      this.nameError.set('nameEmpty');
      return;
    }

    await this.tapFeedback();
    this.savingName.set(true);
    this.auth.updateProfile(name).subscribe({
      next: (user) => {
        this.displayName = user.displayName;
        this.savingName.set(false);
        this.nameSaved.set(true);
        this.clearNameSavedLater();
      },
      error: () => {
        this.savingName.set(false);
        this.nameError.set('saveNameFailed');
      },
    });
  }

  async create(): Promise<void> {
    await this.tapFeedback();
    if (!this.auth.loggedIn()) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }
    if (!this.canCreateToday()) {
      this.showDailyLimitNotice();
      return;
    }
    void this.router.navigateByUrl('/my-stories/create');
  }

  openDraft(draft: StoryDraft): void {
    if (draft.status === 'deleted' || draft.status === 'published') {
      return;
    }
    void this.router.navigate(['/my-stories/create'], {
      queryParams: { draftId: draft.id },
    });
  }

  removeFromProfile(draft: StoryDraft, event: Event): void {
    event.stopPropagation();
    if (!draft.canRemoveFromProfile) {
      return;
    }
    this.api.removeFromProfile(draft.id).subscribe({
      next: () => {
        this.items.update((items) => items.filter((item) => item.id !== draft.id));
      },
      error: () => {
        this.error.set('removeFailed');
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'pending_review':
        return 'pendingReview';
      case 'audio_uploaded':
        return 'audioUploaded';
      case 'published':
        return 'published';
      case 'rejected':
        return 'rejected';
      case 'ready':
        return 'ready';
      case 'deleted':
        return 'deleted';
      default:
        return status;
    }
  }

  private resetGuestState(): void {
    this.items.set([]);
    this.loading.set(false);
    this.error.set('');
    this.canCreateToday.set(true);
    this.dailyLimitNotice.set(false);
  }

  private showDailyLimitNotice(): void {
    this.dailyLimitNotice.set(true);
    if (this.limitNoticeTimer) {
      clearTimeout(this.limitNoticeTimer);
    }
    this.limitNoticeTimer = setTimeout(() => {
      this.dailyLimitNotice.set(false);
      this.limitNoticeTimer = null;
    }, 4500);
  }

  private clearNameSavedLater(): void {
    if (this.nameSavedTimer) {
      clearTimeout(this.nameSavedTimer);
    }
    this.nameSavedTimer = setTimeout(() => {
      this.nameSaved.set(false);
      this.nameSavedTimer = null;
    }, 2200);
  }

  private async tapFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      return;
    }
  }
}
