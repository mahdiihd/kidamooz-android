import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { MoonMascotComponent } from '../../../shared/components/moon-mascot/moon-mascot.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [
    IonContent,
    PageHeaderComponent,
    StarsBackgroundComponent,
    MoonMascotComponent,
    TranslatePipe,
  ],
  templateUrl: './coming-soon.page.html',
  styleUrl: './coming-soon.page.scss',
})
export class ComingSoonPage {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey =
    (this.route.snapshot.data['titleKey'] as string | undefined) ?? 'states.comingSoon';
}
