import { Component, computed, inject } from '@angular/core';

import { PwaInstallService } from '../../../core/services/pwa-install.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (install.visible()) {
      <aside class="pwa-banner" role="dialog" aria-labelledby="pwa-install-title">
        <div class="pwa-banner__glow"></div>
        <div class="pwa-banner__text">
          <p id="pwa-install-title" class="pwa-banner__title">
            {{ 'pwaInstall.title' | translate }}
          </p>
          <p class="pwa-banner__body">{{ bodyKey() | translate }}</p>
        </div>
        <div class="pwa-banner__actions">
          @if (install.canNativePrompt()) {
            <button type="button" class="pwa-banner__primary" (click)="onInstall()">
              {{ 'pwaInstall.install' | translate }}
            </button>
          }
          <button type="button" class="pwa-banner__secondary" (click)="onDismiss()">
            {{ 'pwaInstall.later' | translate }}
          </button>
        </div>
        <button
          type="button"
          class="pwa-banner__close"
          [attr.aria-label]="'pwaInstall.close' | translate"
          (click)="onDismiss()"
        >
          ×
        </button>
      </aside>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset-inline: 0;
        bottom: calc(var(--km-tab-bar-height, 72px) + var(--km-safe-bottom, 0px) + 0.65rem);
        z-index: 9990;
        display: flex;
        justify-content: center;
        pointer-events: none;
        padding-inline: 0.85rem;
      }

      .pwa-banner {
        pointer-events: auto;
        position: relative;
        width: min(100%, 420px);
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.55rem 0.7rem;
        padding: 0.95rem 1rem 0.9rem;
        border-radius: 18px;
        overflow: hidden;
        background: linear-gradient(
          145deg,
          rgba(42, 21, 69, 0.97) 0%,
          rgba(26, 15, 46, 0.99) 100%
        );
        border: 1px solid rgba(255, 209, 102, 0.38);
        box-shadow: 0 14px 36px rgba(10, 4, 24, 0.5);
        animation: pwa-slide-up 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .pwa-banner__glow {
        position: absolute;
        inset: auto auto -55% -15%;
        width: 170px;
        height: 170px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(123, 201, 80, 0.28), transparent 70%);
        pointer-events: none;
      }

      .pwa-banner__text {
        position: relative;
        grid-column: 1 / 2;
        min-width: 0;
        padding-inline-end: 0.5rem;
      }

      .pwa-banner__title {
        margin: 0;
        color: var(--km-accent-moon);
        font-size: 0.98rem;
        font-weight: 700;
        line-height: 1.35;
      }

      .pwa-banner__body {
        margin: 0.3rem 0 0;
        color: rgba(255, 248, 230, 0.88);
        font-size: 0.84rem;
        line-height: 1.5;
      }

      .pwa-banner__actions {
        position: relative;
        grid-column: 1 / 2;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .pwa-banner__primary,
      .pwa-banner__secondary {
        border: 0;
        border-radius: 999px;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        padding: 0.45rem 0.95rem;
        cursor: pointer;
      }

      .pwa-banner__primary {
        background: var(--km-accent-moon);
        color: #1a0f2e;
      }

      .pwa-banner__secondary {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 248, 230, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      .pwa-banner__close {
        position: relative;
        grid-column: 2;
        grid-row: 1;
        align-self: start;
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

      @keyframes pwa-slide-up {
        from {
          opacity: 0;
          transform: translateY(22px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class PwaInstallBannerComponent {
  readonly install = inject(PwaInstallService);

  readonly bodyKey = computed(() => {
    const hint = this.install.hint();
    if (hint === 'ios') {
      return 'pwaInstall.bodyIos';
    }
    if (hint === 'android' && this.install.canNativePrompt()) {
      return 'pwaInstall.bodyAndroidPrompt';
    }
    if (hint === 'android') {
      return 'pwaInstall.bodyAndroid';
    }
    return 'pwaInstall.bodyOther';
  });

  onInstall(): void {
    void this.install.install();
  }

  onDismiss(): void {
    void this.install.dismiss();
  }
}
