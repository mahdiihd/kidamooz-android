import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'categoryTitle',
  standalone: true,
  pure: false,
})
export class CategoryTitlePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(categoryId: string): string {
    this.translation.language();
    return this.translation.translate(`content.categories.${categoryId}.title`);
  }
}
