import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { MemberAuthService } from '../services/member-auth.service';
import { StoryDraftApiService } from '../services/story-draft-api.service';

export const storyCreateGuard: CanActivateFn = (route) => {
  const api = inject(StoryDraftApiService);
  const router = inject(Router);

  if (route.queryParamMap.get('draftId')) {
    return true;
  }

  return api.quota().pipe(
    map((quota) => {
      if (quota.canCreateToday) {
        return true;
      }
      return router.createUrlTree(['/tabs/more'], {
        queryParams: { dailyLimit: '1' },
      });
    }),
    catchError(() => of(true))
  );
};

export const memberAuthGuard: CanActivateFn = async () => {
  const auth = inject(MemberAuthService);
  const router = inject(Router);
  await auth.ensureHydrated();
  if (auth.loggedIn()) {
    return true;
  }
  return router.createUrlTree(['/auth/login']);
};
