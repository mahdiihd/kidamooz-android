import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play } from 'ionicons/icons';

import { Story } from '../../../core/models/story.model';
import { DurationPipe } from '../../pipes/duration.pipe';
import { StoryTitlePipe } from '../../pipes/story-title.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

addIcons({ play });

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [DurationPipe, IonIcon, StoryTitlePipe, TranslatePipe],
  template: `
    <button
      type="button"
      class="story-card"
      [class.featured]="featured()"
      (click)="selected.emit(story())"
    >
      <div class="cover-wrap">
        <img
          [src]="story().coverUrl"
          [alt]="story() | storyTitle"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
        <span class="play-badge" aria-hidden="true">
          <ion-icon name="play"></ion-icon>
        </span>
      </div>
      <div class="info">
        <div class="info__text">
          <h3>{{ story() | storyTitle }}</h3>
          @if (story().authorName) {
            <span class="author">
              {{ 'stories.byAuthor' | translate }} {{ story().authorName }}
            </span>
          }
        </div>
        <span class="duration">{{ story().durationSeconds | duration }}</span>
      </div>
    </button>
  `,
  styles: `
    .story-card {
      width: 100%;
      border: 0;
      padding: 0;
      border-radius: var(--km-radius-lg);
      overflow: hidden;
      background: var(--km-bg-card);
      text-align: start;
      color: var(--km-text-primary);
      cursor: pointer;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
      -webkit-tap-highlight-color: transparent;

      &:active {
        transform: scale(0.98);
      }
    }

    .cover-wrap {
      position: relative;
      width: 100%;
    }

    img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
    }

    .featured img {
      aspect-ratio: 3 / 2;
    }

    .featured .play-badge {
      width: 40px;
      height: 40px;
      bottom: 8px;
      inset-inline-start: 8px;
      font-size: 1rem;
    }

    .featured .info {
      padding: 10px 12px 12px;
    }

    .play-badge {
      position: absolute;
      bottom: 12px;
      inset-inline-start: 12px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--km-accent-play);
      color: var(--km-bg-night);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .info {
      padding: 14px 16px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .info__text {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 0.2rem;
    }

    h3 {
      margin: 0;
      font-family: var(--km-font-title);
      font-size: 0.95rem;
      font-weight: 400;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .featured h3 {
      font-size: 0.88rem;
    }

    .author {
      color: var(--km-accent-moon-soft);
      font-size: 0.72rem;
      font-weight: 600;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .featured .author {
      font-size: 0.68rem;
    }

    .duration {
      flex-shrink: 0;
      color: var(--km-accent-moon-soft);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .featured .duration {
      font-size: 0.72rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryCardComponent {
  readonly story = input.required<Story>();
  readonly featured = input(false);
  readonly selected = output<Story>();
}
