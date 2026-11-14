import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRANSLATIONS,
  buildBoqReportText,
  formatCurrencyLocale,
  formatDistanceLocale,
  formatDurationLocale,
  getInitialLang,
  getLangDir,
  getUnitDisplay,
  persistLang,
  type AppLang,
} from './translations';
import type { SavedBoqItem } from '../types/boq';

function collectNonEmptyLeaves(obj: unknown, path = ''): string[] {
  const errors: string[] = [];
  if (typeof obj === 'string') {
    if (obj.trim().length === 0) errors.push(`Empty string at ${path}`);
    return errors;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) errors.push(`Empty array at ${path}`);
    obj.forEach((item, idx) => {
      errors.push(...collectNonEmptyLeaves(item, `${path}[${idx}]`));
    });
    return errors;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      errors.push(...collectNonEmptyLeaves(v, path ? `${path}.${k}` : k));
    }
  }
  return errors;
}

test('getLangDir maps ar to rtl and fr/en to ltr', () => {
  assert.equal(getLangDir('ar'), 'rtl');
  assert.equal(getLangDir('fr'), 'ltr');
  assert.equal(getLangDir('en'), 'ltr');
});

test('getInitialLang and persistLang fall back to ar and persist valid choices', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(getInitialLang(mockStorage), 'ar');
  persistLang('fr', mockStorage);
  assert.equal(getInitialLang(mockStorage), 'fr');
  persistLang('en', mockStorage);
  assert.equal(getInitialLang(mockStorage), 'en');
  store.set('dz_civil_lang', 'invalid');
  assert.equal(getInitialLang(mockStorage), 'ar');
});

test('all three language dictionaries have identical structure and non-empty strings', () => {
  const langs: AppLang[] = ['ar', 'fr', 'en'];
  for (const lang of langs) {
    const errs = collectNonEmptyLeaves(TRANSLATIONS[lang], lang);
    assert.deepEqual(errs, [], `Found empty translation entries in ${lang}`);
  }
  assert.equal(TRANSLATIONS.fr.calcTabs.concrete, 'Béton Armé');
  assert.equal(TRANSLATIONS.fr.calcTabs.rebar, 'Ferraillage');
  assert.equal(TRANSLATIONS.fr.boq.headingParen, '(Métré & Devis)');
  assert.equal(TRANSLATIONS.en.calcTabs.concrete, 'Reinforced Concrete');
  assert.equal(TRANSLATIONS.en.calcTabs.rebar, 'Rebar Steel');
});

test('localized formatters render currency, distance, duration, and units accurately', () => {
  assert.equal(formatCurrencyLocale(12500, 'ar'), '12,500 دج');
  assert.equal(formatCurrencyLocale(12500, 'fr'), '12,500 DA');
  assert.equal(formatCurrencyLocale(12500, 'en'), '12,500 DZD');

  assert.equal(formatDistanceLocale(0.45, 'ar'), '450 م');
  assert.equal(formatDistanceLocale(0.45, 'fr'), '450 m');
  assert.equal(formatDistanceLocale(12.34, 'en'), '12.3 km');

  assert.equal(formatDurationLocale(75, 'ar'), '1 س 15 د');
  assert.equal(formatDurationLocale(75, 'fr'), '1 h 15 min');
  assert.equal(formatDurationLocale(45, 'en'), '45 min');

  assert.equal(getUnitDisplay('ar', 'm3').symbol, 'م³');
  assert.equal(getUnitDisplay('fr', 'm3').symbol, 'm³');
  assert.equal(getUnitDisplay('en', 't').name, 'Metric ton');
});

test('buildBoqReportText produces localized reports matching active language', () => {
  const sample: SavedBoqItem[] = [
    {
      id: 'item-1',
      category: 'concrete',
      categoryLabel: 'Béton Armé',
      title: 'Dalle 10x5m',
      summary: '10.5 m³',
      metrics: [{ label: 'Volume', value: '10.5 m³' }],
      estimatedCostDzd: 140000,
      createdAtIso: '2026-01-01T00:00:00.000Z',
    },
  ];

  const arReport = buildBoqReportText(sample, 'ar');
  assert.ok(arReport.includes('كشف المقايسة والكميات الميداني'));
  assert.ok(arReport.includes('140,000 دج'));

  const frReport = buildBoqReportText(sample, 'fr');
  assert.ok(frReport.includes('Métré & Devis Estimatif de Chantier'));
  assert.ok(frReport.includes('140,000 DA'));

  const enReport = buildBoqReportText(sample, 'en');
  assert.ok(enReport.includes('Field Quantity Takeoff & Cost Estimate'));
  assert.ok(enReport.includes('140,000 DZD'));
});
