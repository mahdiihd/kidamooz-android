import { Component, OnInit, computed, inject } from '@angular/core';

import { Router } from '@angular/router';

import { IonContent } from '@ionic/angular/standalone';

import { Category } from '../../core/models/category.model';
import { Story } from '../../core/models/story.model';
import { StoryCatalogStore } from '../../core/services/story-catalog.store';
import { CategoryIslandComponent } from '../../shared/components/category-island/category-island.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingMoonComponent } from '../../shared/components/loading-moon/loading-moon.component';
import { MoonMascotComponent } from '../../shared/components/moon-mascot/moon-mascot.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { StoryCardComponent } from '../../shared/components/story-card/story-card.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';



type PageState = 'loading' | 'ready' | 'error';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    IonContent,

    PageHeaderComponent,

    StarsBackgroundComponent,

    MoonMascotComponent,

    CategoryIslandComponent,

    StoryCardComponent,

    LoadingMoonComponent,

    ErrorStateComponent,

    TranslatePipe,

  ],

  templateUrl: './home.page.html',

  styleUrl: './home.page.scss',

})

export class HomePage implements OnInit {

  private readonly catalogStore = inject(StoryCatalogStore);

  private readonly router = inject(Router);



  readonly categories = this.catalogStore.categories;

  readonly featuredStories = computed(() => this.catalogStore.getFeaturedStories(4));

  readonly pageState = computed<PageState>(() => {

    if (this.catalogStore.status() === 'error' && !this.catalogStore.hasCachedData()) {

      return 'error';

    }



    if (!this.catalogStore.hasCachedData() && this.catalogStore.status() !== 'ready') {

      return 'loading';

    }



    return 'ready';

  });



  ngOnInit(): void {

    void this.catalogStore.ensureReady();

  }



  onCategorySelected(category: Category): void {

    void this.router.navigate(['/tabs/stories'], {

      queryParams: { categoryId: category.id },

    });

  }



  onStorySelected(story: Story): void {
    void this.router.navigate(['/tabs/stories'], {
      queryParams: { storyId: story.id },
    });
  }



  loadContent(): void {

    void this.catalogStore.refresh();

  }

}


