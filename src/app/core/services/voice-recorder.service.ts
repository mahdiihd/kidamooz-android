import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private startedAt = 0;
  private nativeRecording = false;

  get isRecording(): boolean {
    return this.nativeRecording || this.mediaRecorder?.state === 'recording';
  }

  async start(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.startNative();
      return;
    }

    await this.startWeb();
  }

  async stop(): Promise<{ blob: Blob; durationSeconds: number; fileName: string }> {
    if (Capacitor.isNativePlatform() && this.nativeRecording) {
      return this.stopNative();
    }

    return this.stopWeb();
  }

  cancel(): void {
    if (Capacitor.isNativePlatform() && this.nativeRecording) {
      void CapacitorAudioRecorder.cancelRecording().catch(() => undefined);
      this.nativeRecording = false;
      return;
    }

    if (!this.mediaRecorder) {
      return;
    }
    this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  private async startNative(): Promise<void> {
    const current = await CapacitorAudioRecorder.checkPermissions();
    let status = current.recordAudio;
    if (status !== 'granted') {
      const requested = await CapacitorAudioRecorder.requestPermissions();
      status = requested.recordAudio;
    }
    if (status !== 'granted') {
      throw new Error('MIC_DENIED');
    }

    await CapacitorAudioRecorder.startRecording();
    this.nativeRecording = true;
    this.startedAt = Date.now();
  }

  private async stopNative(): Promise<{
    blob: Blob;
    durationSeconds: number;
    fileName: string;
  }> {
    const result = await CapacitorAudioRecorder.stopRecording();
    this.nativeRecording = false;

    const durationSeconds = Math.max(
      1,
      Math.round((result.duration || Date.now() - this.startedAt) / 1000)
    );

    let blob: Blob;
    if (result.blob) {
      blob = result.blob;
    } else if (result.uri) {
      blob = await this.uriToBlob(result.uri);
    } else {
      throw new Error('RECORDER_EMPTY');
    }

    const fileName = this.fileNameFromUri(result.uri, blob.type);
    return { blob, durationSeconds, fileName };
  }

  private async startWeb(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('MIC_UNSUPPORTED');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = this.pickMimeType();
    this.chunks = [];
    this.mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
    this.startedAt = Date.now();
    this.mediaRecorder.start();
  }

  private async stopWeb(): Promise<{
    blob: Blob;
    durationSeconds: number;
    fileName: string;
  }> {
    const recorder = this.mediaRecorder;
    if (!recorder) {
      throw new Error('RECORDER_IDLE');
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error('RECORDER_ERROR'));
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        resolve(new Blob(this.chunks, { type }));
        recorder.stream.getTracks().forEach((t) => t.stop());
      };
      recorder.stop();
    });

    this.mediaRecorder = null;
    const fileName = this.fileNameFromUri(undefined, blob.type);
    return { blob, durationSeconds, fileName };
  }

  private async uriToBlob(uri: string): Promise<Blob> {
    const candidates = [uri, Capacitor.convertFileSrc(uri)];
    for (const src of candidates) {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          continue;
        }
        const blob = await response.blob();
        if (blob.size > 0) {
          return blob;
        }
      } catch {
        continue;
      }
    }
    throw new Error('RECORDER_READ_FAILED');
  }

  private fileNameFromUri(uri: string | undefined, mimeType: string): string {
    const fromUri = uri?.split('?')[0]?.split('/').pop();
    if (fromUri && /\.(m4a|mp4|aac|wav|ogg|webm|3gp)$/i.test(fromUri)) {
      return fromUri;
    }
    if (mimeType.includes('mp4') || mimeType.includes('aac') || mimeType.includes('m4a')) {
      return 'narration.m4a';
    }
    if (mimeType.includes('ogg')) {
      return 'narration.ogg';
    }
    if (mimeType.includes('wav')) {
      return 'narration.wav';
    }
    return 'narration.webm';
  }

  private pickMimeType(): string | undefined {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
  }
}
