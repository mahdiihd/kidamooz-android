import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { PlayerSnapshot } from '../models/player-state.model';

export interface AudioLoadOptions {
  title?: string;
  artist?: string;
  artworkUrl?: string;
}

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
  private mediaTitle = '';
  private mediaArtist = '';
  private mediaArtworkUrl = '';
  private readonly snapshotSubject = new BehaviorSubject<PlayerSnapshot>(
    INITIAL_SNAPSHOT
  );
  private readonly endedSubject = new Subject<string>();

  readonly snapshot$ = this.snapshotSubject.asObservable();
  readonly ended$ = this.endedSubject.asObservable();

  get snapshot(): PlayerSnapshot {
    return this.snapshotSubject.value;
  }

  async load(
    storyId: string,
    audioUrl: string,
    options: AudioLoadOptions = {},
  ): Promise<void> {
    this.destroyAudio();
    const token = ++this.loadToken;
    this.mediaTitle = options.title || '';
    this.mediaArtist = options.artist || 'کیدآموز';
    this.mediaArtworkUrl = options.artworkUrl || '';

    this.updateSnapshot({
      storyId,
      currentTime: 0,
      duration: 0,
      state: 'loading',
    });

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.src = audioUrl;
    this.audio = audio;
    this.bindAudioEvents(audio, token);
    this.setupMediaSession();

    await this.waitForMetadata(audio, token);
  }

  async play(): Promise<void> {
    if (!this.audio) {
      return;
    }

    try {
      await this.audio.play();
      this.updateSnapshot({ state: 'playing' });
      this.setMediaSessionPlaybackState('playing');
    } catch {
      this.updateSnapshot({ state: 'error' });
      this.setMediaSessionPlaybackState('none');
    }
  }

  pause(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.updateSnapshot({ state: 'paused' });
    this.setMediaSessionPlaybackState('paused');
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

    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
    const next = Math.min(Math.max(0, seconds), duration > 0 ? duration : seconds);
    this.audio.currentTime = next;
    this.updateSnapshot({ currentTime: next });
    this.updateMediaSessionPosition();
  }

  seekBy(deltaSeconds: number): void {
    const base = this.audio?.currentTime ?? this.snapshot.currentTime;
    this.seekTo(base + deltaSeconds);
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    this.updateSnapshot({
      storyId: null,
      currentTime: 0,
      duration: 0,
      state: 'idle',
    });
    this.setMediaSessionPlaybackState('none');
  }

  destroy(): void {
    this.destroyAudio();
    this.clearMediaSession();
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
      this.updateMediaSessionPosition();
    });

    audio.addEventListener('ended', () => {
      if (token !== this.loadToken) {
        return;
      }

      const finishedId = this.snapshot.storyId;
      this.updateSnapshot({ state: 'idle', currentTime: 0 });
      this.setMediaSessionPlaybackState('none');
      if (finishedId) {
        this.endedSubject.next(finishedId);
      }
    });

    audio.addEventListener('error', () => {
      if (token !== this.loadToken) {
        return;
      }

      this.updateSnapshot({ state: 'error' });
      this.setMediaSessionPlaybackState('none');
    });

    audio.addEventListener('pause', () => {
      if (token !== this.loadToken || !this.audio || !this.audio.paused) {
        return;
      }

      if (this.snapshot.state === 'playing') {
        this.updateSnapshot({ state: 'paused' });
        this.setMediaSessionPlaybackState('paused');
      }
    });

    audio.addEventListener('play', () => {
      if (token !== this.loadToken) {
        return;
      }

      this.updateSnapshot({ state: 'playing' });
      this.setMediaSessionPlaybackState('playing');
    });
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) {
      return;
    }

    const artwork = this.mediaArtworkUrl
      ? [{ src: this.mediaArtworkUrl, sizes: '512x512', type: 'image/jpeg' }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.mediaTitle || 'قصه',
      artist: this.mediaArtist,
      album: 'کیدآموز',
      artwork,
    });

    navigator.mediaSession.setActionHandler('play', () => {
      void this.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      this.pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      this.stop();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        this.seekTo(details.seekTime);
      }
    });
  }

  private updateMediaSessionPosition(): void {
    if (!('mediaSession' in navigator) || !this.audio) {
      return;
    }

    const duration = this.audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: this.audio.playbackRate || 1,
        position: Math.min(this.audio.currentTime, duration),
      });
    } catch {
      return;
    }
  }

  private setMediaSessionPlaybackState(
    state: MediaSessionPlaybackState,
  ): void {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.playbackState = state;
  }

  private clearMediaSession(): void {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', null);
    navigator.mediaSession.setActionHandler('seekto', null);
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
