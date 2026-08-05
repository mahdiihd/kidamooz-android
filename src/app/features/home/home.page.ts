import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';

import { Category } from '../../core/models/category.model';
import { Story } from '../../core/models/story.model';
import { EngagementSurfaceStore } from '../../core/services/engagement-surface.store';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { ParentSettingsService } from '../../core/services/parent-settings.service';
import { StoryCatalogStore } from '../../core/services/story-catalog.store';
import { TranslationService } from '../../core/services/translation.service';
import { CategoryIslandComponent } from '../../shared/components/category-island/category-island.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingMoonComponent } from '../../shared/components/loading-moon/loading-moon.component';
import { MoonMascotComponent } from '../../shared/components/moon-mascot/moon-mascot.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { StoryCardComponent } from '../../shared/components/story-card/story-card.component';
import { CoverUrlPipe } from '../../shared/pipes/cover-url.pipe';
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
    CoverUrlPipe,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit, ViewWillEnter {
  private readonly catalogStore = inject(StoryCatalogStore);
  private readonly engagementSurface = inject(EngagementSurfaceStore);
  private readonly router = inject(Router);
  private readonly auth = inject(MemberAuthService);
  private readonly translation = inject(TranslationService);
  private readonly parentSettings = inject(ParentSettingsService);

  readonly categories = this.catalogStore.categories;
  readonly storyOfDay = this.engagementSurface.storyOfDay;
  readonly challenge = this.engagementSurface.challenge;
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

  ngOnInit(): void {
    void this.catalogStore.ensureReady();
    void this.auth.ensureHydrated();
    void this.parentSettings.ensureReady();
    void this.engagementSurface.ensureReady();
  }

  ionViewWillEnter(): void {
    void this.auth.ensureHydrated();
    void this.parentSettings.ensureReady();
    void this.engagementSurface.ensureReady();
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

  openChallenge(): void {
    const challenge = this.challenge();
    void this.router.navigate(['/my-stories/create'], {
      queryParams: challenge ? { challenge: challenge.themeTag } : {},
    });
  }

  loadContent(): void {
    void this.catalogStore.refresh();
    void this.engagementSurface.ensureReady(true);
  }
}
