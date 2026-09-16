import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
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
  personOutline,
  peopleOutline,
} from 'ionicons/icons';

import { environment } from '../../../environments/environment';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  personOutline,
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

  readonly activeTab = signal('home');
  readonly activePosition = signal('50%');
  constructor() {
    const sync = () => {
      const tab = this.router.url.split('?')[0].split('/')[2] || 'home';
      const index = ['stories', 'parents', 'home', 'more', 'profile'].indexOf(tab);
      this.activeTab.set(tab);
      this.activePosition.set((90 - Math.max(0, index) * 20) + '%');
    };
    sync();
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationEnd) sync();
    });
  }

  readonly showParents = environment.features.parents;

  openStoriesTab(event: Event): void {
    event.preventDefault();
    void this.router.navigateByUrl('/tabs/stories');
  }
}
