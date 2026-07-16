export const PROGRESS_ICON_KEYS = [
  'star',
  'boy',
  'forest',
  'magic',
  'panda',
  'rabbit',
  'rocket',
  'wolf',
  'parry',
] as const;

export type ProgressIconKey = (typeof PROGRESS_ICON_KEYS)[number];

export const DEFAULT_PROGRESS_ICON: ProgressIconKey = 'star';

export interface ProgressIconTheme {
  key: ProgressIconKey;
  fill: string;
  fillSoft: string;
  fillDeep: string;
}

const PROGRESS_ICON_THEMES: Record<ProgressIconKey, Omit<ProgressIconTheme, 'key'>> = {
  star: { fill: '#ffc94a', fillSoft: '#ffe08a', fillDeep: '#e89a2d' },
  boy: { fill: '#5eb8f0', fillSoft: '#9ad4f7', fillDeep: '#2f8fd0' },
  forest: { fill: '#4caf7a', fillSoft: '#8fd4a8', fillDeep: '#2e8b57' },
  magic: { fill: '#c77dff', fillSoft: '#e0b3ff', fillDeep: '#9b4dca' },
  panda: { fill: '#9b6bff', fillSoft: '#c4a6ff', fillDeep: '#6f3fd0' },
  rabbit: { fill: '#f5a9c5', fillSoft: '#ffd0e0', fillDeep: '#e0789e' },
  rocket: { fill: '#5ec8e8', fillSoft: '#9adeef', fillDeep: '#1a6fa0' },
  wolf: { fill: '#f0a04b', fillSoft: '#ffc888', fillDeep: '#d4782a' },
  parry: { fill: '#e891c5', fillSoft: '#f5b8dc', fillDeep: '#c45a9e' },
};

export function normalizeProgressIconKey(key: string | null | undefined): ProgressIconKey {
  const normalized = (key ?? '').trim().toLowerCase();
  return PROGRESS_ICON_KEYS.includes(normalized as ProgressIconKey)
    ? (normalized as ProgressIconKey)
    : DEFAULT_PROGRESS_ICON;
}

export function resolveProgressIconAsset(key: string | null | undefined): string {
  return `assets/images/progress-${normalizeProgressIconKey(key)}.png`;
}

export function resolveProgressIconTheme(key: string | null | undefined): ProgressIconTheme {
  const normalized = normalizeProgressIconKey(key);
  return { key: normalized, ...PROGRESS_ICON_THEMES[normalized] };
}

export function extractProgressIconKeyFromUrl(url: string | null | undefined): string {
  const match = (url ?? '').match(/progress-([a-z]+)\.png/i);
  return match?.[1] ?? DEFAULT_PROGRESS_ICON;
}
