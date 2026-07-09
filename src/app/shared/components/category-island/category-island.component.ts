import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { Category } from '../../../core/models/category.model';
import { TranslationService } from '../../../core/services/translation.service';
import { CategoryTitlePipe } from '../../pipes/category-title.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

addIcons({ chevronForwardOutline });@Component({
  selector: 'app-category-island',
  standalone: true,
  imports: [IonIcon, CategoryTitlePipe, TranslatePipe],
  template: `
    <button
      type="button"
      class="island"
      [style.--island-color]="category().color"
      (click)="selected.emit(category())"
    >
      <div class="icon-wrap">
        <img
          [src]="category().iconUrl"
          [alt]="category().id | categoryTitle"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="text-wrap">
        <span class="title">{{ category().id | categoryTitle }}</span>
        <span class="hint">{{ 'categories.tapHint' | translate }}</span>
      </div>
      <ion-icon
        class="arrow"
        [class.is-rtl]="isRtl()"
        [flipRtl]="false"
        name="chevron-forward-outline"
        aria-hidden="true"
      ></ion-icon>
    </button>
  `,
  styles: `
    .island {
      width: 100%;
      min-height: 96px;
      border: 0;
      border-radius: var(--km-radius-lg);
      padding: 14px 16px;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 14px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--island-color) 22%, transparent),
        var(--km-bg-card)
      );
      box-shadow:
        inset 0 0 0 2px color-mix(in srgb, var(--island-color) 35%, transparent),
        0 8px 24px rgba(0, 0, 0, 0.2);
      color: var(--km-text-primary);
      cursor: pointer;
      text-align: start;
      -webkit-tap-highlight-color: transparent;

      &:active {
        transform: scale(0.98);
        background: var(--km-bg-card-hover);
      }
    }

    .icon-wrap {
      flex-shrink: 0;
      width: 68px;
      height: 68px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(145deg, var(--island-color), color-mix(in srgb, var(--island-color) 60%, #1a0f2e));
    }

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .text-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .title {
      font-family: var(--km-font-title);
      font-size: 1.2rem;
      line-height: 1.3;
    }

    .hint {
      font-size: 0.8rem;
      color: var(--km-text-secondary);
    }

    .arrow {
      flex-shrink: 0;
      font-size: 1.5rem;
      color: var(--island-color);
      opacity: 0.9;
    }

    .arrow.is-rtl {
      transform: scaleX(-1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryIslandComponent {
  private readonly translation = inject(TranslationService);

  readonly category = input.required<Category>();
  readonly selected = output<Category>();

  readonly isRtl = computed(() => {
    this.translation.language();
    return this.translation.isRtl();
  });
}