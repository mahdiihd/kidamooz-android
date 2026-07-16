import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PlayerState } from '../../../../core/models/player-state.model';
import { Story } from '../../../../core/models/story.model';
import { StoryPlayerCardComponent } from '../story-player-card/story-player-card.component';

@Component({
  selector: 'app-story-player-panel',
  standalone: true,
  imports: [StoryPlayerCardComponent],
  template: `
    <section class="player-stage">
      <app-story-player-card
        [story]="story()"
        [playerState]="playerState()"
        [currentTime]="currentTime()"
        [duration]="duration()"
        (playToggle)="playToggle.emit()"
        (skipBack)="skipBack.emit()"
        (skipForward)="skipForward.emit()"
        (seek)="seek.emit($event)"
      />
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .player-stage {
      padding: 0 12px 8px;
      flex-shrink: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryPlayerPanelComponent {
  readonly story = input.required<Story>();
  readonly playerState = input<PlayerState>('idle');
  readonly currentTime = input(0);
  readonly duration = input(0);
  readonly playToggle = output<void>();
  readonly skipBack = output<void>();
  readonly skipForward = output<void>();
  readonly seek = output<number>();
}
