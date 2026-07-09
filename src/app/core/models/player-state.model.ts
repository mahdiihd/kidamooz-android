export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface PlayerSnapshot {
  storyId: string | null;
  currentTime: number;
  duration: number;
  state: PlayerState;
}
