import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { IonContent } from '@ionic/angular/standalone';

import { CategoryTitlePipe } from '../../../shared/pipes/category-title.pipe';

import { Story } from '../../../core/models/story.model';

import { StoryCatalogStore } from '../../../core/services/story-catalog.store';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

import { LoadingMoonComponent } from '../../../shared/components/loading-moon/loading-moon.component';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

import { StarsBackgroundComponent } from '../../../shared/components/stars-background/stars-background.component';

import { StoryCardComponent } from '../../../shared/components/story-card/story-card.component';

import { TranslatePipe } from '../../../shared/pipes/translate.pipe';



type PageState = 'loading' | 'ready' | 'error';



@Component({

  selector: 'app-story-list',

  standalone: true,

  imports: [

    IonContent,

    PageHeaderComponent,

    CategoryTitlePipe,

    StarsBackgroundComponent,

    StoryCardComponent,

    LoadingMoonComponent,

    ErrorStateComponent,

    EmptyStateComponent,

    TranslatePipe,

  ],

  templateUrl: './story-list.page.html',

  styleUrl: './story-list.page.scss',

})

export class StoryListPage implements OnInit {

  private readonly catalogStore = inject(StoryCatalogStore);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);



  readonly selectedCategoryId = signal<string | null>(null);

  readonly categories = this.catalogStore.categories;

  readonly stories = computed(() =>

    this.catalogStore.getStoriesByCategory(this.selectedCategoryId())

  );

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

    const categoryId = this.route.snapshot.queryParamMap.get('categoryId');

    this.selectedCategoryId.set(categoryId);

    void this.catalogStore.ensureReady();

  }



  selectCategory(categoryId: string | null): void {

    this.selectedCategoryId.set(categoryId);

    void this.router.navigate([], {

      relativeTo: this.route,

      queryParams: { categoryId: categoryId ?? null },

      queryParamsHandling: 'merge',

    });

  }



  onStorySelected(story: Story): void {

    void this.router.navigate(['/story', story.id]);

  }



  loadStories(): void {

    void this.catalogStore.refresh();

  }

}


