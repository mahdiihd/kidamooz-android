import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Story } from '../../../../core/models/story.model';
import { CoverUrlPipe } from '../../../../shared/pipes/cover-url.pipe';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';
import { StoryTitlePipe } from '../../../../shared/pipes/story-title.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-story-list-item',
  standalone: true,
  imports: [CoverUrlPipe, StoryTitlePipe, DurationPipe, TranslatePipe],
  template: `
    <div
      class="item"
      [class.item--active]="active()"
      [class.item--playing]="playing()"
      [class.item--favorite]="favorite()"
    >
      <button
        type="button"
        class="item__main"
        (click)="selected.emit(story())"
      >
        <img
          class="item__cover"
          [src]="story().coverUrl | coverUrl"
          [alt]="story() | storyTitle"
          loading="lazy"
        />

        <div class="item__body">
          <p class="item__title" [class.item__title--active]="active()">
            {{ story() | storyTitle }}
          </p>
          <p class="item__meta">
            @if (story().authorName) {
              <span class="item__author">
                {{ 'stories.byAuthor' | translate }} {{ story().authorName }}
              </span>
              <span class="item__dot" aria-hidden="true">·</span>
            }
            <span>{{ story().durationSeconds | duration }}</span>
          </p>
        </div>

        @if (playing()) {
          <span class="item__eq" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i>
          </span>
        }
      </button>

      <button
        type="button"
        class="item__fav"
        [class.item__fav--on]="favorite()"
        [attr.aria-pressed]="favorite()"
        [attr.aria-label]="'stories.favorites' | translate"
        (click)="onFavoriteClick($event)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z"
          />
        </svg>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .item {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 0.15rem;
      padding: 0.35rem 0.4rem 0.35rem 0.45rem;
      border: 1px solid rgba(255, 248, 240, 0.1);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 28px rgba(8, 4, 20, 0.24);
      transition:
        border-color 0.32s ease,
        box-shadow 0.32s ease,
        background 0.32s ease;
    }

    .item--active {
      border-color: rgba(255, 209, 102, 0.5);
      background: rgba(255, 209, 102, 0.1);
    }

    .item--playing {
      box-shadow:
        0 0 0 1px rgba(255, 209, 102, 0.28),
        0 0 32px rgba(255, 209, 102, 0.2),
        0 16px 36px rgba(255, 209, 102, 0.22);
    }

    .item--favorite {
      border-color: rgba(239, 71, 111, 0.28);
    }

    .item__main {
      min-width: 0;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 0.35rem 0.25rem 0.35rem 0.35rem;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: start;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .item__main:not(:has(.item__eq)) {
      grid-template-columns: auto 1fr;
    }

    .item__cover {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      object-fit: cover;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
    }

    .item__body {
      min-width: 0;
    }

    .item__eq {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
      width: 28px;
      height: 28px;
    }

    .item__eq i {
      width: 3.5px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ffe08a, var(--km-accent-moon));
      animation: eq 0.85s ease-in-out infinite;
      transform-origin: center bottom;
    }

    .item__eq i:nth-child(1) { height: 8px; animation-delay: 0s; }
    .item__eq i:nth-child(2) { height: 16px; animation-delay: 0.1s; }
    .item__eq i:nth-child(3) { height: 12px; animation-delay: 0.2s; }
    .item__eq i:nth-child(4) { height: 18px; animation-delay: 0.3s; }
    .item__eq i:nth-child(5) { height: 10px; animation-delay: 0.4s; }

    .item__title {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--km-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: font-weight 0.2s ease, color 0.2s ease;
    }

    .item__title--active {
      font-weight: 800;
      color: var(--km-accent-moon-soft);
    }

    .item__meta {
      margin: 6px 0 0;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
      color: var(--km-text-secondary);
      font-weight: 600;
      min-width: 0;
    }

    .item__author {
      color: var(--km-accent-moon-soft);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 55%;
    }

    .item__dot {
      opacity: 0.55;
      flex-shrink: 0;
    }

    .item__fav {
      flex-shrink: 0;
      width: 2.35rem;
      height: 2.35rem;
      margin-inline-end: 0.15rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.16);
      color: rgba(255, 248, 240, 0.42);
      cursor: pointer;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        transform 0.15s ease;
      -webkit-tap-highlight-color: transparent;

      svg {
        width: 1.05rem;
        height: 1.05rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linejoin: round;
      }

      &:active {
        transform: scale(0.92);
      }
    }

    .item__fav--on {
      color: var(--km-accent-heart);
      border-color: rgba(239, 71, 111, 0.4);
      background: rgba(239, 71, 111, 0.18);

      svg {
        fill: currentColor;
        stroke: currentColor;
      }
    }

    @keyframes eq {
      0%, 100% { transform: scaleY(0.4); }
      50% { transform: scaleY(1); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryListItemComponent {
  readonly story = input.required<Story>();
  readonly active = input(false);
  readonly playing = input(false);
  readonly favorite = input(false);
  readonly selected = output<Story>();
  readonly favoriteToggle = output<Story>();

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.story());
  }
}
