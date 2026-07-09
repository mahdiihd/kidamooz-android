import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MoonMascotComponent } from '../moon-mascot/moon-mascot.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MoonMascotComponent, TranslatePipe],
  template: `
    <div class="empty">
      <app-moon-mascot state="idle"></app-moon-mascot>
      <p>{{ 'stories.empty' | translate }}</p>
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 240px;
      color: var(--km-text-secondary);
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {}
