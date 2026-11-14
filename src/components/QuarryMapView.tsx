import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Map as LucideMap, WifiOff, Globe } from 'lucide-react';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { findWilayaByCode } from '../data/wilayat';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { AlgeriaOfflineSvgMap } from './AlgeriaOfflineSvgMap';
import { GoogleQuarryMap } from './GoogleQuarryMap';
import { useI18n } from '../i18n/I18nContext';
import {
  formatDistanceLocale,
  formatDurationLocale,
  getLangDir,
  getQuarryCategoryLabel,
  type AppLang,
  type TranslationDict,
} from '../i18n/translations';

interface QuarryMapViewProps {
  quarries: QuarryWithDistance[];
  origin: GeoCoordinates;
  selectedQuarryId: string | null;
  onSelectQuarry: (quarryId: string) => void;
  focusCoords?: { lat: number; lng: number; zoom?: number } | null;
}

function createQuarryMarkerIcon(isSelected: boolean): L.DivIcon {
  const fill = isSelected ? '#f59e0b' : '#84cc16';
  const stroke = isSelected ? '#ffffff' : '#0b110d';
  const size = isSelected ? 34 : 26;

  return L.divIcon({
    className: 'dz-quarry-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="13" fill="${fill}" fill-opacity="0.22" />
        <circle cx="16" cy="16" r="7.5" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
      </svg>
    `,
  });
}

function createOriginMarkerIcon(isGps: boolean): L.DivIcon {
  const color = isGps ? '#a3e635' : '#f59e0b';
  return L.divIcon({
    className: 'dz-origin-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    html: `
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="17" r="14" stroke="${color}" stroke-width="2" stroke-dasharray="4 3" />
        <circle cx="17" cy="17" r="6" fill="${color}" stroke="#0b110d" stroke-width="2.5" />
      </svg>
    `,
  });
}

function createOriginPopupElement(origin: GeoCoordinates): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-1 text-xs';

  const titleEl = document.createElement('div');
  titleEl.className = 'font-bold text-[#a3e635]';
  titleEl.textContent = origin.label;

  const coordsEl = document.createElement('div');
  coordsEl.className = 'font-mono text-slate-300';
  coordsEl.dir = 'ltr';
  coordsEl.innerHTML = `<bdi dir="ltr">${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}</bdi>`;

  wrapper.append(titleEl, coordsEl);
  return wrapper;
}

function createQuarryPopupElement(
  quarry: QuarryWithDistance,
  lang: AppLang,
  quarryT: TranslationDict['quarries']
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'min-w-[220px] space-y-2 text-xs text-start';
  wrapper.dir = getLangDir(lang);

  const wilayaObj = findWilayaByCode(quarry.wilayaCode);
  const wilayaDisplayName =
    lang === 'ar' ? quarry.wilayaName : (wilayaObj?.frName ?? quarry.wilayaName);

  const nameEl = document.createElement('div');
  nameEl.className = 'font-bold text-sm text-white';
  nameEl.textContent = quarry.name;

  const locEl = document.createElement('div');
  locEl.className = 'text-slate-300';
  locEl.innerHTML = `<bdi dir="ltr">${quarry.wilayaCode}</bdi> ${wilayaDisplayName} · ${quarry.municipality}`;

  const catEl = document.createElement('div');
  catEl.className = 'text-[#fbbf24] font-semibold';
  catEl.textContent = getQuarryCategoryLabel(quarry.category, lang);

  const matsEl = document.createElement('div');
  matsEl.className = 'text-slate-400';
  matsEl.textContent = quarry.materials.slice(0, 4).join(' · ');

  const footerEl = document.createElement('div');
  footerEl.className = 'pt-2 mt-2 border-t border-white/10 flex items-center justify-between gap-3';

  const distEl = document.createElement('span');
  distEl.className = 'text-[#a3e635] font-bold font-mono';
  distEl.innerHTML = `<bdi dir="ltr">${formatDistanceLocale(quarry.distanceKm, lang)}</bdi>`;

  const etaEl = document.createElement('span');
  etaEl.className = 'text-slate-400';
  etaEl.textContent = `~ ${formatDurationLocale(quarry.estimatedMinutes, lang)}`;

  footerEl.append(distEl, etaEl);

  const mapsActionEl = document.createElement('div');
  mapsActionEl.className = 'pt-1.5';
  const mapsLink = document.createElement('a');
  mapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${quarry.lat},${quarry.lng}`;
  mapsLink.target = '_blank';
  mapsLink.rel = 'noopener noreferrer';
  mapsLink.className =
    'w-full text-center block rounded-[8px] bg-[#f59e0b] hover:bg-[#fbbf24] text-[#080c0a] font-bold py-1.5 px-3 text-[11px] no-underline transition-colors';
  mapsLink.textContent = quarryT.openGoogleMaps;
  mapsActionEl.append(mapsLink);

  wrapper.append(nameEl, locEl, catEl, matsEl, footerEl, mapsActionEl);
  return wrapper;
}

export const QuarryMapView: React.FC<QuarryMapViewProps> = ({
  quarries,
  origin,
  selectedQuarryId,
  onSelectQuarry,
  focusCoords,
}) => {
  const { lang, t } = useI18n();
  const isOnline = useOnlineStatus();
  const hasGoogleKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const [mapMode, setMapMode] = useState<'google' | 'tiles' | 'svg'>(() => {
    if (!isOnline) return 'svg';
    return hasGoogleKey ? 'google' : 'tiles';
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelectQuarry);
  onSelectRef.current = onSelectQuarry;

  // Sync mode automatically if user goes offline or Google Maps hits quota limit
  useEffect(() => {
    if (!isOnline && mapMode !== 'svg') {
      setMapMode('svg');
    }
  }, [isOnline, mapMode]);

  useEffect(() => {
    const onQuotaExceeded = () => {
      setMapMode((prev) => (prev === 'google' ? (isOnline ? 'tiles' : 'svg') : prev));
    };
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, [isOnline]);

  useEffect(() => {
    if (mapMode !== 'tiles') return;
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const initLat = Number.isFinite(origin.lat) ? origin.lat : 36.7538;
    const initLng = Number.isFinite(origin.lng) ? origin.lng : 3.0588;

    const map = L.map(el, {
      center: [initLat, initLng],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            map.invalidateSize({ animate: false });
          })
        : null;
    resizeObserver?.observe(el);

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLineRef.current = null;
      markerByIdRef.current.clear();
    };
  }, [mapMode]);

  useEffect(() => {
    if (mapMode !== 'tiles') return;
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerByIdRef.current.clear();

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
      const originMarker = L.marker([origin.lat, origin.lng], {
        icon: createOriginMarkerIcon(origin.source === 'gps'),
        zIndexOffset: 500,
      });
      originMarker.bindPopup(createOriginPopupElement(origin));
      originMarker.addTo(layer);
    }

    let selectedQuarry: QuarryWithDistance | undefined;
    for (const q of quarries) {
      if (!Number.isFinite(q.lat) || !Number.isFinite(q.lng)) continue;
      const isSelected = q.id === selectedQuarryId;
      if (isSelected) selectedQuarry = q;

      const marker = L.marker([q.lat, q.lng], {
        icon: createQuarryMarkerIcon(isSelected),
        zIndexOffset: isSelected ? 400 : 100,
      });

      marker.bindPopup(createQuarryPopupElement(q, lang, t.quarries), {
        maxWidth: 250,
        autoPan: true,
        autoPanPaddingTopLeft: L.point(16, 24),
        autoPanPaddingBottomRight: L.point(16, 52),
      });

      marker.on('click', () => {
        onSelectRef.current(q.id);
      });

      marker.addTo(layer);
      markerByIdRef.current.set(q.id, marker);
    }

    if (selectedQuarry && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
      routeLineRef.current = L.polyline(
        [
          [origin.lat, origin.lng],
          [selectedQuarry.lat, selectedQuarry.lng],
        ],
        {
          color: '#f59e0b',
          weight: 2.5,
          dashArray: '6 6',
          opacity: 0.85,
        }
      ).addTo(map);
    }
  }, [quarries, origin, selectedQuarryId, mapMode, lang, t.quarries]);

  useEffect(() => {
    if (mapMode !== 'tiles') return;
    const map = mapRef.current;
    if (!map || !focusCoords || !Number.isFinite(focusCoords.lat) || !Number.isFinite(focusCoords.lng)) return;

    map.flyTo([focusCoords.lat, focusCoords.lng], focusCoords.zoom ?? 9, {
      duration: 0.35,
    });
  }, [focusCoords, mapMode]);

  useEffect(() => {
    if (mapMode !== 'tiles') return;
    const map = mapRef.current;
    if (!map || !selectedQuarryId) return;
    const marker = markerByIdRef.current.get(selectedQuarryId);
    if (!marker) return;

    const timer = window.setTimeout(() => {
      if (mapRef.current && markerByIdRef.current.get(selectedQuarryId)) {
        marker.openPopup();
      }
    }, 380);

    return () => window.clearTimeout(timer);
  }, [selectedQuarryId, mapMode]);

  return (
    <div className="space-y-2">
      {/* Mode Switcher: Google Maps vs Leaflet Tiles vs Local Offline SVG */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
        <div className="flex items-center gap-1 rounded-[12px] bg-[#070b09] p-1 border border-white/[0.08] flex-wrap">
          <button
            type="button"
            onClick={() => setMapMode('google')}
            disabled={!isOnline}
            className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              mapMode === 'google'
                ? 'bg-[#84cc16] text-[#060a05]'
                : 'text-[#b7c9bc] hover:text-[#f4f7f2] disabled:opacity-35'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{t.quarries.mapModes.google}</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode('tiles')}
            disabled={!isOnline}
            className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              mapMode === 'tiles'
                ? 'bg-[#84cc16] text-[#060a05]'
                : 'text-[#b7c9bc] hover:text-[#f4f7f2] disabled:opacity-35'
            }`}
          >
            <LucideMap className="h-3.5 w-3.5" />
            <span>{t.quarries.mapModes.osm}</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode('svg')}
            className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              mapMode === 'svg'
                ? 'bg-[#84cc16] text-[#060a05]'
                : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t.quarries.mapModes.svg}</span>
          </button>
        </div>

        {!isOnline && (
          <span className="flex items-center gap-1 text-[11px] text-[#f59e0b] font-medium">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{t.quarries.mapModes.offlineNotice}</span>
          </span>
        )}
      </div>

      {mapMode === 'svg' ? (
        <AlgeriaOfflineSvgMap
          quarries={quarries}
          origin={origin}
          selectedQuarryId={selectedQuarryId}
          onSelectQuarry={onSelectQuarry}
          focusCoords={focusCoords}
        />
      ) : mapMode === 'google' ? (
        <GoogleQuarryMap
          quarries={quarries}
          origin={origin}
          selectedQuarryId={selectedQuarryId}
          onSelectQuarry={onSelectQuarry}
          focusCoords={focusCoords}
        />
      ) : (
        <div className="relative h-[360px] sm:h-[420px] lg:h-[520px] w-full overflow-hidden rounded-[14px] border border-[#84cc16]/25 bg-[#070b09]">
          <div
            ref={containerRef}
            data-testid="quarry-leaflet-map"
            className="h-full w-full"
            aria-label={t.quarries.mapModes.leafletAria}
          />
          {/* Compact Legend Overlay */}
          <div className="pointer-events-none absolute bottom-3 start-3 z-[400] flex flex-wrap items-center gap-4 rounded-[12px] border border-white/[0.08] bg-[#0f1612]/95 px-3 py-2 text-xs text-[#b7c9bc] backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" aria-hidden="true" />
              <span>{t.quarries.mapModes.legendQuarry}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
              <span>{t.quarries.mapModes.legendSelected}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


