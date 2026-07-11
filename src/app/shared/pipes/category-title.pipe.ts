import { Pipe, PipeTransform, inject } from '@angular/core';

import { Category } from '../../core/models/category.model';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'categoryTitle',
  standalone: true,
  pure: false,
})
export class CategoryTitlePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(category: Category | string | null | undefined): string {
    this.translation.language();
    if (!category) {
      return '';
    }

    if (typeof category === 'string') {
      return this.translation.translate(`content.categories.${category}.title`);
    }

    return this.translation.language() === 'en'
      ? category.titleEn || category.titleFa || category.title
      : category.titleFa || category.title;
  }
}
