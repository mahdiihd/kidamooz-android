import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { DurationPipe } from '../../../../shared/pipes/duration.pipe';
import {
  extractProgressIconKeyFromUrl,
  resolveProgressIconAsset,
  resolveProgressIconTheme,
} from '../../../../core/models/progress-icon.model';

const THUMB_SIZE = 112;
const THUMB_HALF = THUMB_SIZE / 2;
const DISC_SIZE = 16;

@Component({
  selector: 'app-story-progress-bar',
  standalone: true,
  imports: [DurationPipe],
  template: `
    <div class="progress" [style.--progress-fill]="theme().fill" [style.--progress-soft]="theme().fillSoft" [style.--progress-deep]="theme().fillDeep">
      <div class="progress__track">
        <div
          class="progress__rail-slot"
          role="slider"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="duration() || 1"
          [attr.aria-valuenow]="current()"
          [attr.aria-label]="ariaLabel()"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
        >
          <div class="progress__rail">
            <svg class="progress__waves" viewBox="0 0 360 10" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient [attr.id]="fillGradientId" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" [attr.stop-color]="theme().fillSoft" />
                  <stop offset="45%" [attr.stop-color]="theme().fill" />
                  <stop offset="100%" [attr.stop-color]="theme().fillDeep" />
                </linearGradient>
                <clipPath [attr.id]="pillClipId" clipPathUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="360" height="10" rx="3" ry="3" />
                </clipPath>
                <clipPath [attr.id]="progressClipId" clipPathUnits="userSpaceOnUse">
                  <rect x="0" y="0" [attr.width]="clipWidth()" height="10" />
                </clipPath>
              </defs>

              <g [attr.clip-path]="'url(#' + pillClipId + ')'">
                <path class="progress__wave-base" [attr.d]="seaPath" />
                <path
                  class="progress__wave-fill"
                  [attr.d]="seaPath"
                  [attr.fill]="'url(#' + fillGradientId + ')'"
                  [attr.clip-path]="'url(#' + progressClipId + ')'"
                />
              </g>
            </svg>
          </div>
        </div>

        <div class="progress__thumb" [style.left]="thumbLeft()">
          <span class="progress__disc" aria-hidden="true"></span>
          <img [src]="resolvedThumbUrl()" alt="" />
        </div>
      </div>

      <div class="progress__times">
        <span>{{ current() | duration }}</span>
        <span>{{ duration() | duration }}</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      --thumb-size: ${THUMB_SIZE}px;
      --thumb-half: ${THUMB_HALF}px;
      --disc-size: ${DISC_SIZE}px;
    }

    .progress {
      padding: 22px 6px 0;
      direction: ltr;
      overflow: visible;
    }

    .progress__track {
      position: relative;
      height: 18px;
      display: flex;
      align-items: center;
      overflow: visible;
      direction: ltr;
    }

    .progress__rail-slot {
      width: 100%;
      box-sizing: border-box;
      touch-action: none;
      cursor: pointer;
    }

    .progress__rail {
      position: relative;
      width: 100%;
      height: 10px;
      overflow: visible;
    }

    .progress__waves {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .progress__wave-base {
      fill: color-mix(in srgb, var(--progress-fill, #5ec8e8) 28%, transparent);
    }

    .progress__thumb {
      position: absolute;
      top: 50%;
      width: var(--thumb-size);
      height: var(--thumb-size);
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: left 0.14s linear;
      z-index: 2;
      will-change: left;
    }

    .progress__disc {
      position: absolute;
      top: 50%;
      left: 50%;
      width: var(--disc-size);
      height: var(--disc-size);
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #fff;
      border: 3px solid var(--progress-fill, #5ec8e8);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
      z-index: 0;
    }

    .progress__thumb img {
      position: absolute;
      left: 50%;
      bottom: calc(16% - 2px);
      width: var(--thumb-size);
      height: var(--thumb-size);
      transform: translate(-50%, 0);
      object-fit: contain;
      object-position: center bottom;
      display: block;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.28));
      z-index: 1;
      pointer-events: none;
    }

    .progress__times {
      display: flex;
      justify-content: space-between;
      margin-top: 0;
      padding-inline: 4px;
      font-size: 0.64rem;
      font-weight: 700;
      color: rgba(255, 248, 240, 0.65);
      letter-spacing: 0.02em;
      direction: ltr;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryProgressBarComponent {
  readonly current = input(0);
  readonly duration = input(0);
  readonly thumbUrl = input('');
  readonly iconKey = input('');
  readonly ariaLabel = input('progress');
  readonly seek = output<number>();

  readonly pillClipId = 'km-sea-pill-clip';
  readonly progressClipId = 'km-sea-progress-clip';
  readonly fillGradientId = 'km-progress-fill-gradient';

  readonly theme = computed(() => {
    const key = this.iconKey().trim() || extractProgressIconKeyFromUrl(this.thumbUrl());
    return resolveProgressIconTheme(key);
  });

  readonly resolvedThumbUrl = computed(() => {
    const custom = this.thumbUrl().trim();
    if (custom.startsWith('assets/') || custom.startsWith('http')) {
      return custom;
    }
    return resolveProgressIconAsset(custom || this.iconKey());
  });

  readonly seaPath =
    'M0 10 L0 4 L5 4 ' +
    'Q 11 1.8 17 4 T 29 4 T 41 4 T 53 4 T 65 4 T 77 4 T 89 4 T 101 4 ' +
    'T 113 4 T 125 4 T 137 4 T 149 4 T 161 4 T 173 4 T 185 4 T 197 4 ' +
    'T 209 4 T 221 4 T 233 4 T 245 4 T 257 4 T 269 4 T 281 4 T 293 4 ' +
    'T 305 4 T 317 4 T 329 4 T 341 4 ' +
    'L355 4 L360 4 L360 10 Z';

  private dragging = false;

  readonly progressPercent = computed(() => {
    const duration = this.duration();
    if (!duration || duration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (this.current() / duration) * 100));
  });

  readonly clipWidth = computed(() => (this.progressPercent() / 100) * 360);

  readonly thumbLeft = computed(() => `${this.progressPercent()}%`);

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.emitSeek(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.emitSeek(event);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  private emitSeek(event: PointerEvent): void {
    const slot = event.currentTarget as HTMLElement;
    const rail = slot.querySelector('.progress__rail') as HTMLElement | null;
    const rect = (rail ?? slot).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.seek.emit(ratio * (this.duration() || 0));
  }
}
