import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { ParentSettingsService } from '../services/parent-settings.service';

@Injectable({ providedIn: 'root' })
export class ParentGateService {
  private readonly settings = inject(ParentSettingsService);

  isPassed(): boolean {
    return this.settings.isUnlocked();
  }

  reset(): void {
    this.settings.lock();
  }
}

export const parentGateGuard: CanActivateFn = () => true;
