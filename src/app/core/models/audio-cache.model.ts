export interface AudioCacheEntry {
  storyId: string;
  remoteUrl: string;
  path: string;
  sizeBytes: number;
  lastPlayedAt: number;
}

export interface AudioCacheIndex {
  entries: AudioCacheEntry[];
}
