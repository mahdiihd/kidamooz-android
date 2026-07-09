import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PlayerState } from '../../../core/models/player-state.model';

@Component({
  selector: 'app-moon-mascot',
  standalone: true,
  template: `
    <div class="mascot km-animate-float" [class]="state()">
      <div class="moon-face">
        <span class="eye left"></span>
        <span class="eye right"></span>
        <span class="cheek left"></span>
        <span class="cheek right"></span>
        <span class="mouth"></span>
      </div>
      <div class="glow"></div>
    </div>
  `,
  styles: `
    .mascot {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .moon-face {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(145deg, #ffe08a, var(--km-accent-moon));
      position: relative;
      z-index: 1;
    }

    .glow {
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 209, 102, 0.35), transparent 70%);
      z-index: 0;
    }

    .eye {
      position: absolute;
      top: 38px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--km-bg-night-mid);
    }

    .eye.left {
      right: 32px;
    }

    .eye.right {
      left: 32px;
    }

    .cheek {
      position: absolute;
      top: 52px;
      width: 14px;
      height: 8px;
      border-radius: 50%;
      background: rgba(239, 71, 111, 0.35);
    }

    .cheek.left {
      right: 22px;
    }

    .cheek.right {
      left: 22px;
    }

    .mouth {
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 12px;
      border-bottom: 3px solid var(--km-bg-night-mid);
      border-radius: 0 0 12px 12px;
    }

    .playing .eye,
    .paused .eye {
      height: 3px;
      border-radius: 2px;
      top: 42px;
    }

    .playing .mouth,
    .paused .mouth {
      width: 16px;
      height: 8px;
      border: 0;
      background: var(--km-bg-night-mid);
      border-radius: 0 0 8px 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoonMascotComponent {
  readonly state = input<PlayerState>('idle');
}
