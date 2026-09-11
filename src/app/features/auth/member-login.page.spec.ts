import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { MemberLoginPage, normalizeAuthDigits } from './member-login.page';

describe('OTP login', () => {
  const profile = signal({ id: 'member', mobile: '09121234567', displayName: '', profileComplete: false });
  let auth: { requestOtp: jasmine.Spy; verifyOtp: jasmine.Spy; getAccessToken: jasmine.Spy; loggedIn: () => boolean; profile: typeof profile };
  let router: { navigateByUrl: jasmine.Spy };
  beforeEach(() => {
    profile.set({ id: 'member', mobile: '09121234567', displayName: '', profileComplete: false });
    auth = {
      requestOtp: jasmine.createSpy().and.returnValue(of({ retryAfterSeconds: 60, expiresInSeconds: 120 })),
      verifyOtp: jasmine.createSpy().and.returnValue(of(profile())),
      getAccessToken: jasmine.createSpy().and.resolveTo(null),
      loggedIn: () => false,
      profile,
    };
    router = { navigateByUrl: jasmine.createSpy().and.resolveTo(true) };
    TestBed.configureTestingModule({ providers: [
      { provide: MemberAuthService, useValue: auth }, { provide: Router, useValue: router },
    ] });
    TestBed.overrideComponent(MemberLoginPage, { set: { template: '', imports: [] } });
  });
  const create = () => TestBed.createComponent(MemberLoginPage).componentInstance;
  it('accepts Persian and Arabic numerals', () => {
    expect(normalizeAuthDigits('۰۹۱۲۱۲۳۴۵۶۷')).toBe('09121234567');
    expect(normalizeAuthDigits('١٢٣٤٥٦')).toBe('123456');
  });
  it('rejects invalid phone numbers without requesting SMS', () => {
    const page = create(); page.mobile = '123'; page.submit();
    expect(auth.requestOtp).not.toHaveBeenCalled();
    expect(page.error()).toBeTruthy();
  });
  it('sends once during cooldown and verifies the original requested number', () => {
    const page = create(); page.mobile = '۰۹۱۲۱۲۳۴۵۶۷'; page.submit(); page.sendCode();
    expect(auth.requestOtp).toHaveBeenCalledOnceWith('09121234567');
    page.mobile = '09129999999'; page.code = '۱۲۳۴۵۶'; page.submit();
    expect(auth.verifyOtp).toHaveBeenCalledOnceWith('09121234567', '123456');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/profile', { replaceUrl: true });
  });
  it('sends existing members home', () => {
    profile.update(p => ({ ...p, profileComplete: true }));
    const page = create(); page.mobile = '09121234567'; page.submit(); page.code = '123456'; page.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/home', { replaceUrl: true });
  });
  it('keeps the code form open after an invalid code', () => {
    auth.verifyOtp.and.returnValue(throwError(() => ({ error: { message: 'invalid code' } })));
    const page = create(); page.mobile = '09121234567'; page.submit(); page.code = '123456'; page.submit();
    expect(page.codeSent()).toBeTrue(); expect(page.loading()).toBeFalse();
    expect(page.error()).toBe('invalid code'); expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
