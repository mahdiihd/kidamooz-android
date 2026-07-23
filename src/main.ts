import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { noTransition } from './app/core/animations/no-transition';

const enableServiceWorker = !isDevMode() && !Capacitor.isNativePlatform();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md', navAnimation: noTransition }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: enableServiceWorker,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
