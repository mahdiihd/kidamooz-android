import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { chevronForwardOutline } from 'ionicons/icons';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-story-cover-choice',
  standalone: true,
  imports: [TranslatePipe, IonIcon],
  templateUrl: './story-cover-choice.component.html',
  styleUrl: './story-cover-choice.component.scss',
})
export class StoryCoverChoiceComponent {
  readonly continueIcon = chevronForwardOutline;
  readonly preview = input.required<string>();
  readonly coverChoice = input<'drawing' | 'ai_free'>('drawing');
  readonly disabled = input(false);
  readonly selectionChange = output<'drawing' | 'ai_free'>();
  readonly createRequested = output<void>();
  readonly changeDrawing = output<void>();
}
