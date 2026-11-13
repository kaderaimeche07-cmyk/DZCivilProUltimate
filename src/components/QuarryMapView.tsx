import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { formatDistanceKm, formatDurationAr } from '../utils/gps.locator';

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
  coordsEl.textContent = `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`;

  wrapper.append(titleEl, coordsEl);
  return wrapper;
}

function createQuarryPopupElement(quarry: QuarryWithDistance): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'min-w-[210px] space-y-1.5 text-xs';

  const nameEl = document.createElement('div');
  nameEl.className = 'font-bold text-sm text-white';
  nameEl.textContent = quarry.name;

  const locEl = document.createElement('div');
  locEl.className = 'text-slate-300';
  locEl.textContent = `${quarry.wilayaCode} ${quarry.wilayaName} · ${quarry.municipality}`;

  const catEl = document.createElement('div');
  catEl.className = 'text-[#fbbf24] font-semibold';
  catEl.textContent = quarry.categoryLabel;

  const matsEl = document.createElement('div');
  matsEl.className = 'text-slate-400';
  matsEl.textContent = quarry.materials.slice(0, 4).join(' · ');

  const footerEl = document.createElement('div');
  footerEl.className = 'pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between gap-3';

  const distEl = document.createElement('span');
  distEl.className = 'text-[#a3e635] font-bold font-mono';
  distEl.textContent = formatDistanceKm(quarry.distanceKm);

  const etaEl = document.createElement('span');
  etaEl.className = 'text-slate-400';
  etaEl.textContent = `~ ${formatDurationAr(quarry.estimatedMinutes)} بالشاحنة`;

  footerEl.append(distEl, etaEl);
  wrapper.append(nameEl, locEl, catEl, matsEl, footerEl);
  return wrapper;
}

export const QuarryMapView: React.FC<QuarryMapViewProps> = ({
  quarries,
  origin,
  selectedQuarryId,
  onSelectQuarry,
  focusCoords,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelectQuarry);
  onSelectRef.current = onSelectQuarry;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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

      marker.bindPopup(createQuarryPopupElement(q));

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
  }, [quarries, origin, selectedQuarryId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusCoords || !Number.isFinite(focusCoords.lat) || !Number.isFinite(focusCoords.lng)) return;

    map.flyTo([focusCoords.lat, focusCoords.lng], focusCoords.zoom ?? 9, {
      duration: 0.6,
    });
  }, [focusCoords]);

  useEffect(() => {
    if (!selectedQuarryId) return;
    const marker = markerByIdRef.current.get(selectedQuarryId);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedQuarryId]);

  return (
    <div className="relative h-[340px] sm:h-[420px] lg:h-[520px] w-full overflow-hidden rounded-2xl border border-[#84cc16]/20 bg-[#080d0a]">
      <div
        ref={containerRef}
        data-testid="quarry-leaflet-map"
        className="h-full w-full"
        aria-label="خريطة المحاجر الجزائرية التفاعلية"
      />
      {/* Compact Legend Overlay */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-[400] flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0b110d]/90 px-3 py-2 text-xs text-[#c5d6c9] backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" aria-hidden="true" />
          <span>محجرة / مصنع</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
          <span>الموقع المحدد</span>
        </span>
      </div>
    </div>
  );
};
