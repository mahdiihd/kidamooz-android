import { Injectable, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AudioPlayerService } from './audio-player.service';

@Injectable({ providedIn: 'root' })
export class AppLifecycleService {
  private readonly audioPlayer = inject(AudioPlayerService);
  private initialized = false;

  initialize(): void {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    this.initialized = true;

    void App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && this.audioPlayer.snapshot.state === 'playing') {
        this.audioPlayer.pause();
      }
    });
  }
}
