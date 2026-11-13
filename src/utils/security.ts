import type { BoqCategory, SavedBoqItem } from '../types/boq';

const VALID_CATEGORIES = new Set<BoqCategory>(['concrete', 'rebar', 'masonry', 'roads']);

/**
 * Prevents CSV / Spreadsheet Formula Injection (CWE-1236) by neutralizing
 * cells starting with =, +, -, @, tab, or carriage return.
 */
export function sanitizeCsvCell(raw: string): string {
  const str = String(raw ?? '');
  const trimmedLeading = str.replace(/^[\s\uFEFF\xA0]+/, '');
  const needsPrefix = /^[=+\-@\t\r]/.test(str) || /^[=+\-@\t\r]/.test(trimmedLeading);
  const safe = needsPrefix ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Runtime schema validator for persisted BoQ items loaded from localStorage.
 * Prevents malformed or corrupted storage payloads from crashing React rendering.
 */
export function parseStoredBoqItems(rawJson: string | null): SavedBoqItem[] {
  if (!rawJson) return [];
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    const validItems: SavedBoqItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const obj = entry as Record<string, unknown>;

      if (
        typeof obj.id !== 'string' ||
        typeof obj.category !== 'string' ||
        !VALID_CATEGORIES.has(obj.category as BoqCategory) ||
        typeof obj.categoryLabel !== 'string' ||
        typeof obj.title !== 'string' ||
        typeof obj.summary !== 'string' ||
        !Array.isArray(obj.metrics)
      ) {
        continue;
      }

      const safeMetrics: { label: string; value: string }[] = [];
      for (const m of obj.metrics) {
        if (
          m &&
          typeof m === 'object' &&
          typeof (m as Record<string, unknown>).label === 'string' &&
          typeof (m as Record<string, unknown>).value === 'string'
        ) {
          safeMetrics.push({
            label: String((m as Record<string, unknown>).label).slice(0, 120),
            value: String((m as Record<string, unknown>).value).slice(0, 120),
          });
        }
      }

      const cost =
        typeof obj.estimatedCostDzd === 'number' && Number.isFinite(obj.estimatedCostDzd) && obj.estimatedCostDzd >= 0
          ? obj.estimatedCostDzd
          : undefined;

      validItems.push({
        id: obj.id.slice(0, 100),
        category: obj.category as BoqCategory,
        categoryLabel: obj.categoryLabel.slice(0, 80),
        title: obj.title.slice(0, 160),
        summary: obj.summary.slice(0, 240),
        metrics: safeMetrics,
        estimatedCostDzd: cost,
        createdAtIso: typeof obj.createdAtIso === 'string' ? obj.createdAtIso : new Date().toISOString(),
      });

      if (validItems.length >= 250) break;
    }

    return validItems;
  } catch {
    return [];
  }
}

export function sanitizeFiniteNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  let result = num;
  if (typeof min === 'number') result = Math.max(min, result);
  if (typeof max === 'number') result = Math.min(max, result);
  return result;
}

export async function copyTextSafely(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  return false;
}
