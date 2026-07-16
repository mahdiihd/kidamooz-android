import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, volumeHighOutline } from 'ionicons/icons';

import { PlayerState } from '../../../../core/models/player-state.model';
import { Story } from '../../../../core/models/story.model';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';
import { StoryTitlePipe } from '../../../../shared/pipes/story-title.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

addIcons({ timeOutline, volumeHighOutline });

@Component({
  selector: 'app-story-info',
  standalone: true,
  imports: [IonIcon, StoryTitlePipe, DurationPipe, TranslatePipe],
  template: `
    <div class="info" [attr.data-story-id]="story().id">
      <span class="info__badge" [class.info__badge--paused]="playerState() !== 'playing'">
        <ion-icon name="volume-high-outline" aria-hidden="true"></ion-icon>
        {{
          playerState() === 'playing'
            ? ('player.nowPlaying' | translate)
            : ('player.paused' | translate)
        }}
      </span>

      <h2 class="info__title">{{ story() | storyTitle }}</h2>

      <span class="info__duration">
        <ion-icon name="time-outline" aria-hidden="true"></ion-icon>
        {{ story().durationSeconds | duration }}
        {{ 'stories.minutes' | translate }}
      </span>
    </div>
  `,
  styles: `
    .info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 10px;
      min-width: 0;
      width: 100%;
      height: 140px;
      max-height: 140px;
      padding: 4px 4px 4px 0;
      direction: rtl;
      text-align: start;
      overflow: hidden;
    }

    .info__badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(255, 209, 102, 0.22);
      color: var(--km-accent-moon);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      transition: background 0.28s ease, color 0.28s ease;
      white-space: nowrap;

      ion-icon {
        font-size: 0.9rem;
      }
    }

    .info__badge--paused {
      background: rgba(255, 255, 255, 0.1);
      color: var(--km-text-secondary);
    }

    .info__title {
      margin: 0;
      font-family: var(--km-font-title);
      font-size: 0.82rem;
      line-height: 1.3;
      height: 1.3em;
      color: var(--km-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .info__duration {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 1.2em;
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(255, 248, 240, 0.78);
      white-space: nowrap;

      ion-icon {
        font-size: 0.85rem;
        color: var(--km-accent-lavender);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryInfoComponent {
  readonly story = input.required<Story>();
  readonly playerState = input<PlayerState>('idle');
}
