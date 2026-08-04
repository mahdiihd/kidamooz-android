import { Routes } from '@angular/router';

import { memberAuthGuard, storyCreateGuard } from './core/guards/story-create.guard';
import { environment } from '../environments/environment';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () =>
      import('./features/shell/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'stories',
        loadComponent: () =>
          import('./features/stories/story-list/story-list.page').then(
            (m) => m.StoryListPage
          ),
      },
      environment.features.parents
        ? {
            path: 'parents',
            data: { titleKey: 'tabs.parents' },
            loadComponent: () =>
              import('./features/placeholders/coming-soon/coming-soon.page').then(
                (m) => m.ComingSoonPage
              ),
          }
        : {
            path: 'parents',
            redirectTo: 'home',
            pathMatch: 'full',
          },
      {
        path: 'more',
        loadComponent: () =>
          import('./features/my-stories/my-stories-list.page').then(
            (m) => m.MyStoriesListPage
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'story/:id',
    loadComponent: () =>
      import('./features/stories/story-player/story-player.page').then(
        (m) => m.StoryPlayerPage
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/member-login.page').then((m) => m.MemberLoginPage),
  },
  {
    path: 'my-stories/create',
    canActivate: [memberAuthGuard, storyCreateGuard],
    loadComponent: () =>
      import('./features/my-stories/create-story-wizard.page').then(
        (m) => m.CreateStoryWizardPage
      ),
  },
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full',
  },
];
