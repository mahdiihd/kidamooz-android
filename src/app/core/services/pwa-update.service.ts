import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly updates = inject(SwUpdate, { optional: true });

  initialize(): void {
    if (Capacitor.isNativePlatform() || !this.updates?.isEnabled) {
      return;
    }

    this.updates.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        void this.updates?.activateUpdate().then(() => document.location.reload());
      });
  }
}
