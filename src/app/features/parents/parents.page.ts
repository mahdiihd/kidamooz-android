import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  checkmarkOutline,
  chevronForwardOutline,
  cloudDownloadOutline,
  heartOutline,
  lockClosedOutline,
  personOutline,
  trashOutline,
} from 'ionicons/icons';

import { ChildProfile, MemberEngagement } from '../../core/models/member-feature.model';
import { AudioCacheService } from '../../core/services/audio-cache.service';
import { ChildProfileApiService } from '../../core/services/child-profile-api.service';
import { EngagementApiService } from '../../core/services/engagement-api.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { ParentSettingsService } from '../../core/services/parent-settings.service';
import { StoryCatalogStore } from '../../core/services/story-catalog.store';
import { MoonMascotComponent } from '../../shared/components/moon-mascot/moon-mascot.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  addOutline,
  checkmarkOutline,
  chevronForwardOutline,
  cloudDownloadOutline,
  heartOutline,
  lockClosedOutline,
  personOutline,
  trashOutline,
});

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner,
    MoonMascotComponent,
    PageHeaderComponent,
    StarsBackgroundComponent,
    TranslatePipe,
  ],
  templateUrl: './parents.page.html',
  styleUrl: './parents.page.scss',
})
export class ParentsPage implements OnInit {
  private readonly settings = inject(ParentSettingsService);
  private readonly childrenApi = inject(ChildProfileApiService);
  private readonly engagementApi = inject(EngagementApiService);
  private readonly favorites = inject(FavoritesService);
  private readonly catalog = inject(StoryCatalogStore);
  private readonly auth = inject(MemberAuthService);
  private readonly audioCache = inject(AudioCacheService);
  private readonly router = inject(Router);

  readonly unlocked = signal(false);
  readonly hasPin = this.settings.hasPin;
  readonly children = this.settings.children;
  readonly activeChildId = this.settings.activeChildId;
  readonly engagement = signal<MemberEngagement | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly downloadingId = signal<string | null>(null);
  readonly loggedIn = this.auth.loggedIn;

  pinInput = '';
  newPin = '';
  childName = '';
  childAge: number | null = null;

  readonly favoriteStories = computed(() => {
    const ids = this.favorites.ids();
    return this.catalog.stories().filter((s) => ids.has(s.id));
  });

  readonly isPlus = computed(() => this.engagement()?.planTier === 'plus');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureHydrated();
    await this.settings.ensureReady();
    await this.favorites.ensureReady();
    void this.catalog.ensureReady();
    this.unlocked.set(this.settings.isUnlocked() || !this.settings.hasPin());
    if (this.unlocked()) {
      await this.loadHub();
    }
  }

  goLogin(): void {
    void this.router.navigateByUrl('/auth/login');
  }

  async unlock(): Promise<void> {
    this.error.set('');
    const ok = await this.settings.verifyPin(this.pinInput);
    if (!ok) {
      this.error.set('parents.pinWrong');
      return;
    }
    this.pinInput = '';
    this.unlocked.set(true);
    await this.loadHub();
  }

  async setupPin(): Promise<void> {
    this.error.set('');
    try {
      await this.settings.setPin(this.newPin);
      this.newPin = '';
      this.unlocked.set(true);
      await this.loadHub();
    } catch {
      this.error.set('parents.pinInvalid');
    }
  }

  lockNow(): void {
    this.settings.lock();
    this.unlocked.set(false);
  }

  async selectChild(id: string): Promise<void> {
    await this.settings.setActiveChild(id);
  }

  async addChild(): Promise<void> {
    this.error.set('');
    await this.auth.ensureHydrated();
    if (!this.auth.isLoggedIn()) {
      this.goLogin();
      return;
    }
    if (!this.childName.trim()) {
      this.error.set('parents.childNameRequired');
      return;
    }
    const age = this.childAge == null ? 5 : Math.min(14, Math.max(1, Number(this.childAge)));
    this.busy.set(true);
    this.childrenApi
      .create({ name: this.childName.trim(), age, avatarKey: 'moon' })
      .subscribe({
        next: async (child) => {
          this.childName = '';
          this.childAge = null;
          await this.settings.refreshChildren();
          await this.settings.setActiveChild(child.id);
          this.busy.set(false);
        },
        error: () => {
          this.error.set('parents.childSaveFailed');
          this.busy.set(false);
        },
      });
  }

  async removeChild(child: ChildProfile): Promise<void> {
    this.busy.set(true);
    this.childrenApi.delete(child.id).subscribe({
      next: async () => {
        await this.settings.refreshChildren();
        this.busy.set(false);
      },
      error: () => {
        this.error.set('parents.childSaveFailed');
        this.busy.set(false);
      },
    });
  }

  openStory(storyId: string): void {
    void this.router.navigate(['/tabs/stories'], { queryParams: { storyId } });
  }

  async downloadFavorite(storyId: string, audioUrl: string): Promise<void> {
    if (!this.isPlus() || !audioUrl || this.downloadingId()) {
      return;
    }
    this.downloadingId.set(storyId);
    try {
      await this.audioCache.ensureCached(storyId, audioUrl);
    } finally {
      this.downloadingId.set(null);
    }
  }

  private async loadHub(): Promise<void> {
    await this.auth.ensureHydrated();
    if (!this.auth.isLoggedIn()) {
      return;
    }
    await this.settings.refreshChildren();
    await this.favorites.pullFromServer();
    this.engagementApi.me().subscribe({
      next: (eng) => this.engagement.set(eng),
      error: () => this.engagement.set(null),
    });
  }
}
