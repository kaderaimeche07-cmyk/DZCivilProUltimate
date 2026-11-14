import React, { useMemo, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { ALGERIAN_WILAYAT, findWilayaByCode } from '../data/wilayat';
import { useI18n } from '../i18n/I18nContext';
import { formatDistanceLocale, getQuarryCategoryLabel } from '../i18n/translations';

interface AlgeriaOfflineSvgMapProps {
  quarries: QuarryWithDistance[];
  origin: GeoCoordinates;
  selectedQuarryId: string | null;
  onSelectQuarry: (quarryId: string) => void;
  focusCoords?: { lat: number; lng: number; zoom?: number } | null;
}

// Coordinate bounds of Algeria
const BOUNDS = {
  minLat: 18.5,
  maxLat: 37.4,
  minLng: -8.9,
  maxLng: 12.2,
};

// SVG Canvas dimensions
const SVG_W = 820;
const SVG_H = 740;
const PADDING = 35;

function projectLngToX(lng: number): number {
  return PADDING + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (SVG_W - PADDING * 2);
}

function projectLatToY(lat: number): number {
  return SVG_H - PADDING - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (SVG_H - PADDING * 2);
}

// Stylized realistic outline polygon points of Algeria (58 Wilayat territory)
const ALGERIA_BORDER_COORDS: [number, number][] = [
  // Mediterranean Coastline from West to East (Marsa Ben M'hidi to El Kala)
  [-2.2, 35.1], [-1.9, 35.15], [-1.4, 35.3], [-0.65, 35.7], [-0.1, 35.9],
  [0.8, 36.1], [1.3, 36.3], [2.4, 36.6], [3.05, 36.8], [3.8, 36.9],
  [4.5, 36.9], [5.1, 36.75], [5.8, 36.85], [6.9, 36.9], [7.7, 36.92], [8.45, 36.9],
  // Eastern Border with Tunisia
  [8.5, 36.5], [8.3, 35.7], [8.4, 35.0], [8.0, 34.0], [8.5, 33.5], [9.3, 32.5], [9.8, 30.2],
  // Eastern Border with Libya
  [9.9, 29.5], [10.2, 28.5], [10.5, 27.5], [10.8, 26.5], [11.5, 25.0], [12.0, 24.0], [11.8, 23.5],
  // South-Eastern Border with Niger (Djanet / In Guezzam direction)
  [10.5, 23.0], [9.5, 22.0], [8.5, 20.5], [7.0, 19.5], [5.7, 19.1],
  // Southernmost Border with Mali (In Guezzam -> Bordj Badji Mokhtar -> Tin Zaouatine)
  [4.5, 19.4], [3.0, 20.0], [1.5, 20.8], [0.95, 21.3], [0.0, 21.5], [-1.0, 22.0],
  // South-Western Border with Mauritania & Western Sahara
  [-2.5, 23.0], [-4.0, 24.2], [-5.5, 25.5], [-7.0, 26.5], [-8.6, 27.2], [-8.7, 27.7],
  // Western Border with Morocco (Tindouf -> Bechar -> Tlemcen)
  [-8.0, 28.5], [-6.5, 29.8], [-4.5, 31.0], [-2.5, 31.8], [-2.2, 32.5], [-1.5, 33.5],
  [-1.8, 34.2], [-2.1, 34.8], [-2.2, 35.1],
];

export const AlgeriaOfflineSvgMap: React.FC<AlgeriaOfflineSvgMapProps> = ({
  quarries,
  origin,
  selectedQuarryId,
  onSelectQuarry,
}) => {
  const { lang, t } = useI18n();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredQuarry, setHoveredQuarry] = useState<QuarryWithDistance | null>(null);

  // Generate SVG polygon points for the Algerian border
  const borderPointsStr = useMemo(() => {
    return ALGERIA_BORDER_COORDS.map(([lng, lat]) => {
      const x = projectLngToX(lng);
      const y = projectLatToY(lat);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, []);

  // Compute Origin Screen Coordinates
  const originCoord = useMemo(() => {
    if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return null;
    return {
      x: projectLngToX(origin.lng),
      y: projectLatToY(origin.lat),
    };
  }, [origin]);

  // Find the selected quarry
  const selectedQuarry = useMemo(() => {
    return quarries.find((q) => q.id === selectedQuarryId);
  }, [quarries, selectedQuarryId]);

  const selectedCoord = useMemo(() => {
    if (!selectedQuarry || !Number.isFinite(selectedQuarry.lat) || !Number.isFinite(selectedQuarry.lng)) return null;
    return {
      x: projectLngToX(selectedQuarry.lng),
      y: projectLatToY(selectedQuarry.lat),
    };
  }, [selectedQuarry]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(2.5, Math.max(0.85, Number((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoomLevel(1);
  };

  const hoveredWilayaObj = hoveredQuarry ? findWilayaByCode(hoveredQuarry.wilayaCode) : undefined;
  const hoveredWilayaName = hoveredQuarry
    ? lang === 'ar'
      ? hoveredQuarry.wilayaName
      : (hoveredWilayaObj?.frName ?? hoveredQuarry.wilayaName)
    : '';

  return (
    <div className="relative h-[360px] sm:h-[420px] lg:h-[520px] w-full overflow-hidden rounded-[14px] border border-[#84cc16]/30 bg-[#060a08] select-none">
      {/* Offline Status & Info Banner */}
      <div className="pointer-events-none absolute top-3 start-3 z-10 flex items-center gap-2 rounded-[10px] border border-[#84cc16]/35 bg-[#0a110d]/95 px-3 py-1.5 text-[11px] font-bold text-[#84cc16] shadow-md backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-pulse" />
        <span>{t.quarries.mapModes.svgBanner}</span>
      </div>

      {/* Map Interactive Canvas */}
      <div
        className="h-full w-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-200"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-full w-full max-h-full max-w-full"
          role="img"
          aria-label={t.quarries.mapModes.svgAria}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="dz-map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(132, 204, 22, 0.05)" strokeWidth="0.8" />
            </pattern>
            {/* Algerian Territory Gradient */}
            <linearGradient id="dz-land-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#121b15" />
              <stop offset="35%" stopColor="#0d1510" />
              <stop offset="100%" stopColor="#090f0b" />
            </linearGradient>
            <radialGradient id="origin-pulse-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width={SVG_W} height={SVG_H} fill="#060a08" />
          <rect width={SVG_W} height={SVG_H} fill="url(#dz-map-grid)" />

          {/* Mediterranean Sea Indicator Header */}
          <path
            d={`M ${PADDING} ${projectLatToY(37.4)} Q ${SVG_W / 2} ${projectLatToY(37.9)} ${SVG_W - PADDING} ${projectLatToY(37.4)}`}
            fill="none"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <text
            x={SVG_W / 2}
            y={projectLatToY(37.15)}
            textAnchor="middle"
            fill="rgba(56, 189, 248, 0.45)"
            fontSize="11"
            fontFamily="Tajawal, sans-serif"
            fontWeight="bold"
          >
            {t.quarries.mapModes.mediterranean}
          </text>

          {/* Algerian Landmass Polygon */}
          <polygon
            points={borderPointsStr}
            fill="url(#dz-land-grad)"
            stroke="#84cc16"
            strokeWidth="2.2"
            strokeOpacity="0.65"
            strokeLinejoin="round"
          />

          {/* Subtle Region Latitudes */}
          {[36, 34, 30, 24].map((lat) => {
            const y = projectLatToY(lat);
            return (
              <g key={lat} opacity="0.3">
                <line
                  x1={PADDING + 20}
                  y1={y}
                  x2={SVG_W - PADDING - 20}
                  y2={y}
                  stroke="rgba(183, 201, 188, 0.12)"
                  strokeDasharray="3 4"
                />
                <text x={SVG_W - PADDING - 15} y={y - 3} fill="#728879" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                  {lat}°N
                </text>
              </g>
            );
          })}

          {/* Major Wilaya Reference Dots & Labels */}
          {ALGERIAN_WILAYAT.filter((w) =>
            ['16', '31', '25', '19', '23', '06', '07', '17', '30', '11', '01', '08', '37', '33'].includes(w.code)
          ).map((w) => {
            const wx = projectLngToX(w.lng);
            const wy = projectLatToY(w.lat);
            return (
              <g key={w.code} className="pointer-events-none">
                <circle cx={wx} cy={wy} r="2.8" fill="#728879" fillOpacity="0.75" />
                <text
                  x={wx + 6}
                  y={wy + 3}
                  fill="#b7c9bc"
                  fontSize="9.5"
                  fontFamily="Tajawal, sans-serif"
                  fontWeight="600"
                  opacity="0.8"
                >
                  {lang === 'ar' ? w.arName : w.frName}
                </text>
              </g>
            );
          })}

          {/* Route Vector Line from Origin to Selected Quarry */}
          {originCoord && selectedCoord && (
            <g>
              <line
                x1={originCoord.x}
                y1={originCoord.y}
                x2={selectedCoord.x}
                y2={selectedCoord.y}
                stroke="#f59e0b"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                strokeOpacity="0.9"
              />
              {/* Distance midpoint badge */}
              {selectedQuarry && (
                <g transform={`translate(${(originCoord.x + selectedCoord.x) / 2}, ${(originCoord.y + selectedCoord.y) / 2})`}>
                  <rect x="-35" y="-12" width="70" height="20" rx="6" fill="#0b110d" stroke="#f59e0b" strokeWidth="1.2" />
                  <text x="0" y="2" textAnchor="middle" fill="#84cc16" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">
                    {formatDistanceLocale(selectedQuarry.distanceKm, lang)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Quarry Points */}
          {quarries.map((q) => {
            if (!Number.isFinite(q.lat) || !Number.isFinite(q.lng)) return null;
            const qx = projectLngToX(q.lng);
            const qy = projectLatToY(q.lat);
            const isSelected = q.id === selectedQuarryId;
            const isHovered = hoveredQuarry?.id === q.id;

            return (
              <g
                key={q.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectQuarry(q.id);
                }}
                onMouseEnter={() => setHoveredQuarry(q)}
                onMouseLeave={() => setHoveredQuarry(null)}
                className="cursor-pointer group"
              >
                {/* Glow ring when selected or hovered */}
                {(isSelected || isHovered) && (
                  <circle cx={qx} cy={qy} r={isSelected ? 16 : 12} fill={isSelected ? '#f59e0b' : '#84cc16'} fillOpacity="0.25" />
                )}
                <circle
                  cx={qx}
                  cy={qy}
                  r={isSelected ? 7 : isHovered ? 6 : 4.5}
                  fill={isSelected ? '#f59e0b' : '#84cc16'}
                  stroke="#070b09"
                  strokeWidth={isSelected ? 2 : 1.2}
                />
              </g>
            );
          })}

          {/* Origin Marker (User GPS / Selected Wilaya) */}
          {originCoord && (
            <g transform={`translate(${originCoord.x}, ${originCoord.y})`}>
              <circle cx="0" cy="0" r="18" fill="url(#origin-pulse-grad)" />
              <circle cx="0" cy="0" r="10" fill="none" stroke="#a3e635" strokeWidth="1.6" strokeDasharray="3 3" />
              <circle cx="0" cy="0" r="4.5" fill="#a3e635" stroke="#080c0a" strokeWidth="1.5" />
              <text x="0" y="-14" textAnchor="middle" fill="#d9f99d" fontSize="9.5" fontWeight="bold" fontFamily="Tajawal, sans-serif">
                {origin.source === 'gps' ? t.quarries.myLocationGps : origin.label.split('-')[1]?.trim() || t.quarries.myLocationShort}
              </text>
            </g>
          )}

          {/* Compass Rose */}
          <g transform={`translate(${SVG_W - 55}, ${SVG_H - 65})`} opacity="0.8">
            <circle cx="0" cy="0" r="22" fill="#0b110d" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="0,-18 5,-4 0,0" fill="#84cc16" />
            <polygon points="0,-18 -5,-4 0,0" fill="#a3e635" />
            <polygon points="0,18 4,4 0,0" fill="#728879" />
            <polygon points="0,18 -4,4 0,0" fill="#526458" />
            <text x="0" y="-21" textAnchor="middle" fill="#84cc16" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">N</text>
            <text x="0" y="27" textAnchor="middle" fill="#728879" fontSize="8" fontFamily="JetBrains Mono">S</text>
          </g>

          {/* Scale Legend (~200 km) */}
          <g transform={`translate(35, ${SVG_H - 40})`} opacity="0.85">
            <rect x="0" y="-14" width="150" height="26" rx="6" fill="#0b110d" stroke="rgba(255,255,255,0.08)" />
            <line x1="12" y1="0" x2="138" y2="0" stroke="#84cc16" strokeWidth="2.5" />
            <line x1="12" y1="-4" x2="12" y2="4" stroke="#84cc16" strokeWidth="2.5" />
            <line x1="138" y1="-4" x2="138" y2="4" stroke="#84cc16" strokeWidth="2.5" />
            <text x="75" y="-5" textAnchor="middle" fill="#b7c9bc" fontSize="9" fontWeight="bold" fontFamily="Tajawal">
              {t.quarries.mapModes.scaleLegend}
            </text>
          </g>
        </svg>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredQuarry && (
        <div className="pointer-events-none absolute bottom-14 end-4 z-20 rounded-[12px] border border-[#84cc16]/40 bg-[#0f1612]/95 p-3 text-xs text-[#f4f7f2] shadow-xl backdrop-blur-md space-y-1 min-w-[200px]">
          <div className="font-bold text-[#84cc16] truncate">{hoveredQuarry.name}</div>
          <div className="text-[11px] text-[#b7c9bc]">
            {hoveredQuarry.wilayaCode} {hoveredWilayaName} · {getQuarryCategoryLabel(hoveredQuarry.category, lang)}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-1 text-[11px]">
            <span className="text-[#f59e0b] font-mono-tabular font-bold">
              {formatDistanceLocale(hoveredQuarry.distanceKm, lang)}
            </span>
            <span className="text-[#728879]">{t.quarries.mapModes.clickDetails}</span>
          </div>
        </div>
      )}

      {/* Zoom / Reset Controls */}
      <div className="absolute top-3 end-3 z-10 flex flex-col gap-1.5 rounded-[12px] border border-white/[0.09] bg-[#0c130f]/90 p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleZoom(0.25)}
          aria-label={t.quarries.mapModes.zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#b7c9bc] hover:bg-white/[0.08] hover:text-[#84cc16] transition-colors cursor-pointer"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.25)}
          aria-label={t.quarries.mapModes.zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#b7c9bc] hover:bg-white/[0.08] hover:text-[#84cc16] transition-colors cursor-pointer"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label={t.quarries.mapModes.resetView}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#b7c9bc] hover:bg-white/[0.08] hover:text-[#f59e0b] transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="pointer-events-none absolute bottom-3 start-3 z-10 flex flex-wrap items-center gap-3 rounded-[10px] border border-white/[0.08] bg-[#0c130f]/95 px-3 py-1.5 text-[11px] text-[#b7c9bc] backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
          <span>{t.quarries.mapModes.legendQuarry}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          <span>{t.quarries.mapModes.legendSelected}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#a3e635] border border-dashed border-[#080c0a]" />
          <span>{t.quarries.mapModes.legendOrigin}</span>
        </span>
      </div>
    </div>
  );
};

