import React from 'react';
import type { ConcreteDosage, ConcreteResult, RoadGradientResult } from '../utils/calculators.engine';
import { useI18n } from '../i18n/I18nContext';

interface ConcreteCadDiagramProps {
  lengthLabel: string;
  widthLabel: string;
  thicknessLabel: string;
  dosage: ConcreteDosage;
  result: ConcreteResult;
}

export const ConcreteCadDiagram: React.FC<ConcreteCadDiagramProps> = ({
  lengthLabel,
  widthLabel,
  thicknessLabel,
  dosage,
  result,
}) => {
  const { t } = useI18n();

  return (
    <div className="blueprint-cad-frame overflow-hidden border border-[#84cc16]/25">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#d9f99d]">{t.concrete.cadTitle}</span>
          <span className="font-mono-tabular text-[#b7c9bc]" dir="ltr">
            CPJ 42.5 · {dosage} kg/m³
          </span>
        </div>

      <svg
        viewBox="0 0 360 190"
        className="w-full h-44"
        role="img"
        aria-label={t.concrete.cadAria}
      >
        <defs>
          <linearGradient id="kiwiTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#84cc16" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#4d7c0f" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="kiwiSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#365314" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#1a2e05" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Isometric Concrete Slab/Block */}
        {/* Top Face */}
        <polygon
          points="80,58 215,24 300,66 165,100"
          fill="url(#kiwiTop)"
          stroke="#a3e635"
          strokeWidth="2"
        />
        {/* Front-Left Face */}
        <polygon
          points="80,58 165,100 165,134 80,92"
          fill="url(#kiwiSide)"
          stroke="#84cc16"
          strokeWidth="1.5"
        />
        {/* Front-Right Face */}
        <polygon
          points="165,100 300,66 300,100 165,134"
          fill="#121b15"
          fillOpacity="0.92"
          stroke="#84cc16"
          strokeWidth="1.5"
        />

        {/* Aggregate speckle dots inside front cross-section */}
        <circle cx="196" cy="112" r="2.2" fill="#f59e0b" fillOpacity="0.8" />
        <circle cx="222" cy="102" r="1.8" fill="#a3e635" fillOpacity="0.7" />
        <circle cx="248" cy="95" r="2.4" fill="#f59e0b" fillOpacity="0.7" />
        <circle cx="272" cy="88" r="1.8" fill="#d9f99d" fillOpacity="0.6" />
        <circle cx="118" cy="94" r="2" fill="#f59e0b" fillOpacity="0.7" />
        <circle cx="142" cy="106" r="1.8" fill="#a3e635" fillOpacity="0.7" />

        {/* Dimension Callout: Length (L) */}
        <line x1="168" y1="146" x2="303" y2="112" stroke="#a3e635" strokeWidth="1.2" strokeDasharray="3 2" />
        <text x="242" y="148" fill="#d9f99d" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          L = {lengthLabel}
        </text>

        {/* Dimension Callout: Width (W) */}
        <line x1="74" y1="104" x2="159" y2="146" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" />
        <text x="98" y="142" fill="#fbbf24" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          W = {widthLabel}
        </text>

        {/* Dimension Callout: Thickness / Height (H) */}
        <line x1="316" y1="66" x2="316" y2="100" stroke="#a3e635" strokeWidth="1.5" />
        <line x1="311" y1="66" x2="321" y2="66" stroke="#a3e635" strokeWidth="1.5" />
        <line x1="311" y1="100" x2="321" y2="100" stroke="#a3e635" strokeWidth="1.5" />
        <text x="326" y="87" fill="#a3e635" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor="start" direction="ltr">
          H={thicknessLabel}
        </text>

        {/* Volume Center Readout */}
        <text x="190" y="65" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          {result.valid ? `${result.netVolumeM3} m³` : '—'}
        </text>
      </svg>

        {/* Proportional Mix Composition Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-[#b7c9bc]">
            <span>{t.concrete.mixDistTitle}</span>
            <span className="font-mono-tabular text-[#d9f99d]">{t.concrete.mixDistLegend}</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#070b09] border border-white/10">
            <div className="bg-[#84cc16]" style={{ width: '48%' }} title={t.concrete.mixTitles.gravel} />
            <div className="bg-[#f59e0b]" style={{ width: '27%' }} title={t.concrete.mixTitles.sand} />
            <div className="bg-[#d9f99d]" style={{ width: '15%' }} title={t.concrete.mixTitles.cement} />
            <div className="bg-[#38bdf8]" style={{ width: '10%' }} title={t.concrete.mixTitles.water} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface RebarCadDiagramProps {
  diameterMm: number;
  crossSectionMm2: number;
  totalLengthM: number;
  commercialBars: number;
}

export const RebarCadDiagram: React.FC<RebarCadDiagramProps> = ({
  diameterMm,
  crossSectionMm2,
  totalLengthM,
  commercialBars,
}) => {
  const { t } = useI18n();
  const safeDiameter = Number.isFinite(diameterMm) && diameterMm > 0 ? diameterMm : 12;
  const safeSection = Number.isFinite(crossSectionMm2) && crossSectionMm2 > 0 ? crossSectionMm2 : 0;
  const safeLength = Number.isFinite(totalLengthM) && totalLengthM > 0 ? totalLengthM : 0;
  const safeBars = Number.isFinite(commercialBars) && commercialBars >= 0 ? commercialBars : 0;

  const radiusPx = Math.max(18, Math.min(46, 12 + safeDiameter * 1.1));
  const fullBars = Math.max(0, Math.floor(safeLength / 12));
  const remainderM = Number((safeLength - fullBars * 12).toFixed(2));
  const remainderPct = Math.min(100, Math.max(0, (remainderM / 12) * 100));

  return (
    <div className="blueprint-cad-frame overflow-hidden border border-[#84cc16]/25">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#d9f99d]">{t.rebar.cadTitle}</span>
          <span className="font-mono-tabular text-[#f59e0b]" dir="ltr">
            Ø {safeDiameter} mm · A = {safeSection} mm²
          </span>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Cross-Section SVG */}
        <div className="sm:col-span-5 flex justify-center">
          <svg
            viewBox="0 0 150 140"
            className="h-32 w-36"
            role="img"
            aria-label={t.rebar.cadAria(safeDiameter)}
          >
            {/* Outer rib ring */}
            <circle
              cx="75"
              cy="66"
              r={radiusPx + 4}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            {/* Core steel section */}
            <circle
              cx="75"
              cy="66"
              r={radiusPx}
              fill="#1a261e"
              stroke="#a3e635"
              strokeWidth="2.5"
            />
            {/* Hatching lines */}
            <line x1={75 - radiusPx * 0.65} y1={66 + radiusPx * 0.65} x2={75 + radiusPx * 0.65} y2={66 - radiusPx * 0.65} stroke="#84cc16" strokeOpacity="0.45" strokeWidth="1.5" />
            <line x1={75 - radiusPx * 0.35} y1={66 + radiusPx * 0.85} x2={75 + radiusPx * 0.85} y2={66 - radiusPx * 0.35} stroke="#84cc16" strokeOpacity="0.3" strokeWidth="1.5" />

            {/* Diameter caliper arrows */}
            <line x1={75 - radiusPx} y1="126" x2={75 + radiusPx} y2="126" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="75" y="138" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
              Ø {safeDiameter} mm
            </text>
          </svg>
        </div>

        {/* 12m Bar Cut Plan Visual */}
        <div className="sm:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a3b8a8]">{t.rebar.cutPlanTitle}</span>
            <span className="font-mono-tabular font-bold text-[#a3e635]">
              <bdi dir="ltr">{t.rebar.barsCountLabel(safeBars)}</bdi>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#b7c9bc]">
              <span>{t.rebar.fullBarsLabel}</span>
              <span className="text-[#84cc16]" dir="ltr">{fullBars} × 12m</span>
            </div>
            <div className="h-3 w-full rounded-md bg-[#0f1612] border border-[#84cc16]/30 overflow-hidden flex">
              <div className="h-full bg-[#84cc16] transition-all duration-200" style={{ width: fullBars > 0 ? '100%' : '0%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#b7c9bc] pt-1">
              <span>{t.rebar.remainderLabel}</span>
              <span className="text-[#f59e0b]" dir="ltr">
                {remainderM > 0 ? `${remainderM} m / 12 m` : t.rebar.noRemainder}
              </span>
            </div>
            <div className="h-3 w-full rounded-md bg-[#0f1612] border border-white/10 overflow-hidden flex">
              <div className="h-full bg-[#f59e0b] transition-all duration-200" style={{ width: `${remainderPct}%` }} />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

interface MasonryCadDiagramProps {
  lengthLabel: string;
  heightLabel: string;
  openingsM2: number;
  grossAreaM2: number;
  brickLabel: string;
}

export const MasonryCadDiagram: React.FC<MasonryCadDiagramProps> = ({
  lengthLabel,
  heightLabel,
  openingsM2,
  grossAreaM2,
  brickLabel,
}) => {
  const { t } = useI18n();
  const safeOpenings = Number.isFinite(openingsM2) && openingsM2 > 0 ? openingsM2 : 0;
  const safeGross = Number.isFinite(grossAreaM2) && grossAreaM2 > 0 ? grossAreaM2 : 0;
  const openingRatio = safeGross > 0 ? Math.min(0.65, Math.max(0, safeOpenings / safeGross)) : 0;
  const wallW = 240;
  const wallH = 110;
  const cutW = Math.round(wallW * Math.sqrt(openingRatio) * 0.85);
  const cutH = Math.round(wallH * Math.sqrt(openingRatio) * 0.85);

  return (
    <div className="blueprint-cad-frame overflow-hidden border border-[#84cc16]/25">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#d9f99d]">{t.masonry.cadTitle}</span>
          <span className="text-[#b7c9bc]">{brickLabel}</span>
        </div>

      <svg
        viewBox="0 0 340 165"
        className="w-full h-40"
        role="img"
        aria-label={t.masonry.cadAria}
      >
        {/* Main Masonry Wall */}
        <rect
          x="50"
          y="20"
          width={wallW}
          height={wallH}
          fill="#1a261e"
          stroke="#84cc16"
          strokeWidth="2"
        />

        {/* Horizontal Brick Courses */}
        {[38, 56, 74, 92, 110].map((y) => (
          <line key={y} x1="50" y1={y} x2={50 + wallW} y2={y} stroke="#84cc16" strokeOpacity="0.22" strokeWidth="1" />
        ))}
        {/* Staggered Vertical Joints */}
        {[80, 120, 160, 200, 240].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="130" stroke="#84cc16" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="18 18" />
        ))}

        {/* Proportional Openings (Windows/Doors) Cutout */}
        {openingRatio > 0.01 && (
          <g>
            <rect
              x={50 + (wallW - cutW) / 2}
              y={20 + (wallH - cutH) / 2}
              width={cutW}
              height={cutH}
              fill="#0b110d"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />
            <text
              x={50 + wallW / 2}
              y={24 + wallH / 2}
              fill="#fbbf24"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
              direction="ltr"
            >
              -{safeOpenings.toFixed(1)} m²
            </text>
          </g>
        )}

        {/* Length Dimension */}
        <line x1="50" y1="146" x2={50 + wallW} y2="146" stroke="#a3e635" strokeWidth="1.5" />
        <text x={50 + wallW / 2} y="160" fill="#d9f99d" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          L = {lengthLabel}
        </text>

        {/* Height Dimension */}
        <line x1="34" y1="20" x2="34" y2="130" stroke="#a3e635" strokeWidth="1.5" />
        <text x="18" y="78" fill="#a3e635" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor="middle" transform="rotate(-90 18 78)" direction="ltr">
          H = {heightLabel}
        </text>
      </svg>
      </div>
    </div>
  );
};

interface RoadSlopeCadDiagramProps {
  result: RoadGradientResult;
}

export const RoadSlopeCadDiagram: React.FC<RoadSlopeCadDiagramProps> = ({ result }) => {
  const { t } = useI18n();
  if (!result.valid || !Number.isFinite(result.slopeAngleDeg) || !Number.isFinite(result.absSlopePercent)) {
    return null;
  }
  const clampedAngle = Math.min(28, Math.max(2, result.slopeAngleDeg * 2.2));
  const dy = (Math.tan((clampedAngle * Math.PI) / 180) * 190);
  const startY = result.direction === 'pente' ? 115 - dy : 115;
  const endY = result.direction === 'pente' ? 115 : result.direction === 'rampe' ? 115 - dy : 115;
  const gaugePos = Math.min(96, Math.max(4, (result.absSlopePercent / 12) * 100));

  return (
    <div className="blueprint-cad-frame overflow-hidden border border-[#84cc16]/25">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#d9f99d]">{t.roads.gradient.cadTitle}</span>
          <span className="font-mono-tabular text-[#84cc16]" dir="ltr">
            {result.slopePercent}% ({result.slopeRatioText})
          </span>
        </div>

      <svg
        viewBox="0 0 360 142"
        className="w-full h-36"
        role="img"
        aria-label={t.roads.gradient.cadAria}
      >
        {/* Horizontal Datum */}
        <line x1="40" y1="115" x2="275" y2="115" stroke="#6b7f70" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Elevation Drop/Rise Line */}
        <line
          x1={result.direction === 'pente' ? 40 : 275}
          y1="115"
          x2={result.direction === 'pente' ? 40 : 275}
          y2={result.direction === 'pente' ? startY : endY}
          stroke="#f59e0b"
          strokeWidth="2"
        />
        {/* Shaded Slope Triangle */}
        <polygon
          points={`40,115 275,115 ${result.direction === 'pente' ? `40,${startY}` : `275,${endY}`}`}
          fill="#84cc16"
          fillOpacity="0.14"
        />
        {/* Road Alignment Line */}
        <line x1="40" y1={startY} x2="275" y2={endY} stroke="#a3e635" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="40" cy={startY} r="4.5" fill="#f59e0b" />
        <circle cx="275" cy={endY} r="4.5" fill="#84cc16" />

        {/* Labels */}
        <text x="158" y="133" fill="#a3b8a8" fontSize="10.5" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          ΔL = {result.horizontalDistanceM} m
        </text>
        <text
          x={result.direction === 'pente' ? 28 : 284}
          y={(115 + (result.direction === 'pente' ? startY : endY)) / 2 + 4}
          fill="#fbbf24"
          fontSize="10.5"
          fontFamily="JetBrains Mono, monospace"
          textAnchor={result.direction === 'pente' ? 'end' : 'start'}
          direction="ltr"
        >
          ΔZ={result.elevationDiffM}m
        </text>
      </svg>

      {/* B40 Compliance Spectrum Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono-tabular text-[#b7c9bc]" dir="ltr">
          <span>0%</span>
          <span>0.5%</span>
          <span>5% (B40)</span>
          <span>7%</span>
          <span>10%+</span>
        </div>
        <div dir="ltr" className="relative h-2.5 w-full rounded-full overflow-hidden flex bg-[#070b09]">
          <div className="bg-[#f59e0b]/70" style={{ width: '5%' }} />
          <div className="bg-[#84cc16]" style={{ width: '37%' }} />
          <div className="bg-[#65a30d]" style={{ width: '16%' }} />
          <div className="bg-[#f59e0b]" style={{ width: '25%' }} />
          <div className="bg-[#ef4444]" style={{ width: '17%' }} />
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow transition-all duration-200"
            style={{ left: `calc(${gaugePos}% - 2px)` }}
          />
        </div>
      </div>
      </div>
    </div>
  );
};

interface RoadCrossSectionDiagramProps {
  roadWidthM: number;
  sideSlopeRatio: number;
  sampleMode: 'cut' | 'fill';
}

export const RoadCrossSectionDiagram: React.FC<RoadCrossSectionDiagramProps> = ({
  roadWidthM,
  sideSlopeRatio,
  sampleMode,
}) => {
  const { t } = useI18n();
  const isCut = sampleMode === 'cut';
  return (
    <div className="blueprint-cad-frame overflow-hidden border border-[#84cc16]/25">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#d9f99d]">{t.roads.earthworks.crossSectionTitle}</span>
          <span className="font-mono-tabular text-[#b7c9bc]" dir="ltr">
            L={roadWidthM}m · Talus {sideSlopeRatio}:1
          </span>
        </div>

      <svg
        viewBox="0 0 340 120"
        className="w-full h-28"
        role="img"
        aria-label={t.roads.earthworks.crossSectionAria}
      >
        {isCut ? (
          <>
            {/* Natural ground higher */}
            <line x1="20" y1="32" x2="320" y2="32" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
            {/* Trapezoidal Cut Bowl */}
            <polygon
              points="55,32 105,86 235,86 285,32"
              fill="#f59e0b"
              fillOpacity="0.16"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <line x1="105" y1="86" x2="235" y2="86" stroke="#a3e635" strokeWidth="4" />
          </>
        ) : (
          <>
            {/* Natural ground lower */}
            <line x1="20" y1="88" x2="320" y2="88" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
            {/* Trapezoidal Embankment Fill */}
            <polygon
              points="55,88 105,34 235,34 285,88"
              fill="#84cc16"
              fillOpacity="0.18"
              stroke="#84cc16"
              strokeWidth="2"
            />
            <line x1="105" y1="34" x2="235" y2="34" stroke="#d9f99d" strokeWidth="4" />
          </>
        )}

        <text x="170" y={isCut ? 105 : 24} fill="#d9f99d" fontSize="10.5" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          Plateforme = {roadWidthM} m
        </text>
        <text x="64" y="62" fill="#a3b8a8" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          {sideSlopeRatio}:1
        </text>
        <text x="276" y="62" fill="#b7c9bc" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle" direction="ltr">
          {sideSlopeRatio}:1
        </text>
      </svg>
      </div>
    </div>
  );
};
