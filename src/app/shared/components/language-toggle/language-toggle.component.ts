import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { languageOutline } from 'ionicons/icons';

import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

addIcons({ languageOutline });

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [IonIcon, TranslatePipe],
  template: `
    <button
      type="button"
      class="lang-icon-btn"
      [attr.aria-label]="'language.switchAria' | translate"
      (click)="toggleLanguage()"
    >
      <ion-icon name="language-outline"></ion-icon>
    </button>
  `,
  styles: `
    .lang-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin: 0;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.07);
      color: var(--km-accent-moon);
      font-size: 1.2rem;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease, transform 0.15s ease;

      &:active {
        background: rgba(255, 209, 102, 0.18);
        transform: scale(0.94);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {
  private readonly translation = inject(TranslationService);

  toggleLanguage(): void {
    this.translation.toggleLanguage();
  }
}
