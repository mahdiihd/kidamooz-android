import 'zone.js';
import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { StoryCoverChoiceComponent } from '../src/app/features/my-stories/story-cover-choice.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StoryCoverChoiceComponent],
  template: `<main dir="rtl" style="max-width: 580px; margin: auto; padding: 24px 20px;">
    <app-story-cover-choice [preview]="drawing" [coverChoice]="choice()"
      (selectionChange)="choice.set($event)" (createRequested)="continued.set(true)" />
    @if (continued()) { <p role="status">پیش‌نمایش طراحی؛ درخواستی برای ساخت قصه ارسال نشده است.</p> }
  </main>`,
})
class CoverChoicePreview {
  readonly choice = signal<'drawing' | 'ai_free'>('drawing');
  readonly continued = signal(false);
  readonly drawing = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#fff8eb"/><path d="M5 100Q30 78 56 100T115 95" fill="none" stroke="#8abb68" stroke-width="5"/><path d="M30 90V53L59 29L88 55V90Z" fill="#ffe4ab" stroke="#b780c9" stroke-width="4" stroke-linejoin="round"/><path d="M21 58L58 23L95 59M52 89V68H68V90" fill="none" stroke="#e18776" stroke-width="4" stroke-linecap="round"/><circle cx="98" cy="21" r="10" fill="#ffd166"/></svg>');
}

bootstrapApplication(CoverChoicePreview).catch(console.error);
