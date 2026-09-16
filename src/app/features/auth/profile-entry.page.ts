import { Component, inject, signal } from '@angular/core';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { MemberLoginPage } from './member-login.page';
import { MemberProfilePage } from './member-profile.page';

@Component({
  selector: 'app-profile-entry',
  standalone: true,
  imports: [MemberLoginPage, MemberProfilePage],
  styles: [':host { display: flex; flex-direction: column; height: 100%; } app-member-login, app-member-profile { display: flex; flex-direction: column; flex: 1; min-height: 0; }'],
  template: `@if (ready()) { @if (auth.loggedIn()) { <app-member-profile /> } @else { <app-member-login /> } }`,
})
export class ProfileEntryPage {
  readonly auth = inject(MemberAuthService);
  readonly ready = signal(false);
  constructor() {
    void this.auth.getAccessToken().then(() => this.ready.set(true));
  }
}
