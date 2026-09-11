import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
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
  cloudUploadOutline,
  colorPaletteOutline,
  imagesOutline,
  micOutline,
  paperPlaneOutline,
  refreshOutline,
  stopCircleOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import { StoryDraft } from '../../core/models/story-draft.model';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { StoryDraftApiService } from '../../core/services/story-draft-api.service';
import { VoiceRecorderService } from '../../core/services/voice-recorder.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { StoryCoverChoiceComponent } from './story-cover-choice.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  arrowBackOutline,
  bookOutline,
  cameraOutline,
  chevronForwardOutline,
  cloudUploadOutline,
  colorPaletteOutline,
  imagesOutline,
  micOutline,
  paperPlaneOutline,
  refreshOutline,
  stopCircleOutline,
  swapHorizontalOutline,
});

type WizardStep = 'pick' | 'cover' | 'generating' | 'review' | 'record' | 'saving' | 'done';

type PendingAudio = {
  blob: Blob;
  fileName: string;
  durationSeconds: number;
};

const MAX_UPLOAD_BYTES = 52_428_800;
const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a']);

@Component({
  selector: 'app-create-story-wizard',
  standalone: true,
  imports: [
    StoryCoverChoiceComponent,
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
  @ViewChild('voiceFileInput') private voiceFileInput?: ElementRef<HTMLInputElement>;

  private readonly api = inject(StoryDraftApiService);
  private readonly auth = inject(MemberAuthService);
  private readonly recorder = inject(VoiceRecorderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<WizardStep>('pick');
  readonly coverChoice = signal<'drawing' | 'ai_free'>('drawing');
  readonly drawingPreview = signal('');
  private pendingDrawing: { blob: Blob; fileName: string } | null = null;
  readonly draft = signal<StoryDraft | null>(null);
  readonly error = signal('');
  readonly recording = signal(false);
  readonly picking = signal(false);
  readonly previewUrl = signal('');
  readonly pendingAudio = signal<PendingAudio | null>(null);
  readonly challengeTag = signal<string | null>(null);
  readonly generatingPhase = signal(0);
  titleFa = '';
  descriptionFa = '';
  storyScript = '';
  private generatingTimer: ReturnType<typeof setInterval> | null = null;

  readonly generatingTitleKey = computed(() => {
    const phases = [
      'myStories.generatingTitle1',
      'myStories.generatingTitle2',
      'myStories.drawingPreparingTitle',
      'myStories.generatingTitle4',
    ] as const;
    return phases[this.generatingPhase() % phases.length];
  });

  readonly generatingSubKey = computed(() => {
    const phases = [
      'myStories.generatingSub1',
      'myStories.generatingSub2',
      'myStories.drawingPreparingHint',
      'myStories.generatingSub4',
    ] as const;
    return phases[this.generatingPhase() % phases.length];
  });

  readonly activePlayerUrl = computed(() => {
    const pending = this.previewUrl();
    if (pending) {
      return pending;
    }
    const draft = this.draft();
    if (!draft) {
      return '';
    }
    return draft.uploadedAudioUrl ?? '';
  });

  readonly narrationBadgeKey = () => 'myStories.myNarration';

  readonly canSubmitWithoutRecording = computed(() => {
    const draft = this.draft();
    return Boolean(draft?.uploadedAudioUrl);
  });

  async ngOnInit(): Promise<void> {
    await this.auth.ensureHydrated();
    if (!this.auth.loggedIn()) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    const draftId = this.route.snapshot.queryParamMap.get('draftId');
    const challenge = this.route.snapshot.queryParamMap.get('challenge');
    if (challenge) {
      this.challengeTag.set(challenge);
    }
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
    this.stopGeneratingAnimation();
    this.recorder.cancel();
    this.clearPendingAudio();
    if (this.drawingPreview()) URL.revokeObjectURL(this.drawingPreview());
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
    this.clearPendingAudio();
    await this.tapFeedback();
    try {
      await this.recorder.start();
      this.recording.set(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      this.error.set(message === 'MIC_DENIED' ? 'micDenied' : 'recordFailed');
    }
  }

  async stopRecording(): Promise<void> {
    this.error.set('');
    await this.tapFeedback();
    try {
      const result = await this.recorder.stop();
      this.recording.set(false);
      this.revokePreview();
      this.previewUrl.set(URL.createObjectURL(result.blob));
      this.pendingAudio.set({
        blob: result.blob,
        fileName: result.fileName,
        durationSeconds: result.durationSeconds,
      });
    } catch {
      this.recording.set(false);
      this.error.set('recordFailed');
    }
  }

  async redoRecording(): Promise<void> {
    await this.tapFeedback();
    this.clearPendingAudio();
    this.error.set('');
  }


  openVoiceFilePicker(): void {
    this.voiceFileInput?.nativeElement.click();
  }

  async onVoiceFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.error.set('');
    if (file.size > MAX_UPLOAD_BYTES) {
      this.error.set('fileTooLarge');
      return;
    }

    const extension = this.fileExtension(file.name);
    if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
      this.error.set('fileTypeInvalid');
      return;
    }

    await this.tapFeedback();
    this.revokePreview();
    this.previewUrl.set(URL.createObjectURL(file));
    this.pendingAudio.set({
      blob: file,
      fileName: file.name,
      durationSeconds: 0,
    });
  }

  async submitRecording(): Promise<void> {
    const current = this.draft();
    const audio = this.pendingAudio();
    if (!current || !audio) {
      return;
    }

    this.error.set('');
    await this.tapFeedback();
    this.step.set('saving');
    try {
      const uploaded = await new Promise<StoryDraft>((resolve, reject) => {
        this.api
          .uploadAudio(current.id, audio.blob, audio.fileName, audio.durationSeconds || undefined)
          .subscribe({ next: resolve, error: reject });
      });

      const published = await new Promise<StoryDraft>((resolve, reject) => {
        this.api.submit(uploaded.id).subscribe({
          next: (draft) => resolve(draft),
          error: reject,
        });
      });

      this.applyDraft(published);
      this.pendingAudio.set(null);
      this.step.set('done');
    } catch {
      this.step.set('record');
      this.error.set('uploadFailed');
    }
  }

  async submitWithAvailableAudio(): Promise<void> {
    const current = this.draft();
    if (!current) {
      return;
    }
    if (this.pendingAudio()) {
      await this.submitRecording();
      return;
    }
    if (!current.uploadedAudioUrl) {
      this.error.set('noAudio');
      return;
    }

    this.error.set('');
    await this.tapFeedback();
    this.step.set('saving');
    try {
      const published = await new Promise<StoryDraft>((resolve, reject) => {
        this.api.submit(current.id).subscribe({
          next: (draft) => resolve(draft),
          error: reject,
        });
      });
      this.applyDraft(published);
      this.step.set('done');
    } catch {
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
        challengeTag: this.challengeTag(),
      })
      .subscribe({
        next: (draft) => {
          this.applyDraft(draft);
          this.step.set('record');
        },
        error: () => this.error.set('saveFailed'),
      });
  }

  joinChallenge(tag: string): void {
    this.challengeTag.set(tag);
  }

  private loadDraft(id: string): void {
    this.startGeneratingAnimation();
    this.step.set('generating');
    this.api.get(id).subscribe({
      next: (draft) => {
        this.stopGeneratingAnimation();
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
        this.stopGeneratingAnimation();
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

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const fileName = `drawing.${photo.format || 'jpeg'}`;
      if (this.drawingPreview()) URL.revokeObjectURL(this.drawingPreview());
      this.pendingDrawing = { blob, fileName };
      this.drawingPreview.set(URL.createObjectURL(blob));
      this.coverChoice.set('drawing');
      this.step.set('cover');
    } catch (error) {
      this.stopGeneratingAnimation();
      if (!this.isUserCancel(error)) {
        this.error.set('pickFailed');
      }
      this.step.set('pick');
    } finally {
      this.picking.set(false);
    }
  }

  changeDrawing(): void {
    this.error.set('');
    this.coverChoice.set('drawing');
    this.step.set('pick');
  }

  startStory(): void {
    if (this.step() !== 'cover' || !this.pendingDrawing || this.error() === 'dailyLimit') return;
    this.error.set('');
    this.startGeneratingAnimation();
    this.step.set('generating');
    this.api.createFromDrawing(
      this.pendingDrawing.blob, this.pendingDrawing.fileName, this.coverChoice()
    ).subscribe({
      next: (draft) => {
        this.stopGeneratingAnimation();
        this.applyDraft(draft);
        this.step.set('review');
      },
      error: (err: { status?: number; error?: { code?: string } }) => {
        this.stopGeneratingAnimation();
        this.error.set(err?.status === 429 || err?.error?.code === 'daily_limit_reached'
          ? 'dailyLimit' : 'generateFailed');
        this.step.set('cover');
      },
    });
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
    this.challengeTag.set(draft.challengeTag);
  }

  private startGeneratingAnimation(): void {
    this.stopGeneratingAnimation();
    this.generatingPhase.set(0);
    this.generatingTimer = setInterval(() => {
      this.generatingPhase.update((phase) => phase + 1);
    }, 2400);
  }

  private stopGeneratingAnimation(): void {
    if (this.generatingTimer) {
      clearInterval(this.generatingTimer);
      this.generatingTimer = null;
    }
  }

  private fileExtension(fileName: string): string {
    const index = fileName.lastIndexOf('.');
    return index >= 0 ? fileName.slice(index).toLowerCase() : '';
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set('');
    }
  }

  private clearPendingAudio(): void {
    this.revokePreview();
    this.pendingAudio.set(null);
  }
}
