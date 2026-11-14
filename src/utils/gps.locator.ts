import type { Quarry } from '../data/quarries';

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  source: 'gps' | 'wilaya';
  label: string;
}

export interface QuarryWithDistance extends Quarry {
  distanceKm: number;
  estimatedMinutes: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Exact Haversine mathematical formula returning great-circle distance in kilometers.
 */
export function calculateHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return 0;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Estimates heavy-truck haulage travel duration using road tortuosity factor (1.28x)
 * and average 55 km/h construction truck speed.
 */
export function estimateHaulageMinutes(straightLineKm: number): number {
  if (!Number.isFinite(straightLineKm) || straightLineKm <= 0) return 0;
  const roadKm = straightLineKm * 1.28;
  return Math.max(2, Math.round((roadKm / 55) * 60));
}

export function attachDistancesAndSort(
  quarries: Quarry[],
  origin: { lat: number; lng: number }
): QuarryWithDistance[] {
  return quarries
    .map((quarry) => {
      const distanceKm = calculateHaversineKm(origin.lat, origin.lng, quarry.lat, quarry.lng);
      return {
        ...quarry,
        distanceKm,
        estimatedMinutes: estimateHaulageMinutes(distanceKm),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';
  if (km < 1) {
    return `${Math.round(km * 1000)} م`;
  }
  return `${km.toFixed(1)} كم`;
}

export function formatDurationAr(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded} د`;
  }
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} س`;
}

export interface GpsResult {
  ok: true;
  coords: GeoCoordinates;
}

export interface GpsError {
  ok: false;
  message: string;
  code: 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export function requestCurrentGpsPosition(timeoutMs = 12000): Promise<GpsResult | GpsError> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        ok: false,
        code: 'UNSUPPORTED',
        message: 'المتصفح الحالي لا يدعم خدمة تحديد الموقع الجغرافي (GPS).',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          coords: {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            accuracyMeters: Math.round(position.coords.accuracy),
            source: 'gps',
            label: 'موقعي الحالي (GPS)',
          },
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            resolve({
              ok: false,
              code: 'PERMISSION_DENIED',
              message: 'تم رفض إذن الوصول إلى الموقع. يرجى تفعيل صلاحية الموقع من إعدادات المتصفح أو اختيار الولاية يدوياً.',
            });
            break;
          case err.POSITION_UNAVAILABLE:
            resolve({
              ok: false,
              code: 'POSITION_UNAVAILABLE',
              message: 'إشارة GPS غير متاحة حالياً في هذا الموقع. يمكنك الاعتماد على مركز الولاية المختارة.',
            });
            break;
          case err.TIMEOUT:
            resolve({
              ok: false,
              code: 'TIMEOUT',
              message: 'انتهت مهلة التقاط إشارة GPS. يرجى إعادة المحاولة في مكان مفتوح.',
            });
            break;
          default:
            resolve({
              ok: false,
              code: 'UNKNOWN',
              message: 'تعذر تحديد الموقع الجغرافي بدقة. جرب تحديد الولاية من القائمة.',
            });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 30000,
      }
    );
  });
}

export const ORIGIN_CACHE_STORAGE_KEY = 'dz_civil_origin_cache_v1';
export const GPS_ORIGIN_CACHE_TTL_MS = 30 * 60 * 1000;

export interface MinimalStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

interface CachedOriginRecord {
  coords: GeoCoordinates;
  cachedAtMs: number;
}

function getSafeStorage(storage?: MinimalStorageLike | null): MinimalStorageLike | null {
  if (storage) return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export function saveCachedOriginCoords(
  coords: GeoCoordinates,
  storage?: MinimalStorageLike | null,
  nowMs = Date.now()
): boolean {
  const store = getSafeStorage(storage);
  if (!store) return false;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return false;

  try {
    const record: CachedOriginRecord = {
      coords: {
        lat: Number(coords.lat.toFixed(6)),
        lng: Number(coords.lng.toFixed(6)),
        accuracyMeters: coords.accuracyMeters,
        source: coords.source,
        label: String(coords.label || '').slice(0, 120),
      },
      cachedAtMs: nowMs,
    };
    store.setItem(ORIGIN_CACHE_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function loadCachedOriginCoords(
  storage?: MinimalStorageLike | null,
  nowMs = Date.now(),
  gpsTtlMs = GPS_ORIGIN_CACHE_TTL_MS
): GeoCoordinates | null {
  const store = getSafeStorage(storage);
  if (!store) return null;

  try {
    const raw = store.getItem(ORIGIN_CACHE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedOriginRecord>;
    if (!parsed?.coords || typeof parsed.cachedAtMs !== 'number') return null;

    const { lat, lng, source, label, accuracyMeters } = parsed.coords;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (source !== 'gps' && source !== 'wilaya') ||
      typeof label !== 'string'
    ) {
      return null;
    }

    if (source === 'gps' && nowMs - parsed.cachedAtMs > gpsTtlMs) {
      return null;
    }

    return {
      lat,
      lng,
      source,
      label,
      accuracyMeters: typeof accuracyMeters === 'number' && Number.isFinite(accuracyMeters) ? accuracyMeters : undefined,
    };
  } catch {
    return null;
  }
}

