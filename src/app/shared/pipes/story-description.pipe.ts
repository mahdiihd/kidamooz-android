import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'storyDescription',
  standalone: true,
  pure: false,
})
export class StoryDescriptionPipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(storyId: string): string {
    this.translation.language();
    return this.translation.translate(`content.stories.${storyId}.description`);
  }
}
