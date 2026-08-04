import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  homeOutline,
  micOutline,
  peopleOutline,
} from 'ionicons/icons';

import { environment } from '../../../environments/environment';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  homeOutline,
  bookOutline,
  peopleOutline,
  micOutline,
});

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, StarsBackgroundComponent, TranslatePipe],
  templateUrl: './tabs.page.html',
  styleUrl: './tabs.page.scss',
})
export class TabsPage {
  private readonly router = inject(Router);

  readonly showParents = environment.features.parents;

  openStoriesTab(event: Event): void {
    event.preventDefault();
    void this.router.navigateByUrl('/tabs/stories');
  }
}
