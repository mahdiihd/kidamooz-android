import { Component, inject } from '@angular/core';

import { PushNotificationService } from '../../../core/services/push-notification.service';

@Component({
  selector: 'app-push-banner',
  standalone: true,
  template: `
    @if (push.banner(); as banner) {
      <div
        class="push-banner"
        role="status"
        (click)="onTap()"
        (keydown.enter)="onTap()"
        tabindex="0"
      >
        <div class="push-banner__glow"></div>
        <div class="push-banner__content">
          <p class="push-banner__title">{{ banner.title }}</p>
          @if (banner.body) {
            <p class="push-banner__body">{{ banner.body }}</p>
          }
        </div>
        <button
          type="button"
          class="push-banner__close"
          aria-label="بستن"
          (click)="onClose($event)"
        >
          ×
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset-inline: 0;
        top: calc(env(safe-area-inset-top, 0px) + 0.75rem);
        z-index: 10000;
        display: flex;
        justify-content: center;
        pointer-events: none;
        padding-inline: 1rem;
      }

      .push-banner {
        pointer-events: auto;
        position: relative;
        width: min(100%, 420px);
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.35rem 0.75rem;
        align-items: start;
        padding: 0.9rem 1rem;
        border-radius: 18px;
        overflow: hidden;
        background: linear-gradient(
          145deg,
          rgba(42, 21, 69, 0.96) 0%,
          rgba(26, 15, 46, 0.98) 100%
        );
        border: 1px solid rgba(255, 209, 102, 0.35);
        box-shadow: 0 12px 32px rgba(10, 4, 24, 0.45);
        animation: push-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        cursor: pointer;
      }

      .push-banner__glow {
        position: absolute;
        inset: auto -20% -60% auto;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 209, 102, 0.28), transparent 70%);
        pointer-events: none;
      }

      .push-banner__content {
        position: relative;
        min-width: 0;
      }

      .push-banner__title {
        margin: 0;
        color: var(--km-accent-moon);
        font-size: 0.98rem;
        font-weight: 700;
        line-height: 1.35;
      }

      .push-banner__body {
        margin: 0.25rem 0 0;
        color: rgba(255, 248, 230, 0.88);
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .push-banner__close {
        position: relative;
        border: 0;
        background: transparent;
        color: rgba(255, 248, 230, 0.7);
        font-size: 1.35rem;
        line-height: 1;
        padding: 0;
        width: 1.5rem;
        height: 1.5rem;
        cursor: pointer;
      }

      @keyframes push-slide-in {
        from {
          opacity: 0;
          transform: translateY(-18px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class PushBannerComponent {
  readonly push = inject(PushNotificationService);

  onTap(): void {
    this.push.openBannerStory();
  }

  onClose(event: Event): void {
    event.stopPropagation();
    this.push.dismissBanner();
  }
}
