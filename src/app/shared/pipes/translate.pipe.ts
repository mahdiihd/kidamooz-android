import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string): string {
    this.translation.language();
    return this.translation.translate(key);
  }
}
