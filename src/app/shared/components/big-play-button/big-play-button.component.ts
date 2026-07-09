import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pauseOutline, playOutline } from 'ionicons/icons';

import { TranslatePipe } from '../../pipes/translate.pipe';

addIcons({ playOutline, pauseOutline });

@Component({
  selector: 'app-big-play-button',
  standalone: true,
  imports: [IonIcon, TranslatePipe],
  template: `
    <button
      type="button"
      class="play-btn"
      [class.km-animate-pulse]="!isPlaying()"
      [attr.aria-label]="(isPlaying() ? 'player.pause' : 'player.play') | translate"
      (click)="clicked.emit()"
    >
      <ion-icon [name]="isPlaying() ? 'pause-outline' : 'play-outline'"></ion-icon>
    </button>
  `,
  styles: `
    .play-btn {
      width: 80px;
      height: 80px;
      border: 0;
      border-radius: 50%;
      background: linear-gradient(145deg, #8ed65f, var(--km-accent-play));
      color: var(--km-bg-night);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.25rem;
      cursor: pointer;
      box-shadow:
        0 8px 32px rgba(123, 201, 80, 0.45),
        inset 0 -4px 0 rgba(0, 0, 0, 0.12);
      -webkit-tap-highlight-color: transparent;

      &:active {
        transform: scale(0.95);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BigPlayButtonComponent {
  readonly isPlaying = input(false);
  readonly clicked = output<void>();
}
