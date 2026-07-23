import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';

import { Category } from '../../core/models/category.model';
import {
  MemberEngagement,
  StoryOfTheDay,
  WeeklyChallenge,
} from '../../core/models/member-feature.model';
import { Story } from '../../core/models/story.model';
import { AudioCacheService } from '../../core/services/audio-cache.service';
import { EngagementApiService } from '../../core/services/engagement-api.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { ParentSettingsService } from '../../core/services/parent-settings.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { StoryCatalogStore } from '../../core/services/story-catalog.store';
import { TranslationService } from '../../core/services/translation.service';
import { CategoryIslandComponent } from '../../shared/components/category-island/category-island.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingMoonComponent } from '../../shared/components/loading-moon/loading-moon.component';
import { MoonMascotComponent } from '../../shared/components/moon-mascot/moon-mascot.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { StoryCardComponent } from '../../shared/components/story-card/story-card.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type PageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonContent,
    PageHeaderComponent,
    StarsBackgroundComponent,
    MoonMascotComponent,
    CategoryIslandComponent,
    StoryCardComponent,
    LoadingMoonComponent,
    ErrorStateComponent,
    TranslatePipe,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit, ViewWillEnter {
  private readonly catalogStore = inject(StoryCatalogStore);
  private readonly router = inject(Router);
  private readonly auth = inject(MemberAuthService);
  private readonly translation = inject(TranslationService);
  private readonly engagementApi = inject(EngagementApiService);
  private readonly parentSettings = inject(ParentSettingsService);
  private readonly audioCache = inject(AudioCacheService);
  private readonly push = inject(PushNotificationService);

  readonly categories = this.catalogStore.categories;
  readonly featuredStories = computed(() => {
    const age = this.parentSettings.activeAge();
    const featured = this.catalogStore.getFeaturedStories(8);
    if (age == null) {
      return featured.slice(0, 4);
    }
    return featured
      .filter((story) => story.ageMin <= age && story.ageMax >= age)
      .slice(0, 4);
  });
  readonly pageState = computed<PageState>(() => {
    if (this.catalogStore.status() === 'error' && !this.catalogStore.hasCachedData()) {
      return 'error';
    }
    if (!this.catalogStore.hasCachedData() && this.catalogStore.status() !== 'ready') {
      return 'loading';
    }
    return 'ready';
  });

  readonly greeting = computed(() => {
    this.translation.language();
    const child = this.parentSettings.activeChild();
    const name = child?.name?.trim() || this.auth.profile()?.displayName?.trim();
    if (name) {
      return this.translation
        .translate('home.greetingNamed')
        .replace('{{name}}', name);
    }
    return this.translation.translate('home.greeting');
  });

  readonly storyOfDay = signal<StoryOfTheDay | null>(null);
  readonly challenge = signal<WeeklyChallenge | null>(null);
  readonly engagement = signal<MemberEngagement | null>(null);
  readonly continueStory = computed(() => {
    const id = this.engagement()?.lastPlayedStoryId;
    if (!id) {
      return null;
    }
    return this.catalogStore.getStoryById(id) ?? null;
  });

  private storyOfDayBannerShown = false;

  ngOnInit(): void {
    void this.catalogStore.ensureReady();
    void this.auth.ensureHydrated();
    void this.parentSettings.ensureReady();
    this.loadEngagementSurface();
  }

  ionViewWillEnter(): void {
    void this.auth.ensureHydrated();
    void this.parentSettings.ensureReady();
    this.loadEngagementSurface();
  }

  onCategorySelected(category: Category): void {
    void this.router.navigate(['/tabs/stories'], {
      queryParams: { categoryId: category.id },
    });
  }

  onStorySelected(story: Story): void {
    void this.router.navigate(['/tabs/stories'], {
      queryParams: { storyId: story.id },
    });
  }

  openStoryOfDay(): void {
    const item = this.storyOfDay();
    if (!item) {
      return;
    }
    void this.router.navigate(['/tabs/stories'], {
      queryParams: { storyId: item.storyId },
    });
  }

  openContinue(): void {
    const story = this.continueStory();
    if (!story) {
      return;
    }
    this.onStorySelected(story);
  }

  openChallenge(): void {
    const challenge = this.challenge();
    void this.router.navigate(['/my-stories/create'], {
      queryParams: challenge ? { challenge: challenge.themeTag } : {},
    });
  }

  async downloadForOffline(story: Story): Promise<void> {
    if (!this.engagement()?.canDownloadOffline) {
      return;
    }
    await this.audioCache.ensureCached(story.id, story.audioUrl);
  }

  loadContent(): void {
    void this.catalogStore.refresh();
    this.loadEngagementSurface();
  }

  private loadEngagementSurface(): void {
    this.engagementApi.storyOfTheDay().subscribe({
      next: (item) => {
        this.storyOfDay.set(item);
        if (!this.storyOfDayBannerShown) {
          this.storyOfDayBannerShown = true;
          this.push.showEngagementBanner(
            this.translation.translate('home.storyOfDay'),
            item.titleFa,
            item.storyId
          );
        }
      },
      error: () => this.storyOfDay.set(null),
    });
    this.engagementApi.weeklyChallenge().subscribe({
      next: (item) => this.challenge.set(item),
      error: () => this.challenge.set(null),
    });
    void this.auth.ensureHydrated().then(() => {
      if (!this.auth.isLoggedIn()) {
        this.engagement.set(null);
        return;
      }
      this.engagementApi.me().subscribe({
        next: (eng) => this.engagement.set(eng),
        error: () => this.engagement.set(null),
      });
    });
  }
}
