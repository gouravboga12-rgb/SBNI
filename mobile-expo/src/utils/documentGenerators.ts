// ============================================================
// JustPaisa — Mobile URL & Document Resolution Utility
// ============================================================

export const PRODUCTION_WEB_ORIGIN = 'https://justpaisa.in';

/**
 * Resolves relative /uploads/... or relative photo URLs to absolute accessible URLs.
 * In React Native, Image components require absolute http(s):// or file:// or data: URIs.
 */
export function resolveDocumentUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${PRODUCTION_WEB_ORIGIN}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${PRODUCTION_WEB_ORIGIN}/${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${PRODUCTION_WEB_ORIGIN}${trimmed}`;
  }

  return `${PRODUCTION_WEB_ORIGIN}/${trimmed}`;
}

export function isPdfDocument(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('.pdf') || lower.startsWith('data:application/pdf');
}
