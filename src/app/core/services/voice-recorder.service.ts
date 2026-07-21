import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private startedAt = 0;

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  async start(): Promise<void> {
    if (this.isRecording) {
      return;
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

  async stop(): Promise<{ blob: Blob; durationSeconds: number; fileName: string }> {
    const recorder = this.mediaRecorder;
    if (!recorder) {
      throw new Error('ضبط شروع نشده است');
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error('خطا در ضبط صدا'));
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        resolve(new Blob(this.chunks, { type }));
        recorder.stream.getTracks().forEach((t) => t.stop());
      };
      recorder.stop();
    });

    this.mediaRecorder = null;
    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
    return { blob, durationSeconds, fileName: `narration.${ext}` };
  }

  cancel(): void {
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

  private pickMimeType(): string | undefined {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
  }
}
