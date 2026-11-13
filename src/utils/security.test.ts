import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCsvCell, parseStoredBoqItems, sanitizeFiniteNumber } from './security';

test('sanitizeCsvCell neutralizes spreadsheet formula injection prefixes (=, +, -, @, tab)', () => {
  assert.equal(sanitizeCsvCell('=cmd|"/C calc"!A0'), '"\'=cmd|""/C calc""!A0"');
  assert.equal(sanitizeCsvCell('+SUM(A1:A2)'), '"\'+SUM(A1:A2)"');
  assert.equal(sanitizeCsvCell('-100'), '"\'-100"');
  assert.equal(sanitizeCsvCell('@HYPERLINK("http://evil")'), '"\'@HYPERLINK(""http://evil"")"');
  assert.equal(sanitizeCsvCell('بلاطة أرضية'), '"بلاطة أرضية"');
});

test('parseStoredBoqItems safely rejects corrupted JSON and malformed entries without throwing', () => {
  assert.deepEqual(parseStoredBoqItems(null), []);
  assert.deepEqual(parseStoredBoqItems('{not-json'), []);
  assert.deepEqual(parseStoredBoqItems('{"not":"an-array"}'), []);

  const mixedPayload = JSON.stringify([
    { id: 'bad-1', title: 'Missing metrics' },
    { id: 'bad-2', category: 'unknown_cat', categoryLabel: 'X', title: 'Y', summary: 'Z', metrics: [] },
    {
      id: 'ok-1',
      category: 'concrete',
      categoryLabel: 'الخرسانة',
      title: 'أساس منفرد',
      summary: '1.5م × 1.5م',
      metrics: [{ label: 'الحجم', value: '0.9 م³' }, { broken: true }],
      estimatedCostDzd: 12500,
      createdAtIso: '2026-11-13T00:00:00.000Z',
    },
  ]);

  const parsed = parseStoredBoqItems(mixedPayload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'ok-1');
  assert.equal(parsed[0].metrics.length, 1);
  assert.equal(parsed[0].estimatedCostDzd, 12500);
});

test('sanitizeFiniteNumber handles NaN and Infinity cleanly with bounds', () => {
  assert.equal(sanitizeFiniteNumber(Number.NaN, 5, 0, 30), 5);
  assert.equal(sanitizeFiniteNumber(Number.POSITIVE_INFINITY, 1.2, 1, 1.6), 1.2);
  assert.equal(sanitizeFiniteNumber(50, 5, 0, 30), 30);
  assert.equal(sanitizeFiniteNumber(-4, 5, 0, 30), 0);
});
