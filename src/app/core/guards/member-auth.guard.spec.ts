import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MemberAuthService } from '../services/member-auth.service';
import { memberAuthGuard } from './story-create.guard';

describe('Member auth routing', () => {
  const profile = signal<{ profileComplete: boolean } | null>(null);
  let authenticated = false;
  const router = { createUrlTree: (path: string[]) => ({ toString: () => path[0] } as UrlTree) };
  beforeEach(() => {
    authenticated = false;
    profile.set(null);
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: router },
      { provide: MemberAuthService, useValue: { getAccessToken: async () => null, loggedIn: () => authenticated, profile } },
    ] });
  });
  const guard = (url: string) => TestBed.runInInjectionContext(() => memberAuthGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
  it('requires login for signed-out visitors', async () => {
    expect(String(await guard('/tabs/home'))).toBe('/auth/login');
  });
  it('requires profile completion before home or story deep links', async () => {
    authenticated = true;
    profile.set({ profileComplete: false });
    expect(String(await guard('/tabs/home'))).toBe('/tabs/profile');
    expect(String(await guard('/story/123'))).toBe('/tabs/profile');
    expect(await guard('/tabs/profile')).toBeTrue();
  });
  it('allows returning members into the app', async () => {
    authenticated = true;
    profile.set({ profileComplete: true });
    expect(await guard('/tabs/home')).toBeTrue();
  });
});
