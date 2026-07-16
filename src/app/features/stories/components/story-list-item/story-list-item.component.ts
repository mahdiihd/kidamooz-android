import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Story } from '../../../../core/models/story.model';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';
import { StoryTitlePipe } from '../../../../shared/pipes/story-title.pipe';

@Component({
  selector: 'app-story-list-item',
  standalone: true,
  imports: [StoryTitlePipe, DurationPipe],
  template: `
    <button
      type="button"
      class="item"
      [class.item--active]="active()"
      [class.item--playing]="playing()"
      (click)="selected.emit(story())"
    >
      <img
        class="item__cover"
        [src]="story().coverUrl"
        [alt]="story() | storyTitle"
        loading="lazy"
      />

      <div class="item__body">
        <p class="item__title" [class.item__title--active]="active()">
          {{ story() | storyTitle }}
        </p>
        <p class="item__meta">
          <span>{{ story().durationSeconds | duration }}</span>
        </p>
      </div>

      @if (playing()) {
        <span class="item__eq" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
        </span>
      }
    </button>
  `,
  styles: `
    :host {
      display: block;
    }

    .item {
      width: 100%;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 8px 10px;
      border: 1px solid rgba(255, 248, 240, 0.1);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 28px rgba(8, 4, 20, 0.24);
      color: inherit;
      text-align: start;
      cursor: pointer;
      transition:
        border-color 0.32s ease,
        box-shadow 0.32s ease,
        background 0.32s ease,
        transform 0.18s ease;
      -webkit-tap-highlight-color: transparent;

      &:active {
        transform: scale(0.985);
      }
    }

    .item:not(.item--playing) {
      grid-template-columns: auto 1fr;
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
      width: 36px;
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
  readonly selected = output<Story>();
}
