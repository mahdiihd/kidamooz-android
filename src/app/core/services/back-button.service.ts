import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, IonRouterOutlet, NavController, Platform } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { ExitConfirmModalComponent } from '../../shared/components/exit-confirm-modal/exit-confirm-modal.component';

@Injectable({ providedIn: 'root' })
export class BackButtonService {
  private readonly platform = inject(Platform);
  private readonly modalCtrl = inject(ModalController);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  private routerOutlet?: IonRouterOutlet;
  private initialized = false;
  private confirming = false;

  bindOutlet(outlet: IonRouterOutlet): void {
    this.routerOutlet = outlet;
  }

  initialize(): void {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    this.initialized = true;

    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.isHomeRoot()) {
        void this.confirmExit();
        return;
      }

      void this.handleBack();
    });
  }

  private isHomeRoot(): boolean {
    const path = this.router.url.split('?')[0];
    return path === '/tabs/home';
  }

  private async handleBack(): Promise<void> {
    if (this.routerOutlet?.canGoBack()) {
      await this.navCtrl.back();
      return;
    }

    const path = this.router.url.split('?')[0];

    if (path.startsWith('/tabs/')) {
      await this.navCtrl.navigateBack('/tabs/home');
      return;
    }

    if (path.startsWith('/story/')) {
      await this.navCtrl.navigateBack('/tabs/stories');
      return;
    }

    if (path.startsWith('/my-stories/')) {
      await this.navCtrl.navigateBack('/tabs/more');
      return;
    }

    await this.navCtrl.navigateBack('/tabs/home');
  }

  private async confirmExit(): Promise<void> {
    if (this.confirming) {
      return;
    }

    this.confirming = true;

    const modal = await this.modalCtrl.create({
      component: ExitConfirmModalComponent,
      cssClass: 'km-exit-modal',
      breakpoints: [0, 0.44],
      initialBreakpoint: 0.44,
      backdropDismiss: true,
      handle: false,
    });

    await modal.present();
    const { role } = await modal.onWillDismiss();
    this.confirming = false;

    if (role === 'confirm') {
      void App.exitApp();
    }
  }
}
