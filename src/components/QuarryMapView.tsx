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
  const fill = isSelected ? '#ff9f1c' : '#2ec4b6';
  const stroke = isSelected ? '#ffffff' : '#0f1419';
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
  const color = isGps ? '#2ec4b6' : '#ff9f1c';
  return L.divIcon({
    className: 'dz-origin-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    html: `
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="17" r="14" stroke="${color}" stroke-width="2" stroke-dasharray="4 3" />
        <circle cx="17" cy="17" r="6" fill="${color}" stroke="#0f1419" stroke-width="2.5" />
      </svg>
    `,
  });
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
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [origin.lat, origin.lng],
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

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLineRef.current = null;
      markerByIdRef.current.clear();
    };
  }, []);

  // Re-render quarry markers & origin pin
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

    // Origin marker
    const originMarker = L.marker([origin.lat, origin.lng], {
      icon: createOriginMarkerIcon(origin.source === 'gps'),
      zIndexOffset: 500,
    });
    originMarker.bindPopup(
      `<div class="space-y-1 text-xs">
        <div class="font-bold text-[#2ec4b6]">${origin.label}</div>
        <div class="font-mono text-slate-300" dir="ltr">${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}</div>
      </div>`
    );
    originMarker.addTo(layer);

    // Quarry markers
    let selectedQuarry: QuarryWithDistance | undefined;
    for (const q of quarries) {
      const isSelected = q.id === selectedQuarryId;
      if (isSelected) selectedQuarry = q;

      const marker = L.marker([q.lat, q.lng], {
        icon: createQuarryMarkerIcon(isSelected),
        zIndexOffset: isSelected ? 400 : 100,
      });

      const materialsHtml = q.materials.slice(0, 4).join(' · ');
      marker.bindPopup(
        `<div class="min-w-[210px] space-y-1.5 text-xs">
          <div class="font-bold text-sm text-white">${q.name}</div>
          <div class="text-slate-300">${q.wilayaCode} ${q.wilayaName} · ${q.municipality}</div>
          <div class="text-[#ff9f1c] font-semibold">${q.categoryLabel}</div>
          <div class="text-slate-400">${materialsHtml}</div>
          <div class="pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between gap-3">
            <span class="text-[#2ec4b6] font-bold font-mono">${formatDistanceKm(q.distanceKm)}</span>
            <span class="text-slate-400">~ ${formatDurationAr(q.estimatedMinutes)} بالشاحنة</span>
          </div>
        </div>`
      );

      marker.on('click', () => {
        onSelectRef.current(q.id);
      });

      marker.addTo(layer);
      markerByIdRef.current.set(q.id, marker);
    }

    // Connecting line to selected quarry
    if (selectedQuarry) {
      routeLineRef.current = L.polyline(
        [
          [origin.lat, origin.lng],
          [selectedQuarry.lat, selectedQuarry.lng],
        ],
        {
          color: '#ff9f1c',
          weight: 2,
          dashArray: '6 6',
          opacity: 0.75,
        }
      ).addTo(map);
    }
  }, [quarries, origin, selectedQuarryId]);

  // Smooth pan/zoom when focusCoords changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusCoords) return;

    map.flyTo([focusCoords.lat, focusCoords.lng], focusCoords.zoom ?? 9, {
      duration: 0.6,
    });
  }, [focusCoords]);

  // Open popup when selectedQuarryId changes
  useEffect(() => {
    if (!selectedQuarryId) return;
    const marker = markerByIdRef.current.get(selectedQuarryId);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedQuarryId]);

  return (
    <div className="relative h-[340px] sm:h-[420px] lg:h-[520px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0f14]">
      <div
        ref={containerRef}
        data-testid="quarry-leaflet-map"
        className="h-full w-full"
        aria-label="خريطة المحاجر الجزائرية التفاعلية"
      />
      {/* Compact Legend Overlay */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-[400] flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0f1419]/88 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2ec4b6]" aria-hidden="true" />
          <span>محجرة / مصنع</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff9f1c]" aria-hidden="true" />
          <span>الموقع المحدد</span>
        </span>
      </div>
    </div>
  );
};
