import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { DurationPipe } from '../../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-story-progress-bar',
  standalone: true,
  imports: [DurationPipe],
  template: `
    <div class="progress">
      <div
        class="progress__track"
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
        <div class="progress__fill" [style.width.%]="progressPercent()"></div>
        <div class="progress__thumb" [style.inset-inline-start.%]="progressPercent()">
          <span class="progress__orb" aria-hidden="true"></span>
          <img [src]="thumbUrl()" alt="" />
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
    }

    .progress {
      padding: 10px 14px 0;
    }

    .progress__track {
      position: relative;
      height: 12px;
      border-radius: 999px;
      background: rgba(255, 248, 240, 0.14);
      touch-action: none;
      cursor: pointer;
      overflow: visible;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    .progress__fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        #ffe08a 0%,
        var(--km-accent-moon) 50%,
        var(--km-accent-lavender) 100%
      );
      box-shadow: 0 0 14px rgba(255, 209, 102, 0.3);
      transition: width 0.14s linear;
    }

    .progress__thumb {
      position: absolute;
      top: 50%;
      width: 28px;
      height: 28px;
      margin-top: -14px;
      margin-inline-start: -14px;
      pointer-events: none;
      transition: inset-inline-start 0.14s linear;
      display: grid;
      place-items: center;
    }

    .progress__orb {
      position: absolute;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff, var(--km-accent-moon-soft));
      box-shadow:
        0 0 0 3px rgba(255, 209, 102, 0.28),
        0 4px 12px rgba(0, 0, 0, 0.28);
    }

    .progress__thumb img {
      position: relative;
      z-index: 1;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }

    .progress__times {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding-inline: 2px;
      font-size: 0.64rem;
      font-weight: 700;
      color: rgba(255, 248, 240, 0.65);
      letter-spacing: 0.02em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryProgressBarComponent {
  readonly current = input(0);
  readonly duration = input(0);
  readonly thumbUrl = input('');
  readonly ariaLabel = input('progress');
  readonly seek = output<number>();

  private dragging = false;

  readonly progressPercent = computed(() => {
    const duration = this.duration();
    if (!duration || duration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (this.current() / duration) * 100));
  });

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
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    let ratio = (event.clientX - rect.left) / rect.width;
    if (getComputedStyle(target).direction === 'rtl') {
      ratio = 1 - ratio;
    }
    ratio = Math.min(1, Math.max(0, ratio));
    this.seek.emit(ratio * (this.duration() || 0));
  }
}
