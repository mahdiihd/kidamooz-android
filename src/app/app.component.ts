import { Component, inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { AppLifecycleService } from './core/services/app-lifecycle.service';
import { AnalyticsService } from './core/services/analytics.service';
import { BackButtonService } from './core/services/back-button.service';
import { StatusBarService } from './core/services/status-bar.service';
import { StoryCatalogStore } from './core/services/story-catalog.store';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild(IonRouterOutlet) private routerOutlet?: IonRouterOutlet;

  private readonly appLifecycle = inject(AppLifecycleService);
  private readonly analytics = inject(AnalyticsService);
  private readonly backButton = inject(BackButtonService);
  private readonly statusBar = inject(StatusBarService);
  private readonly catalogStore = inject(StoryCatalogStore);

  ngOnInit(): void {
    this.appLifecycle.initialize();
    this.analytics.trackAppOpen();
    void this.statusBar.configure();
    void this.catalogStore.bootstrap();
  }

  ngAfterViewInit(): void {
    if (!this.routerOutlet) {
      return;
    }

    this.backButton.bindOutlet(this.routerOutlet);
    this.backButton.initialize();
  }
}
