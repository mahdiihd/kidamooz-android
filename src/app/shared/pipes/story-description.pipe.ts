import { Pipe, PipeTransform, inject } from '@angular/core';

import { Story } from '../../core/models/story.model';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'storyDescription',
  standalone: true,
  pure: false,
})
export class StoryDescriptionPipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(story: Story | string | null | undefined): string {
    this.translation.language();
    if (!story) {
      return '';
    }

    if (typeof story === 'string') {
      return this.translation.translate(`content.stories.${story}.description`);
    }

    return this.translation.language() === 'en'
      ? story.descriptionEn || story.descriptionFa || story.description
      : story.descriptionFa || story.description;
  }
}
