import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'coverUrl',
  standalone: true,
})
export class CoverUrlPipe implements PipeTransform {
  private static readonly placeholder = 'assets/images/story-cover-placeholder.svg';

  transform(value: string | null | undefined): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : CoverUrlPipe.placeholder;
  }
}
