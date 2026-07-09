import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MoonMascotComponent } from '../moon-mascot/moon-mascot.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-loading-moon',
  standalone: true,
  imports: [MoonMascotComponent, TranslatePipe],
  template: `
    <div class="loading">
      <app-moon-mascot state="loading"></app-moon-mascot>
      <p>{{ 'states.loading' | translate }}</p>
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 240px;
      color: var(--km-text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingMoonComponent {}
