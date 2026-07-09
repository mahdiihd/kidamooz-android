import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { StarsBackgroundComponent } from '../stars-background/stars-background.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    LanguageToggleComponent,
    StarsBackgroundComponent,
  ],
  template: `
    <ion-header class="km-page-header">
      <app-stars-background variant="header" class="km-page-header__stars"></app-stars-background>
      <ion-toolbar class="km-page-toolbar">
        @if (showBack()) {
          <ion-buttons class="km-page-toolbar__back">
            <ion-back-button [defaultHref]="backHref()" text=""></ion-back-button>
          </ion-buttons>
        }
        <ion-title class="km-page-toolbar__title">{{ title() }}</ion-title>
        <ion-buttons class="km-page-toolbar__actions">
          <app-language-toggle></app-language-toggle>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly showBack = input(false);
  readonly backHref = input('/tabs/home');
}
