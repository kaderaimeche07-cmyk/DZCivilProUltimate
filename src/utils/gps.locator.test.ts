import test from 'node:test';
import assert from 'node:assert/strict';
import { ALGERIAN_WILAYAT } from '../data/wilayat';
import { ALGERIAN_QUARRIES } from '../data/quarries';
import {
  calculateHaversineKm,
  attachDistancesAndSort,
  formatDistanceKm,
  formatDurationAr,
  estimateHaulageMinutes,
  saveCachedOriginCoords,
  loadCachedOriginCoords,
  GPS_ORIGIN_CACHE_TTL_MS,
  type MinimalStorageLike,
} from './gps.locator';

test('All 58 Algerian Wilayas are present with unique codes 01..58', () => {
  assert.equal(ALGERIAN_WILAYAT.length, 58);
  const codes = new Set(ALGERIAN_WILAYAT.map((w) => w.code));
  assert.equal(codes.size, 58);
  assert.equal(ALGERIAN_WILAYAT[0].code, '01');
  assert.equal(ALGERIAN_WILAYAT[57].code, '58');
});

test('Haversine distance between Algiers and Oran is realistic (~350-365 km)', () => {
  const algiers = { lat: 36.7538, lng: 3.0588 };
  const oran = { lat: 35.6969, lng: -0.6331 };
  const km = calculateHaversineKm(algiers.lat, algiers.lng, oran.lat, oran.lng);
  assert.ok(km > 340 && km < 370, `Expected ~350km, got ${km}`);
});

test('Quarry sorting puts closest quarry to Algiers first', () => {
  const algiers = { lat: 36.7538, lng: 3.0588 };
  const sorted = attachDistancesAndSort(ALGERIAN_QUARRIES, algiers);
  assert.ok(sorted.length === ALGERIAN_QUARRIES.length);
  assert.ok(sorted[0].distanceKm <= sorted[1].distanceKm);
  assert.ok(sorted[0].distanceKm < 45, `Nearest quarry to Algiers should be < 45km, got ${sorted[0].distanceKm}`);
});

test('formatDistanceKm formats sub-kilometer values in meters', () => {
  assert.equal(formatDistanceKm(0.45), '450 م');
  assert.equal(formatDistanceKm(12.34), '12.3 كم');
});

test('GPS helpers handle antipodal coordinates and non-finite inputs safely', () => {
  const antipodal = calculateHaversineKm(0, 0, 0, 180);
  assert.equal(Number.isFinite(antipodal), true);
  assert.ok(antipodal > 20000);

  assert.equal(calculateHaversineKm(Number.NaN, 3, 36, 3), 0);
  assert.equal(estimateHaulageMinutes(Number.NaN), 0);
  assert.equal(formatDistanceKm(Number.NaN), '—');
  assert.equal(formatDurationAr(Number.NaN), '—');
});

test('Local coordinate cache stores, restores, and expires GPS entries safely', () => {
  const mem = new Map<string, string>();
  const mockStorage: MinimalStorageLike = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => {
      mem.set(k, v);
    },
  };

  const t0 = 1_700_000_000_000;
  const saved = saveCachedOriginCoords(
    { lat: 36.7538, lng: 3.0588, accuracyMeters: 18, source: 'gps', label: 'موقعي الحالي (GPS)' },
    mockStorage,
    t0
  );
  assert.equal(saved, true);

  const restoredFresh = loadCachedOriginCoords(mockStorage, t0 + 5 * 60 * 1000);
  assert.ok(restoredFresh);
  assert.equal(restoredFresh.lat, 36.7538);
  assert.equal(restoredFresh.source, 'gps');

  const expired = loadCachedOriginCoords(mockStorage, t0 + GPS_ORIGIN_CACHE_TTL_MS + 1000);
  assert.equal(expired, null);

  // Corrupt JSON safety check
  mem.set('dz_civil_origin_cache_v1', '{bad_json');
  assert.equal(loadCachedOriginCoords(mockStorage, t0), null);
});

