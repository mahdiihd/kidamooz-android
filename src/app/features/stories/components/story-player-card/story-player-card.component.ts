import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { PlayerState } from '../../../../core/models/player-state.model';
import { resolveProgressIconAsset } from '../../../../core/models/progress-icon.model';
import { Story } from '../../../../core/models/story.model';
import { StoryControlsComponent } from '../story-controls/story-controls.component';
import { StoryInfoComponent } from '../story-info/story-info.component';
import { StoryProgressBarComponent } from '../story-progress-bar/story-progress-bar.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-story-player-card',
  standalone: true,
  imports: [
    StoryInfoComponent,
    StoryControlsComponent,
    StoryProgressBarComponent,
    TranslatePipe,
  ],
  template: `
    <article class="hero-card">
      <div class="hero-card__top">
        <div class="hero-card__cover-wrap">
          <img
            class="hero-card__cover"
            [src]="story().coverUrl"
            [alt]="story().titleFa || story().title"
            loading="eager"
          />
          <span class="hero-card__cover-fade" aria-hidden="true"></span>
        </div>

        <app-story-info
          [story]="story()"
          [playerState]="playerState()"
        />
      </div>

      <app-story-controls
        [isPlaying]="playerState() === 'playing'"
        (playToggle)="playToggle.emit()"
        (skipBack)="skipBack.emit()"
        (skipForward)="skipForward.emit()"
      />

      <app-story-progress-bar
        [current]="currentTime()"
        [duration]="duration()"
        [iconKey]="story().progressIcon || ''"
        [thumbUrl]="progressThumbUrl()"
        [ariaLabel]="'player.progressAria' | translate"
        (seek)="seek.emit($event)"
      />
    </article>
  `,
  styles: `
    :host {
      display: block;
      --hero-surface: rgba(255, 255, 255, 0.07);
      --hero-surface-soft: rgba(255, 255, 255, 0.11);
    }

    .hero-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 0 12px;
      border-radius: 28px;
      background: linear-gradient(
        180deg,
        var(--hero-surface-soft) 0%,
        var(--hero-surface) 42%,
        var(--hero-surface) 100%
      );
      backdrop-filter: blur(16px);
      overflow: visible;
    }

    .hero-card__top {
      position: relative;
      display: grid;
      grid-template-columns: 168px 1fr;
      align-items: stretch;
      gap: 12px;
      padding: 0 6px 0 0;
      box-sizing: border-box;
      direction: ltr;
      border-radius: 28px 28px 24px 24px;
      overflow: hidden;
      background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 38%,
        var(--hero-surface) 72%,
        var(--hero-surface) 100%
      );
    }

    .hero-card__top::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        180deg,
        transparent 0%,
        transparent 55%,
        var(--hero-surface) 100%
      );
      z-index: 2;
    }

    .hero-card__cover-wrap {
      position: relative;
      width: 168px;
      min-height: 148px;
      align-self: stretch;
      border-radius: 28px 16px 16px 24px;
      overflow: hidden;
      flex-shrink: 0;
      z-index: 1;
    }

    .hero-card__cover {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
    }

    .hero-card__cover-fade {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(
          90deg,
          transparent 0%,
          transparent 55%,
          var(--hero-surface) 100%
        ),
        linear-gradient(
          180deg,
          transparent 0%,
          transparent 48%,
          var(--hero-surface) 100%
        );
    }

    app-story-info {
      position: relative;
      z-index: 3;
      min-width: 0;
      align-self: center;
      padding-block: 10px;
      padding-inline-end: 4px;
    }

    app-story-controls,
    app-story-progress-bar {
      position: relative;
      z-index: 1;
      padding-inline: 12px;
      box-sizing: border-box;
    }

    app-story-controls {
      margin-top: 4px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryPlayerCardComponent {
  readonly story = input.required<Story>();
  readonly playerState = input<PlayerState>('idle');
  readonly currentTime = input(0);
  readonly duration = input(0);
  readonly playToggle = output<void>();
  readonly skipBack = output<void>();
  readonly skipForward = output<void>();
  readonly seek = output<number>();

  readonly progressThumbUrl = computed(() =>
    resolveProgressIconAsset(this.story().progressIcon),
  );
}
