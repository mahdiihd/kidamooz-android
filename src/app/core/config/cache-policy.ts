export const CACHE_POLICY = {
  catalogStorageKey: 'kidamooz.catalog.v2',
  engagementSurfaceStorageKey: 'kidamooz.engagement-surface.v1',
  maxCatalogBytes: 512 * 1024,
  catalogTtlMs: 6 * 60 * 60 * 1000,
  offlineAudioQuotaBytes: 80 * 1024 * 1024,
  engagementSurfaceTtlMs: 6 * 60 * 60 * 1000,
} as const;

export const MEDIA_CACHE_POLICY = {
  autoDownloadAudio: false,
  autoDownloadImages: false,
  offlineQuotaBytes: CACHE_POLICY.offlineAudioQuotaBytes,
  audioIndexKey: 'kidamooz.audio-cache.v1',
  audioDirectory: 'audio',
} as const;
