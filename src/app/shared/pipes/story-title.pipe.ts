import { Pipe, PipeTransform, inject } from '@angular/core';

import { Story } from '../../core/models/story.model';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'storyTitle',
  standalone: true,
  pure: false,
})
export class StoryTitlePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(story: Story | string | null | undefined): string {
    this.translation.language();
    if (!story) {
      return '';
    }

    if (typeof story === 'string') {
      return this.translation.translate(`content.stories.${story}.title`);
    }

    return this.translation.language() === 'en'
      ? story.titleEn || story.titleFa || story.title
      : story.titleFa || story.title;
  }
}
