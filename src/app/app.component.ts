import { Component, inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { AppLifecycleService } from './core/services/app-lifecycle.service';
import { AnalyticsService } from './core/services/analytics.service';
import { BackButtonService } from './core/services/back-button.service';
import { PushNotificationService } from './core/services/push-notification.service';
import { StatusBarService } from './core/services/status-bar.service';
import { StoryCatalogStore } from './core/services/story-catalog.store';
import { PushBannerComponent } from './shared/components/push-banner/push-banner.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, PushBannerComponent],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild(IonRouterOutlet) private routerOutlet?: IonRouterOutlet;

  private readonly appLifecycle = inject(AppLifecycleService);
  private readonly analytics = inject(AnalyticsService);
  private readonly backButton = inject(BackButtonService);
  private readonly pushNotifications = inject(PushNotificationService);
  private readonly statusBar = inject(StatusBarService);
  private readonly catalogStore = inject(StoryCatalogStore);

  ngOnInit(): void {
    this.appLifecycle.initialize();
    this.analytics.trackAppOpen();
    void this.statusBar.configure();
    void this.catalogStore.bootstrap();
    void this.pushNotifications.initialize();
  }

  ngAfterViewInit(): void {
    if (!this.routerOutlet) {
      return;
    }

    this.backButton.bindOutlet(this.routerOutlet);
    this.backButton.initialize();
  }
}
