import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PlayerSnapshot } from '../models/player-state.model';

const INITIAL_SNAPSHOT: PlayerSnapshot = {
  storyId: null,
  currentTime: 0,
  duration: 0,
  state: 'idle',
};

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private loadToken = 0;
  private readonly snapshotSubject = new BehaviorSubject<PlayerSnapshot>(
    INITIAL_SNAPSHOT
  );

  readonly snapshot$ = this.snapshotSubject.asObservable();

  get snapshot(): PlayerSnapshot {
    return this.snapshotSubject.value;
  }

  async load(storyId: string, audioUrl: string): Promise<void> {
    this.destroyAudio();
    const token = ++this.loadToken;

    this.updateSnapshot({
      storyId,
      currentTime: 0,
      duration: 0,
      state: 'loading',
    });

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;
    this.audio = audio;
    this.bindAudioEvents(audio, token);

    await this.waitForMetadata(audio, token);
  }

  async play(): Promise<void> {
    if (!this.audio) {
      return;
    }

    try {
      await this.audio.play();
      this.updateSnapshot({ state: 'playing' });
    } catch {
      this.updateSnapshot({ state: 'error' });
    }
  }

  pause(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.updateSnapshot({ state: 'paused' });
  }

  togglePlay(): Promise<void> {
    if (this.snapshot.state === 'playing') {
      this.pause();
      return Promise.resolve();
    }

    return this.play();
  }

  seekTo(seconds: number): void {
    if (!this.audio) {
      return;
    }

    this.audio.currentTime = seconds;
    this.updateSnapshot({ currentTime: seconds });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    this.updateSnapshot({
      currentTime: 0,
      state: 'idle',
    });
  }

  destroy(): void {
    this.destroyAudio();
    this.snapshotSubject.next(INITIAL_SNAPSHOT);
  }

  private waitForMetadata(audio: HTMLAudioElement, token: number): Promise<void> {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      if (token === this.loadToken) {
        this.updateSnapshot({ state: 'idle', duration: audio.duration });
      }
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const finish = (state: 'idle' | 'error', duration = 0) => {
        audio.removeEventListener('loadedmetadata', onMeta);
        audio.removeEventListener('canplay', onReady);
        audio.removeEventListener('error', onError);
        window.clearTimeout(timeoutId);

        if (token !== this.loadToken) {
          resolve();
          return;
        }

        this.updateSnapshot({ state, duration });
        resolve();
      };

      const onMeta = () => {
        finish('idle', audio.duration || 0);
      };

      const onReady = () => {
        finish('idle', audio.duration || 0);
      };

      const onError = () => {
        finish('error');
      };

      audio.addEventListener('loadedmetadata', onMeta);
      audio.addEventListener('canplay', onReady);
      audio.addEventListener('error', onError);

      const timeoutId = window.setTimeout(() => {
        finish('idle', audio.duration || 0);
      }, 2500);

      audio.load();
    });
  }

  private bindAudioEvents(audio: HTMLAudioElement, token: number): void {
    audio.addEventListener('timeupdate', () => {
      if (token !== this.loadToken || !this.audio) {
        return;
      }

      this.updateSnapshot({
        currentTime: this.audio.currentTime,
        duration: this.audio.duration || this.snapshot.duration,
      });
    });

    audio.addEventListener('ended', () => {
      if (token !== this.loadToken) {
        return;
      }

      this.updateSnapshot({ state: 'idle', currentTime: 0 });
    });

    audio.addEventListener('error', () => {
      if (token !== this.loadToken) {
        return;
      }

      this.updateSnapshot({ state: 'error' });
    });
  }

  private destroyAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
  }

  private updateSnapshot(partial: Partial<PlayerSnapshot>): void {
    this.snapshotSubject.next({ ...this.snapshot, ...partial });
  }
}
