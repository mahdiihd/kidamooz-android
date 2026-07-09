import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PlayerSnapshot, PlayerState } from '../models/player-state.model';

const INITIAL_SNAPSHOT: PlayerSnapshot = {
  storyId: null,
  currentTime: 0,
  duration: 0,
  state: 'idle',
};

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private readonly snapshotSubject = new BehaviorSubject<PlayerSnapshot>(
    INITIAL_SNAPSHOT
  );

  readonly snapshot$ = this.snapshotSubject.asObservable();

  get snapshot(): PlayerSnapshot {
    return this.snapshotSubject.value;
  }

  async load(storyId: string, audioUrl: string): Promise<void> {
    this.destroyAudio();
    this.updateSnapshot({
      storyId,
      currentTime: 0,
      duration: 0,
      state: 'loading',
    });

    this.audio = new Audio(audioUrl);
    this.bindAudioEvents();

    try {
      await this.audio.play();
      this.audio.pause();
      this.audio.currentTime = 0;
      this.updateSnapshot({ state: 'idle', duration: this.audio.duration || 0 });
    } catch {
      this.updateSnapshot({ state: 'error' });
    }
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

  private bindAudioEvents(): void {
    if (!this.audio) {
      return;
    }

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) {
        return;
      }

      this.updateSnapshot({
        currentTime: this.audio.currentTime,
        duration: this.audio.duration || this.snapshot.duration,
      });
    });

    this.audio.addEventListener('ended', () => {
      this.updateSnapshot({ state: 'idle', currentTime: 0 });
    });

    this.audio.addEventListener('error', () => {
      this.updateSnapshot({ state: 'error' });
    });
  }

  private destroyAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  private updateSnapshot(partial: Partial<PlayerSnapshot>): void {
    this.snapshotSubject.next({ ...this.snapshot, ...partial });
  }
}
