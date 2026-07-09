import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { MoonMascotComponent } from '../moon-mascot/moon-mascot.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MoonMascotComponent, TranslatePipe],
  template: `
    <div class="error">
      <app-moon-mascot state="error"></app-moon-mascot>
      <p>{{ 'states.error' | translate }}</p>
      <button type="button" class="retry-btn" (click)="retry.emit()">
        {{ 'states.retry' | translate }}
      </button>
    </div>
  `,
  styles: `
    .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      min-height: 50vh;
      padding: 24px;
      text-align: center;
    }

    p {
      margin: 0;
      font-size: 1.05rem;
      color: var(--km-text-secondary);
    }

    .retry-btn {
      min-height: 52px;
      padding: 14px 32px;
      border: 2px solid var(--km-accent-moon);
      border-radius: 999px;
      background: rgba(255, 209, 102, 0.12);
      color: var(--km-accent-moon);
      font-family: var(--km-font-body);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;

      &:active {
        background: rgba(255, 209, 102, 0.25);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly retry = output<void>();
}
