export const CACHE_POLICY = {
  catalogStorageKey: 'kidamooz.catalog.v2',
  maxCatalogBytes: 1_048_576,
  catalogTtlMs: 6 * 60 * 60 * 1000,
  offlineAudioQuotaBytes: 200 * 1024 * 1024,
} as const;

export const MEDIA_CACHE_POLICY = {
  autoDownloadAudio: false,
  autoDownloadImages: false,
  offlineQuotaBytes: CACHE_POLICY.offlineAudioQuotaBytes,
} as const;
