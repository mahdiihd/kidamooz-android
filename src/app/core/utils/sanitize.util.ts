const TAG_PATTERN = /<[^>]*>/g;
const DANGEROUS_BLOCKS =
  /<(script|style|iframe|object|embed|link|meta|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>|<(script|style|iframe|object|embed|link|meta|svg|math|img|video|audio|source|base)\b[^>]*\/?>/gi;
const DANGEROUS_PROTOCOL = /\b(?:javascript|vbscript|data)\s*:/gi;
const EVENT_HANDLER = /\bon[a-z]+\s*=/gi;

export function sanitizePlainText(value: string | null | undefined, maxLength = 8000): string {
  if (!value) {
    return '';
  }

  const decoded = decodeHtmlEntities(value.replace(/\0/g, ''));
  const withoutTags = decoded
    .replace(DANGEROUS_BLOCKS, '')
    .replace(TAG_PATTERN, '')
    .replace(DANGEROUS_PROTOCOL, '')
    .replace(EVENT_HANDLER, '');

  const normalized = withoutTags
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

export function sanitizeMediaUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const url = value.trim();
  if (!url || url.includes('<') || url.includes('\0')) {
    return null;
  }

  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}
