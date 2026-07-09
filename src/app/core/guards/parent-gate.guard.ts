import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParentGateService {
  private passed = false;

  isPassed(): boolean {
    return this.passed;
  }

  verify(answer: number, expected: number): boolean {
    this.passed = answer === expected;
    return this.passed;
  }

  reset(): void {
    this.passed = false;
  }
}

export const parentGateGuard: CanActivateFn = () => {
  if (!environment.features.parents) {
    return true;
  }

  return inject(ParentGateService).isPassed();
};
