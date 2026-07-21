import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Camera,
  CameraResultType,
  CameraSource,
  type PermissionStatus,
} from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  bookOutline,
  cameraOutline,
  chevronForwardOutline,
  colorPaletteOutline,
  imagesOutline,
  micOutline,
  stopCircleOutline,
} from 'ionicons/icons';

import { StoryDraft } from '../../core/models/story-draft.model';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { StoryDraftApiService } from '../../core/services/story-draft-api.service';
import { VoiceRecorderService } from '../../core/services/voice-recorder.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  arrowBackOutline,
  bookOutline,
  cameraOutline,
  chevronForwardOutline,
  colorPaletteOutline,
  imagesOutline,
  micOutline,
  stopCircleOutline,
});

type WizardStep = 'pick' | 'generating' | 'review' | 'record' | 'saving' | 'done';

@Component({
  selector: 'app-create-story-wizard',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner,
    IonTextarea,
    PageHeaderComponent,
    StarsBackgroundComponent,
    TranslatePipe,
  ],
  templateUrl: './create-story-wizard.page.html',
  styleUrl: './create-story-wizard.page.scss',
})
export class CreateStoryWizardPage implements OnInit, OnDestroy {
  private readonly api = inject(StoryDraftApiService);
  private readonly auth = inject(MemberAuthService);
  private readonly recorder = inject(VoiceRecorderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<WizardStep>('pick');
  readonly draft = signal<StoryDraft | null>(null);
  readonly error = signal('');
  readonly recording = signal(false);
  readonly picking = signal(false);
  readonly previewUrl = signal('');
  titleFa = '';
  descriptionFa = '';
  storyScript = '';

  async ngOnInit(): Promise<void> {
    await this.auth.ensureHydrated();
    if (!this.auth.loggedIn()) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    const draftId = this.route.snapshot.queryParamMap.get('draftId');
    if (draftId) {
      this.loadDraft(draftId);
      return;
    }

    this.api.quota().subscribe({
      next: (quota) => {
        if (!quota.canCreateToday) {
          this.error.set('dailyLimit');
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.recorder.cancel();
    this.revokePreview();
  }

  async back(): Promise<void> {
    await this.tapFeedback();
    void this.router.navigateByUrl('/tabs/more', { replaceUrl: true });
  }

  async pickFromGallery(): Promise<void> {
    await this.pickImage(CameraSource.Photos);
  }

  async pickFromCamera(): Promise<void> {
    await this.pickImage(CameraSource.Camera);
  }

  async startRecording(): Promise<void> {
    this.error.set('');
    await this.tapFeedback();
    try {
      await this.recorder.start();
      this.recording.set(true);
    } catch {
      this.error.set('micDenied');
    }
  }

  async stopRecordingAndUpload(): Promise<void> {
    const current = this.draft();
    if (!current) {
      return;
    }

    this.error.set('');
    await this.tapFeedback();
    this.step.set('saving');
    try {
      const result = await this.recorder.stop();
      this.recording.set(false);
      this.revokePreview();
      this.previewUrl.set(URL.createObjectURL(result.blob));

      await new Promise<StoryDraft>((resolve, reject) => {
        this.api
          .uploadAudio(current.id, result.blob, result.fileName, result.durationSeconds)
          .subscribe({ next: resolve, error: reject });
      });

      const published = await new Promise<StoryDraft>((resolve, reject) => {
        this.api.submit(current.id).subscribe({
          next: (draft) => resolve(draft),
          error: reject,
        });
      });

      this.applyDraft(published);
      this.step.set('done');
    } catch {
      this.recording.set(false);
      this.step.set('record');
      this.error.set('uploadFailed');
    }
  }

  async saveScriptAndContinue(): Promise<void> {
    const current = this.draft();
    if (!current) {
      return;
    }

    this.error.set('');
    await this.tapFeedback();
    this.api
      .update(current.id, {
        titleFa: this.titleFa,
        descriptionFa: this.descriptionFa,
        storyScript: this.storyScript,
      })
      .subscribe({
        next: (draft) => {
          this.applyDraft(draft);
          this.step.set('record');
        },
        error: () => this.error.set('saveFailed'),
      });
  }

  private loadDraft(id: string): void {
    this.step.set('generating');
    this.api.get(id).subscribe({
      next: (draft) => {
        this.applyDraft(draft);
        if (draft.status === 'published' || draft.status === 'pending_review') {
          this.step.set('done');
        } else if (
          draft.status === 'ready' ||
          draft.status === 'audio_uploaded' ||
          draft.status === 'rejected'
        ) {
          this.step.set('review');
        } else {
          this.step.set('pick');
        }
      },
      error: () => {
        this.error.set('loadFailed');
        this.step.set('pick');
      },
    });
  }

  private async pickImage(source: CameraSource): Promise<void> {
    if (this.picking()) {
      return;
    }

    this.error.set('');
    this.picking.set(true);
    await this.tapFeedback();

    try {
      const quota = await new Promise<{ canCreateToday: boolean }>((resolve, reject) => {
        this.api.quota().subscribe({ next: resolve, error: reject });
      });
      if (!quota.canCreateToday) {
        this.error.set('dailyLimit');
        return;
      }

      const allowed = await this.ensureMediaPermission(source);
      if (!allowed) {
        this.error.set('permissionDenied');
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        width: 1600,
        resultType: CameraResultType.Uri,
        source,
        correctOrientation: true,
        saveToGallery: false,
        allowEditing: false,
      });

      if (!photo.webPath) {
        throw new Error('no path');
      }

      this.step.set('generating');
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const fileName = `drawing.${photo.format || 'jpeg'}`;

      this.api.createFromDrawing(blob, fileName).subscribe({
        next: (draft) => {
          this.applyDraft(draft);
          this.step.set('review');
        },
        error: (err: { status?: number; error?: { code?: string } }) => {
          const code = err?.error?.code;
          if (err?.status === 429 || code === 'daily_limit_reached') {
            this.error.set('dailyLimit');
          } else {
            this.error.set('generateFailed');
          }
          this.step.set('pick');
        },
      });
    } catch (error) {
      if (!this.isUserCancel(error)) {
        this.error.set('pickFailed');
      }
      this.step.set('pick');
    } finally {
      this.picking.set(false);
    }
  }

  private async ensureMediaPermission(source: CameraSource): Promise<boolean> {
    try {
      const current = await Camera.checkPermissions();
      if (this.hasPermission(current, source)) {
        return true;
      }

      const requested = await Camera.requestPermissions({
        permissions: source === CameraSource.Camera ? ['camera'] : ['photos'],
      });
      return this.hasPermission(requested, source);
    } catch {
      return true;
    }
  }

  private hasPermission(status: PermissionStatus, source: CameraSource): boolean {
    if (source === CameraSource.Camera) {
      return status.camera === 'granted' || status.camera === 'limited';
    }
    return status.photos === 'granted' || status.photos === 'limited';
  }

  private isUserCancel(error: unknown): boolean {
    const message = String((error as { message?: string })?.message ?? error ?? '').toLowerCase();
    return message.includes('cancel') || message.includes('user denied');
  }

  private async tapFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      return;
    }
  }

  private applyDraft(draft: StoryDraft): void {
    this.draft.set(draft);
    this.titleFa = draft.titleFa;
    this.descriptionFa = draft.descriptionFa;
    this.storyScript = draft.storyScript;
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set('');
    }
  }
}
