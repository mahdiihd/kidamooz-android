import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

import { MoonMascotComponent } from '../moon-mascot/moon-mascot.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-exit-confirm-modal',
  standalone: true,
  imports: [MoonMascotComponent, TranslatePipe],
  template: `
    <div class="exit-sheet">
      <div class="exit-sheet__handle" aria-hidden="true"></div>

      <div class="exit-sheet__hero">
        <app-moon-mascot state="idle"></app-moon-mascot>
      </div>

      <h2 class="exit-sheet__title">{{ 'exit.title' | translate }}</h2>
      <p class="exit-sheet__message">{{ 'exit.message' | translate }}</p>

      <div class="exit-sheet__actions">
        <button type="button" class="exit-sheet__btn stay" (click)="stay()">
          {{ 'exit.cancel' | translate }}
        </button>
        <button type="button" class="exit-sheet__btn leave" (click)="leave()">
          {{ 'exit.confirm' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .exit-sheet {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 24px calc(24px + var(--km-safe-bottom));
      background: linear-gradient(
        180deg,
        var(--km-bg-night-mid) 0%,
        var(--km-bg-night) 100%
      );
      text-align: center;
    }

    .exit-sheet__handle {
      width: 44px;
      height: 5px;
      border-radius: 999px;
      background: rgba(255, 248, 240, 0.2);
      margin-bottom: 8px;
    }

    .exit-sheet__hero {
      transform: scale(0.72);
      margin: -12px 0 -8px;
    }

    .exit-sheet__title {
      margin: 0 0 8px;
      font-family: var(--km-font-title);
      font-size: 1.55rem;
      font-weight: 400;
      color: var(--km-accent-moon);
      line-height: 1.3;
    }

    .exit-sheet__message {
      margin: 0 0 24px;
      max-width: 280px;
      font-family: var(--km-font-body);
      font-size: 1rem;
      line-height: 1.6;
      color: var(--km-text-secondary);
    }

    .exit-sheet__actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      width: 100%;
    }

    .exit-sheet__btn {
      min-height: 52px;
      border: 0;
      border-radius: var(--km-radius-lg);
      font-family: var(--km-font-body);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        transform 0.15s ease,
        background 0.2s ease,
        box-shadow 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }

    .exit-sheet__btn:active {
      transform: scale(0.97);
    }

    .exit-sheet__btn.stay {
      background: rgba(255, 255, 255, 0.08);
      color: var(--km-text-primary);
      border: 1px solid rgba(255, 209, 102, 0.22);
    }

    .exit-sheet__btn.leave {
      background: linear-gradient(
        135deg,
        rgba(255, 138, 101, 0.95),
        rgba(239, 71, 111, 0.9)
      );
      color: #fff8f0;
      box-shadow: 0 8px 24px rgba(239, 71, 111, 0.28);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExitConfirmModalComponent {
  private readonly modalCtrl = inject(ModalController);

  stay(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  leave(): void {
    void this.modalCtrl.dismiss(null, 'confirm');
  }
}
