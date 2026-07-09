import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StarsVariant = 'body' | 'header' | 'footer';

const BODY_STARS = Array.from({ length: 30 }, (_, index) => ({
  left: (index * 17) % 100,
  top: (index * 23) % 100,
  delay: (index % 5) * 0.4,
}));

const HEADER_STARS = [
  { left: 18, top: 42, delay: 0 },
  { left: 76, top: 58, delay: 1.1 },
];

const FOOTER_STARS = [
  { left: 22, top: 38, delay: 0.3 },
  { left: 74, top: 52, delay: 1.4 },
];

const STAR_PRESETS: Record<StarsVariant, readonly { left: number; top: number; delay: number }[]> = {
  body: BODY_STARS,
  header: HEADER_STARS,
  footer: FOOTER_STARS,
};

@Component({
  selector: 'app-stars-background',
  standalone: true,
  host: {
    class: 'stars-host',
  },
  template: `
    <div class="stars" aria-hidden="true">
      @for (star of stars(); track star.left) {
        <span
          class="star"
          [style.left.%]="star.left"
          [style.top.%]="star.top"
          [style.animation-delay.s]="star.delay"
        ></span>
      }
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .stars {
      position: absolute;
      inset: 0;
    }

    .star {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--km-accent-moon);
      animation: km-twinkle 2.5s ease-in-out infinite;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarsBackgroundComponent {
  readonly variant = input<StarsVariant>('body');

  readonly stars = computed(() => STAR_PRESETS[this.variant()]);
}
