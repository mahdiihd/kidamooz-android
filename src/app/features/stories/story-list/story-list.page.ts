import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { map } from 'rxjs';
import { Subscription } from 'rxjs';

import { PlayerState } from '../../../core/models/player-state.model';
import { Story, StoryDetail } from '../../../core/models/story.model';
import { AudioCacheService } from '../../../core/services/audio-cache.service';
import { AudioPlayerService } from '../../../core/services/audio-player.service';
import { EngagementApiService } from '../../../core/services/engagement-api.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { MemberAuthService } from '../../../core/services/member-auth.service';
import { ParentSettingsService } from '../../../core/services/parent-settings.service';
import { StoryApiService } from '../../../core/services/story-api.service';
import { StoryCatalogStore } from '../../../core/services/story-catalog.store';
import { TranslationService } from '../../../core/services/translation.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingMoonComponent } from '../../../shared/components/loading-moon/loading-moon.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../../shared/components/stars-background/stars-background.component';
import { CategoryTitlePipe } from '../../../shared/pipes/category-title.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StoryListItemComponent } from '../components/story-list-item/story-list-item.component';
import { StoryPlayerPanelComponent } from '../components/story-player-panel/story-player-panel.component';

type PageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [
    CategoryTitlePipe,
    StarsBackgroundComponent,
    PageHeaderComponent,
    StoryPlayerPanelComponent,
    StoryListItemComponent,
    LoadingMoonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    TranslatePipe,
  ],
  templateUrl: './story-list.page.html',
  styleUrl: './story-list.page.scss',
})
export class StoryListPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  private readonly catalogStore = inject(StoryCatalogStore);
  private readonly storyApi = inject(StoryApiService);
  private readonly audioPlayer = inject(AudioPlayerService);
  private readonly audioCache = inject(AudioCacheService);
  private readonly translation = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly parentSettings = inject(ParentSettingsService);
  private readonly favorites = inject(FavoritesService);
  private readonly engagementApi = inject(EngagementApiService);
  private readonly auth = inject(MemberAuthService);
  private playerSubscription?: Subscription;
  private endedSubscription?: Subscription;
  private querySubscription?: Subscription;
  private loadingStoryId: string | null = null;
  private advancing = false;
  private lastOpenedStoryId: string | null = null;
  private lastSyncedCategoryKey: string | null = null;
  private skipCategorySync = false;

  readonly activeStoryId = signal<string | null>(null);
  readonly playerState = signal<PlayerState>('idle');
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly favoritesOnly = signal(false);

  readonly selectedCategoryId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('categoryId'))),
    { initialValue: this.route.snapshot.queryParamMap.get('categoryId') },
  );

  readonly categories = this.catalogStore.categories;

  readonly stories = computed(() => {
    const age = this.parentSettings.activeAge();
    const base = this.catalogStore
      .getStoriesForAge(age, this.selectedCategoryId())
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    if (!this.favoritesOnly()) {
      return base;
    }
    const fav = this.favorites.ids();
    return base.filter((story) => fav.has(story.id));
  });

  readonly activeStory = computed(() => {
    const id = this.activeStoryId();
    if (!id) {
      return null;
    }
    const inCategory = this.stories().some((item) => item.id === id);
    if (!inCategory) {
      return null;
    }
    return this.catalogStore.getStoryById(id) ?? null;
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

  constructor() {
    effect(() => {
      if (this.pageState() !== 'ready') {
        return;
      }

      const categoryKey = this.selectedCategoryId() ?? '__all__';
      const list = this.stories();

      if (this.skipCategorySync) {
        this.lastSyncedCategoryKey = categoryKey;
        return;
      }

      if (this.lastSyncedCategoryKey === categoryKey) {
        const current = this.activeStoryId();
        if (list.length === 0) {
          if (current) {
            this.clearActiveStory();
          }
          return;
        }
        if (current && list.some((item) => item.id === current)) {
          return;
        }
        void this.selectStory(list[0].id, false);
        return;
      }

      this.lastSyncedCategoryKey = categoryKey;
      this.syncPlayerToCategoryList(list);
    });
  }

  ngOnInit(): void {
    void this.catalogStore.ensureReady();
    void this.parentSettings.ensureReady();
    void this.favorites.ensureReady();

    this.playerSubscription = this.audioPlayer.snapshot$.subscribe((snapshot) => {
      this.playerState.set(snapshot.state);
      this.currentTime.set(snapshot.currentTime);
      this.duration.set(snapshot.duration);
      if (snapshot.storyId) {
        this.activeStoryId.set(snapshot.storyId);
      } else if (snapshot.state === 'idle') {
        // keep UI selection unless cleared explicitly
      }
    });

    this.endedSubscription = this.audioPlayer.ended$.subscribe((finishedId) => {
      void this.playNextAfter(finishedId);
    });

    this.querySubscription = this.route.queryParamMap.subscribe((params) => {
      const storyId = params.get('storyId');
      if (!storyId || storyId === this.lastOpenedStoryId) {
        return;
      }
      this.openStoryFromRoute(storyId, true);
    });
  }

  ionViewWillEnter(): void {
    void this.catalogStore.ensureReady();
    const storyId = this.route.snapshot.queryParamMap.get('storyId');
    if (storyId && storyId !== this.lastOpenedStoryId) {
      this.openStoryFromRoute(storyId, true);
    }
  }

  ionViewWillLeave(): void {
    this.lastOpenedStoryId = null;
    this.skipCategorySync = false;
    this.lastSyncedCategoryKey = null;
    this.audioPlayer.stop();
  }

  ngOnDestroy(): void {
    this.playerSubscription?.unsubscribe();
    this.endedSubscription?.unsubscribe();
    this.querySubscription?.unsubscribe();
    this.audioPlayer.stop();
  }

  private openStoryFromRoute(storyId: string, autoPlay: boolean): void {
    this.skipCategorySync = true;
    this.lastOpenedStoryId = storyId;
    this.lastSyncedCategoryKey = this.selectedCategoryId() ?? '__all__';
    void this.selectStory(storyId, autoPlay).finally(() => {
      this.skipCategorySync = false;
    });
  }

  private syncPlayerToCategoryList(list: Story[]): void {
    if (list.length === 0) {
      this.clearActiveStory();
      return;
    }

    const current = this.activeStoryId();
    if (current && list.some((item) => item.id === current)) {
      return;
    }

    void this.selectStory(list[0].id, false);
  }

  private clearActiveStory(): void {
    this.activeStoryId.set(null);
    this.lastOpenedStoryId = null;
    this.loadingStoryId = null;
    this.audioPlayer.stop();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { storyId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  selectCategory(categoryId: string | null): void {
    this.lastOpenedStoryId = null;
    this.lastSyncedCategoryKey = null;
    this.skipCategorySync = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: categoryId ?? null,
        storyId: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  toggleFavoritesFilter(): void {
    this.favoritesOnly.update((v) => !v);
    this.lastSyncedCategoryKey = null;
  }

  async toggleFavorite(story: Story, event: Event): Promise<void> {
    event.stopPropagation();
    await this.favorites.toggle(story.id);
  }

  isFavorite(storyId: string): boolean {
    return this.favorites.isFavorite(storyId);
  }

  async downloadOffline(story: Story, event: Event): Promise<void> {
    event.stopPropagation();
    await this.auth.ensureHydrated();
    if (!this.auth.isLoggedIn()) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }
    this.engagementApi.me().subscribe({
      next: async (eng) => {
        if (!eng.canDownloadOffline) {
          return;
        }
        await this.audioCache.ensureCached(story.id, story.audioUrl);
      },
    });
  }

  onStorySelected(story: Story): void {
    if (story.id === this.activeStoryId() && this.playerState() === 'playing') {
      void this.onPlayToggle();
      return;
    }
    void this.selectStory(story.id, true);
  }

  async onPlayToggle(): Promise<void> {
    await this.triggerHaptic();
    const story = this.activeStory();
    const starting = this.playerState() !== 'playing';
    await this.audioPlayer.togglePlay();
    if (starting && story?.audioUrl) {
      void this.audioCache.ensureCached(story.id, story.audioUrl);
    }
  }

  onSkip(delta: number): void {
    this.audioPlayer.seekBy(delta);
  }

  onSeek(seconds: number): void {
    this.audioPlayer.seekTo(seconds);
  }

  isCurrentStory(storyId: string): boolean {
    return this.activeStoryId() === storyId;
  }

  isPlayingStory(storyId: string): boolean {
    return this.activeStoryId() === storyId && this.playerState() === 'playing';
  }

  loadStories(): void {
    void this.catalogStore.refresh();
  }

  private async playNextAfter(finishedId: string): Promise<void> {
    if (this.advancing || finishedId !== this.activeStoryId()) {
      return;
    }

    const list = this.stories();
    const index = list.findIndex((item) => item.id === finishedId);
    if (index < 0 || index >= list.length - 1) {
      return;
    }

    this.advancing = true;
    try {
      await this.selectStory(list[index + 1].id, true);
    } finally {
      this.advancing = false;
    }
  }

  private async selectStory(storyId: string, autoPlay: boolean): Promise<void> {
    if (this.loadingStoryId === storyId) {
      return;
    }

    this.loadingStoryId = storyId;
    this.activeStoryId.set(storyId);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { storyId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    try {
      await this.catalogStore.ensureReady();
      let story = this.catalogStore.getStoryById(storyId);
      if (!story) {
        story = await new Promise<StoryDetail>((resolve, reject) => {
          this.storyApi.getStoryById(storyId).subscribe({
            next: (fetched) => {
              this.catalogStore.upsertStory(fetched);
              resolve(fetched);
            },
            error: reject,
          });
        });
      }

      const playUrl = await this.audioCache.resolvePlayUrl(story.id, story.audioUrl);
      const title =
        this.translation.language() === 'en'
          ? story.titleEn || story.titleFa || story.title
          : story.titleFa || story.title;

      await this.audioPlayer.load(story.id, playUrl, {
        title,
        artist: 'کیدآموز',
        artworkUrl: story.coverUrl,
      });

      if (autoPlay) {
        await this.audioPlayer.play();
        void this.audioCache.ensureCached(story.id, story.audioUrl);
        void this.auth.ensureHydrated().then(() => {
          if (!this.auth.isLoggedIn()) {
            return;
          }
          this.engagementApi.recordListen(story.id, 0).subscribe({ error: () => undefined });
        });
      }
    } catch {
      /* keep selection visible */
    } finally {
      this.loadingStoryId = null;
    }
  }

  private async triggerHaptic(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await Haptics.impact({ style: ImpactStyle.Light });
  }
}
