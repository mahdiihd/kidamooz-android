import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pause, play, playBack, playForward } from 'ionicons/icons';

import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

addIcons({ pause, play, playBack, playForward });

@Component({
  selector: 'app-story-controls',
  standalone: true,
  imports: [IonIcon, TranslatePipe],
  template: `
    <div class="controls">
      <button
        type="button"
        class="controls__skip"
        (click)="skipBack.emit()"
        [attr.aria-label]="'player.skipBack' | translate"
      >
        <ion-icon name="play-back"></ion-icon>
        <span>10</span>
      </button>

      <div class="controls__play-wrap">
        <span class="controls__glow" aria-hidden="true"></span>
        <button
          type="button"
          class="controls__play"
          [class.controls__play--playing]="isPlaying()"
          (click)="playToggle.emit()"
          [attr.aria-label]="(isPlaying() ? 'player.pause' : 'player.play') | translate"
        >
          <ion-icon [name]="isPlaying() ? 'pause' : 'play'"></ion-icon>
        </button>
      </div>

      <button
        type="button"
        class="controls__skip"
        (click)="skipForward.emit()"
        [attr.aria-label]="'player.skipForward' | translate"
      >
        <ion-icon name="play-forward"></ion-icon>
        <span>10</span>
      </button>
    </div>
  `,
  styles: `
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 22px;
      padding: 6px 0 4px;
      direction: ltr;
    }

    .controls__skip {
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 248, 240, 0.45);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0.72;
      transition: transform 0.18s ease, opacity 0.18s ease;
      -webkit-tap-highlight-color: transparent;

      ion-icon {
        font-size: 0.72rem;
        margin-bottom: -1px;
      }

      span {
        font-size: 0.45rem;
        font-weight: 800;
        line-height: 1;
      }

      &:active {
        transform: scale(0.92);
        opacity: 1;
      }
    }

    .controls__play-wrap {
      position: relative;
      display: grid;
      place-items: center;
    }

    .controls__glow {
      position: absolute;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(212, 165, 249, 0.45) 0%,
        rgba(155, 123, 255, 0.2) 45%,
        transparent 70%
      );
      animation: glow-pulse 2.2s ease-in-out infinite;
      pointer-events: none;
    }

    .controls__play {
      position: relative;
      z-index: 1;
      width: 52px;
      height: 52px;
      border: 0;
      border-radius: 50%;
      background: linear-gradient(145deg, #ffe08a 0%, var(--km-accent-moon) 55%, #f4a261 100%);
      color: var(--km-bg-night);
      display: grid;
      place-items: center;
      font-size: 1.4rem;
      cursor: pointer;
      box-shadow:
        0 0 0 6px rgba(255, 209, 102, 0.14),
        0 10px 22px rgba(255, 209, 102, 0.42),
        inset 0 -2px 0 rgba(0, 0, 0, 0.1);
      transition:
        transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.28s ease;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;

      ion-icon {
        margin-inline-start: 1px;
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.45), transparent 55%);
        pointer-events: none;
      }

      &:active {
        transform: scale(0.9);
      }
    }

    .controls__play--playing {
      box-shadow:
        0 0 0 8px rgba(212, 165, 249, 0.22),
        0 12px 26px rgba(212, 165, 249, 0.38),
        inset 0 -2px 0 rgba(0, 0, 0, 0.1);
    }

    @keyframes glow-pulse {
      0%, 100% {
        transform: scale(0.92);
        opacity: 0.75;
      }
      50% {
        transform: scale(1.08);
        opacity: 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryControlsComponent {
  readonly isPlaying = input(false);
  readonly playToggle = output<void>();
  readonly skipBack = output<void>();
  readonly skipForward = output<void>();
}
