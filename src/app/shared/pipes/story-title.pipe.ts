import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'storyTitle',
  standalone: true,
  pure: false,
})
export class StoryTitlePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(storyId: string): string {
    this.translation.language();
    return this.translation.translate(`content.stories.${storyId}.title`);
  }
}
