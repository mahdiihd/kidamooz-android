import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonRange,
} from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';

import { PlayerState } from '../../../core/models/player-state.model';
import { StoryDetail } from '../../../core/models/story.model';
import { AudioCacheService } from '../../../core/services/audio-cache.service';
import { AudioPlayerService } from '../../../core/services/audio-player.service';
import { StoryApiService } from '../../../core/services/story-api.service';
import { StoryCatalogStore } from '../../../core/services/story-catalog.store';
import { TranslationService } from '../../../core/services/translation.service';
import { BigPlayButtonComponent } from '../../../shared/components/big-play-button/big-play-button.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingMoonComponent } from '../../../shared/components/loading-moon/loading-moon.component';
import { MoonMascotComponent } from '../../../shared/components/moon-mascot/moon-mascot.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../../shared/components/stars-background/stars-background.component';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { StoryDescriptionPipe } from '../../../shared/pipes/story-description.pipe';
import { StoryTitlePipe } from '../../../shared/pipes/story-title.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type PageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-story-player',
  standalone: true,
  imports: [
    IonContent,
    IonRange,
    PageHeaderComponent,
    StarsBackgroundComponent,
    MoonMascotComponent,
    BigPlayButtonComponent,
    LoadingMoonComponent,
    ErrorStateComponent,
    DurationPipe,
    StoryTitlePipe,
    StoryDescriptionPipe,
    TranslatePipe,
  ],
  templateUrl: './story-player.page.html',
  styleUrl: './story-player.page.scss',
})
export class StoryPlayerPage implements OnInit, OnDestroy {
  private readonly storyApi = inject(StoryApiService);
  private readonly catalogStore = inject(StoryCatalogStore);
  private readonly translation = inject(TranslationService);
  private readonly audioPlayer = inject(AudioPlayerService);
  private readonly audioCache = inject(AudioCacheService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private playerSubscription?: Subscription;

  readonly pageState = signal<PageState>('loading');
  readonly story = signal<StoryDetail | null>(null);
  readonly storyId = signal('');
  readonly playerState = signal<PlayerState>('idle');
  readonly currentTime = signal(0);
  readonly duration = signal(0);

  readonly headerTitle = computed(() => {
    this.translation.language();
    const story = this.story();
    if (!story) {
      return this.translation.translate('appName');
    }

    return this.translation.language() === 'en'
      ? story.titleEn || story.titleFa || story.title
      : story.titleFa || story.title;
  });

  ngOnInit(): void {
    this.playerSubscription = this.audioPlayer.snapshot$.subscribe((snapshot) => {
      this.playerState.set(snapshot.state);
      this.currentTime.set(snapshot.currentTime);
      this.duration.set(snapshot.duration);
    });

    const storyId = this.activatedRoute.snapshot.paramMap.get('id');
    if (!storyId) {
      this.pageState.set('error');
      return;
    }

    this.storyId.set(storyId);
    this.hydrateFromCache(storyId);
    void this.initStory(storyId);
  }

  ngOnDestroy(): void {
    this.playerSubscription?.unsubscribe();
    this.audioPlayer.stop();
  }

  loadStory(storyId: string): void {
    void this.initStory(storyId);
  }

  async onPlayToggle(): Promise<void> {
    await this.triggerHaptic();
    const story = this.story();
    const startingPlayback = this.playerState() !== 'playing';
    await this.audioPlayer.togglePlay();

    if (startingPlayback && story?.audioUrl) {
      void this.audioCache.ensureCached(story.id, story.audioUrl);
      void this.audioCache.touch(story.id);
    }
  }

  onSeek(event: CustomEvent): void {
    const value = event.detail.value;
    const seconds = Array.isArray(value) ? value[0] : value;
    this.audioPlayer.seekTo(Number(seconds));
  }

  mascotState(): PlayerState {
    const state = this.playerState();
    if (state === 'playing' || state === 'paused') {
      return state;
    }
    return 'idle';
  }

  private hydrateFromCache(storyId: string): void {
    const cached = this.catalogStore.getStoryById(storyId);
    if (!cached) {
      return;
    }

    this.story.set(cached);
    this.pageState.set('ready');
  }

  private async initStory(storyId: string): Promise<void> {
    await this.catalogStore.ensureReady();

    const cached = this.catalogStore.getStoryById(storyId);
    if (cached) {
      this.story.set(cached);
      this.pageState.set('ready');
      await this.loadAudio(cached);
      return;
    }

    this.pageState.set('loading');

    this.storyApi.getStoryById(storyId).subscribe({
      next: (fetchedStory) => {
        this.catalogStore.upsertStory(fetchedStory);
        this.story.set(fetchedStory);
        this.pageState.set('ready');
        void this.loadAudio(fetchedStory);
      },
      error: () => this.pageState.set('error'),
    });
  }

  private async loadAudio(story: StoryDetail): Promise<void> {
    try {
      const playUrl = await this.audioCache.resolvePlayUrl(story.id, story.audioUrl);
      await this.audioPlayer.load(story.id, playUrl);
    } catch {
      this.pageState.set('error');
    }
  }

  private async triggerHaptic(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await Haptics.impact({ style: ImpactStyle.Light });
  }
}
