import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryDraft } from '../../core/models/story-draft.model';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { StoryDraftApiService } from '../../core/services/story-draft-api.service';
import { VoiceRecorderService } from '../../core/services/voice-recorder.service';
import { CreateStoryWizardPage } from './create-story-wizard.page';

describe('User narration preview', () => {
  function page() {
    TestBed.configureTestingModule({ providers: [
      { provide: StoryDraftApiService, useValue: {} },
      { provide: MemberAuthService, useValue: {} },
      { provide: VoiceRecorderService, useValue: {} },
      { provide: Router, useValue: {} },
      { provide: ActivatedRoute, useValue: {} },
    ] });
    return TestBed.runInInjectionContext(() => new CreateStoryWizardPage());
  }

  it('never previews or offers submission with only AI audio', () => {
    const component = page();
    component.draft.set({ audioUrl: '/ai.mp3', uploadedAudioUrl: null } as StoryDraft);
    expect(component.activePlayerUrl()).toBe('');
    expect(component.canSubmitWithoutRecording()).toBeFalse();
  });

  it('previews the user recording even when AI narration exists', () => {
    const component = page();
    component.draft.set({ audioUrl: '/ai.mp3', uploadedAudioUrl: '/user.mp3' } as StoryDraft);
    expect(component.activePlayerUrl()).toBe('/user.mp3');
    expect(component.canSubmitWithoutRecording()).toBeTrue();
    component.previewUrl.set('blob:new-recording');
    expect(component.activePlayerUrl()).toBe('blob:new-recording');
  });
});
