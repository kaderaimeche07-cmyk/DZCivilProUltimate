import React, { useMemo, useState } from 'react';
import {
  Route,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  calculateRoadGradient,
  calculateLinearCutFill,
  calculateEarthworksCostDzd,
  formatDzd,
  type RoadStationPoint,
} from '../utils/calculators.engine';
import { LENGTH_UNITS, toMeters, type LengthUnit } from '../utils/units';
import { UnitInputField } from './UnitInputField';
import { RoadSlopeCadDiagram, RoadCrossSectionDiagram } from './EngineeringVisuals';
import type { SavedBoqItem } from '../types/boq';

interface RoadDesignCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const DEFAULT_STATIONS: RoadStationPoint[] = [
  { id: 'st-1', chainageM: 0, groundElevM: 422.5, designElevM: 420.0 },
  { id: 'st-2', chainageM: 100, groundElevM: 421.0, designElevM: 422.5 },
  { id: 'st-3', chainageM: 200, groundElevM: 424.2, designElevM: 425.0 },
  { id: 'st-4', chainageM: 300, groundElevM: 428.8, designElevM: 427.5 },
];

const PK_UNITS = [LENGTH_UNITS.m, LENGTH_UNITS.km, LENGTH_UNITS.cm];

export const RoadDesignCalculator: React.FC<RoadDesignCalculatorProps> = ({ onSaveToBoq }) => {
  // 1. User-defined Start & End Point Gradient Analyzer (Multi-unit!)
  const [startPkStr, setStartPkStr] = useState('0');
  const [startPkUnit, setStartPkUnit] = useState<LengthUnit>('m');
  const [startZStr, setStartZStr] = useState('420.0');
  const [startZUnit, setStartZUnit] = useState<LengthUnit>('m');

  const [endPkStr, setEndPkStr] = useState('250');
  const [endPkUnit, setEndPkUnit] = useState<LengthUnit>('m');
  const [endZStr, setEndZStr] = useState('431.5');
  const [endZUnit, setEndZUnit] = useState<LengthUnit>('m');

  // 2. Linear Cut & Fill Earthworks
  const [projectTitle, setProjectTitle] = useState('مقطع طريق ولائي — المحور الرئيسي');
  const [roadWidthStr, setRoadWidthStr] = useState('9.0');
  const [roadWidthUnit, setRoadWidthUnit] = useState<LengthUnit>('m');
  const [sideSlopeStr, setSideSlopeStr] = useState('1.5');
  const [swellFactorStr, setSwellFactorStr] = useState('1.20');
  const [stations, setStations] = useState<RoadStationPoint[]>(DEFAULT_STATIONS);
  const [crossSectionPreview, setCrossSectionPreview] = useState<'cut' | 'fill'>('fill');

  const gradientResult = useMemo(() => {
    return calculateRoadGradient({
      startChainageM: toMeters(Number(startPkStr), startPkUnit),
      startElevationM: toMeters(Number(startZStr), startZUnit),
      endChainageM: toMeters(Number(endPkStr), endPkUnit),
      endElevationM: toMeters(Number(endZStr), endZUnit),
    });
  }, [startPkStr, startPkUnit, startZStr, startZUnit, endPkStr, endPkUnit, endZStr, endZUnit]);

  const roadWidthM = useMemo(
    () => toMeters(Number(roadWidthStr), roadWidthUnit),
    [roadWidthStr, roadWidthUnit]
  );

  const earthworksResult = useMemo(() => {
    return calculateLinearCutFill({
      roadWidthM,
      sideSlopeRatio: Number(sideSlopeStr),
      swellFactor: Number(swellFactorStr) || 1.2,
      stations,
    });
  }, [roadWidthM, sideSlopeStr, swellFactorStr, stations]);

  const estimatedEarthworksDzd = useMemo(() => {
    return calculateEarthworksCostDzd(
      earthworksResult.totalCutVolumeM3,
      earthworksResult.totalFillVolumeM3
    );
  }, [earthworksResult.totalCutVolumeM3, earthworksResult.totalFillVolumeM3]);

  const updateStation = (id: string, field: keyof Omit<RoadStationPoint, 'id'>, rawVal: string) => {
    const num = Number(rawVal);
    setStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: Number.isFinite(num) ? num : 0 } : s))
    );
  };

  const addStation = () => {
    setStations((prev) => {
      const last = prev[prev.length - 1];
      const nextPk = last ? last.chainageM + 100 : 0;
      const nextGround = last ? Number((last.groundElevM + 1.5).toFixed(2)) : 420;
      const nextDesign = last ? Number((last.designElevM + 2.0).toFixed(2)) : 420;
      return [
        ...prev,
        {
          id: `st-${Date.now()}`,
          chainageM: nextPk,
          groundElevM: nextGround,
          designElevM: nextDesign,
        },
      ];
    });
  };

  const removeStation = (id: string) => {
    setStations((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));
  };

  const handleSaveEarthworks = () => {
    if (!earthworksResult.valid) return;
    const balanceText =
      earthworksResult.netEarthBalanceM3 >= 0
        ? `فائض حفر +${earthworksResult.netEarthBalanceM3} م³`
        : `عجز ردم ${earthworksResult.netEarthBalanceM3} م³`;
    const safeWidth = Number.isFinite(roadWidthM) ? roadWidthM.toFixed(2) : '0.00';

    onSaveToBoq({
      id: `road-${Date.now()}`,
      category: 'roads',
      categoryLabel: 'تصميم الطرقات',
      title: projectTitle.trim() || 'مشروع طريق خطي',
      summary: `طول ${earthworksResult.totalLengthM} م · عرض ${safeWidth} م · ميل أقصى ${earthworksResult.maxAbsGradientPercent}%`,
      metrics: [
        { label: 'حجم الحفر (Déblais)', value: `${earthworksResult.totalCutVolumeM3} م³` },
        { label: 'حجم الردم (Remblais)', value: `${earthworksResult.totalFillVolumeM3} م³` },
        { label: 'الميزان الترابي', value: balanceText },
        { label: 'رحلات الشاحنات (15 م³)', value: `${earthworksResult.truckTrips15m3} نقلة` },
      ],
      estimatedCostDzd: estimatedEarthworksDzd,
      createdAtIso: new Date().toISOString(),
    });
  };

  // Compute SVG longitudinal profile geometry with shaded fill polygon
  const profileSvg = useMemo(() => {
    if (stations.length < 2) return null;
    const finiteStations = stations.every(
      (s) => Number.isFinite(s.chainageM) && Number.isFinite(s.groundElevM) && Number.isFinite(s.designElevM)
    );
    if (!finiteStations) return null;

    const sorted = [...stations].sort((a, b) => a.chainageM - b.chainageM);
    const minPk = sorted[0].chainageM;
    const maxPk = sorted[sorted.length - 1].chainageM;
    const pkSpan = Math.max(1, maxPk - minPk);

    const allElevs = sorted.flatMap((s) => [s.groundElevM, s.designElevM]);
    const minZ = Math.min(...allElevs) - 1;
    const maxZ = Math.max(...allElevs) + 1;
    const zSpan = Math.max(1, maxZ - minZ);

    const w = 680;
    const h = 200;
    const padX = 32;
    const padY = 24;

    const toX = (pk: number) => padX + ((pk - minPk) / pkSpan) * (w - padX * 2);
    const toY = (z: number) => h - padY - ((z - minZ) / zSpan) * (h - padY * 2);

    const groundPoints = sorted.map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.groundElevM).toFixed(1)}`).join(' ');
    const designPoints = sorted.map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.designElevM).toFixed(1)}`).join(' ');

    const areaBetweenPoints = [
      ...sorted.map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.designElevM).toFixed(1)}`),
      ...[...sorted].reverse().map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.groundElevM).toFixed(1)}`),
    ].join(' ');

    return { sorted, w, h, toX, toY, groundPoints, designPoints, areaBetweenPoints };
  }, [stations]);

  const complianceColor =
    gradientResult.compliance === 'OPTIMAL_HIGHWAY' ||
    gradientResult.compliance === 'ACCEPTABLE_REGIONAL'
      ? 'text-[#a3e635] border-[#84cc16]/40 bg-[#84cc16]/10'
      : 'text-[#fbbf24] border-[#f59e0b]/40 bg-[#f59e0b]/10';

  return (
    <div className="space-y-6">
      {/* SECTION 1: Start-to-End Point Gradient Analyzer */}
      <section aria-labelledby="road-gradient-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/15 text-[#a3e635]">
              <Route className="h-5 w-5" />
            </span>
            <div>
              <h2 id="road-gradient-heading" className="text-lg font-bold text-white">
                تحليل الميول والانحدار الطولي بين نقطتين (Pente / Rampe)
              </h2>
              <p className="text-xs text-[#a3b8a8]">
                إدخال نقاط البداية والنهاية بأي وحدة (م، كم، سم) مع مثلث الانحدار ومقياس B40
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <UnitInputField
                id="grad-start-pk"
                label="نقطة البداية (PK1)"
                valueStr={startPkStr}
                onValueChange={setStartPkStr}
                unit={startPkUnit}
                onUnitChange={setStartPkUnit}
                units={PK_UNITS}
                min="-100000"
              />
              <UnitInputField
                id="grad-start-z"
                label="منسوب البداية (Z1)"
                valueStr={startZStr}
                onValueChange={setStartZStr}
                unit={startZUnit}
                onUnitChange={setStartZUnit}
                units={PK_UNITS}
                min="-500"
              />
              <UnitInputField
                id="grad-end-pk"
                label="نقطة النهاية (PK2)"
                valueStr={endPkStr}
                onValueChange={setEndPkStr}
                unit={endPkUnit}
                onUnitChange={setEndPkUnit}
                units={PK_UNITS}
                min="-100000"
              />
              <UnitInputField
                id="grad-end-z"
                label="منسوب النهاية (Z2)"
                valueStr={endZStr}
                onValueChange={setEndZStr}
                unit={endZUnit}
                onUnitChange={setEndZUnit}
                units={PK_UNITS}
                min="-500"
              />
            </div>

            {!gradientResult.valid ? (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                <span>{gradientResult.error}</span>
              </div>
            ) : (
              <div className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs ${complianceColor}`}>
                {gradientResult.compliance === 'OPTIMAL_HIGHWAY' ||
                gradientResult.compliance === 'ACCEPTABLE_REGIONAL' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold">{gradientResult.complianceLabelAr}</div>
                  <div className="text-[#d4e2d7]">{gradientResult.recommendationAr}</div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <RoadSlopeCadDiagram result={gradientResult} />
          </div>
        </div>

        {gradientResult.valid && (
          <div
            data-testid="road-gradient-results"
            className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-white/[0.08] pt-4"
          >
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#84cc16]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">نسبة الميل الطولي</div>
              <div className="mt-1 flex items-center gap-1.5 font-mono-tabular text-lg font-bold text-[#a3e635]">
                {gradientResult.direction === 'rampe' ? (
                  <TrendingUp className="h-4 w-4 text-[#a3e635]" />
                ) : gradientResult.direction === 'pente' ? (
                  <TrendingDown className="h-4 w-4 text-[#fbbf24]" />
                ) : (
                  <Minus className="h-4 w-4 text-[#a3b8a8]" />
                )}
                <span dir="ltr">{gradientResult.slopePercent}%</span>
              </div>
              <div className="text-[11px] text-[#a3b8a8]">{gradientResult.directionLabelAr}</div>
            </div>

            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">زاوية / نسبة الميل</div>
              <div className="mt-1 font-mono-tabular text-base font-bold text-white" dir="ltr">
                {gradientResult.slopeAngleDeg}°
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]" dir="ltr">
                {gradientResult.slopeRatioText}
              </div>
            </div>

            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">المسافة الأفقية (ΔL)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {gradientResult.horizontalDistanceM} <span className="text-xs font-normal text-[#a3b8a8]">م</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">فرق المنسوب (ΔZ)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#fbbf24]" dir="ltr">
                {gradientResult.elevationDiffM > 0 ? `+${gradientResult.elevationDiffM}` : gradientResult.elevationDiffM} m
              </div>
            </div>

            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">المسافة المائلة الحقيقية</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {gradientResult.slopeDistanceM} <span className="text-xs font-normal text-[#a3b8a8]">م</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Linear Cut & Fill Earthworks */}
      <section aria-labelledby="road-earthworks-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 id="road-earthworks-heading" className="text-lg font-bold text-white">
              حسابات الحفر والردم للمشاريع الخطية (Déblais / Remblais)
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              مقاطع عرضية شبه منحرفة مع الكشف التلقائي عن نقاط الانقلاب (Passage) ومعامل الانتفاش
            </p>
          </div>
          <button
            type="button"
            onClick={addStation}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#84cc16]/40 bg-[#84cc16]/14 px-3.5 py-2 text-xs font-bold text-[#a3e635] hover:bg-[#84cc16]/24 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة محطة (PK)</span>
          </button>
        </div>

        {/* Road Cross-Section Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label htmlFor="road-proj-name" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
              اسم المحور / المشروع
            </label>
            <input
              id="road-proj-name"
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
            />
          </div>

          <UnitInputField
            id="road-width"
            label="عرض القارعة (Plateforme)"
            valueStr={roadWidthStr}
            onValueChange={setRoadWidthStr}
            unit={roadWidthUnit}
            onUnitChange={setRoadWidthUnit}
          />

          <div>
            <label htmlFor="road-batter" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
              ميل الأكتاف Talus (H:V)
            </label>
            <input
              id="road-batter"
              type="number"
              min="0"
              step="0.25"
              value={sideSlopeStr}
              onChange={(e) => setSideSlopeStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
            />
          </div>
          <div>
            <label htmlFor="road-swell" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
              معامل الانتفاش (Foisonnement)
            </label>
            <input
              id="road-swell"
              type="number"
              min="1"
              max="1.6"
              step="0.05"
              value={swellFactorStr}
              onChange={(e) => setSwellFactorStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
            />
          </div>
        </div>

        {/* Dual Engineering Diagrams: Longitudinal Profile + Typical Cross-Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {profileSvg && (
            <div className="lg:col-span-8 bg-engineering-grid rounded-2xl border border-[#84cc16]/20 p-4 flex flex-col justify-between">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#d9f99d]">المقطع الطولي (Profil en Long)</span>
                <div className="flex items-center gap-4 text-[11px] text-[#a3b8a8]">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-4 bg-[#f59e0b]" />
                    <span>الأرض الطبيعية (TN)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-4 bg-[#84cc16]" />
                    <span>الخط الأحمر للمشروع (Projet)</span>
                  </span>
                </div>
              </div>
              <svg
                viewBox={`0 0 ${profileSvg.w} ${profileSvg.h}`}
                className="w-full h-44 overflow-visible"
                role="img"
                aria-label="رسم بياني للمقطع الطولي للطريق مقارنة بين الأرض الطبيعية وخط المشروع"
              >
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <line
                    key={ratio}
                    x1={20}
                    x2={profileSvg.w - 20}
                    y1={profileSvg.h * ratio}
                    y2={profileSvg.h * ratio}
                    stroke="rgba(163,230,53,0.08)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Shaded Cut/Fill Envelope */}
                <polygon
                  points={profileSvg.areaBetweenPoints}
                  fill="#84cc16"
                  fillOpacity="0.12"
                />

                {/* Natural Ground Polyline */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  points={profileSvg.groundPoints}
                />

                {/* Design Line Polyline */}
                <polyline
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="3"
                  points={profileSvg.designPoints}
                />

                {/* Station Nodes */}
                {profileSvg.sorted.map((s) => {
                  const cx = profileSvg.toX(s.chainageM);
                  const cyGround = profileSvg.toY(s.groundElevM);
                  const cyDesign = profileSvg.toY(s.designElevM);
                  return (
                    <g key={s.id}>
                      <line
                        x1={cx}
                        x2={cx}
                        y1={cyGround}
                        y2={cyDesign}
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="1"
                      />
                      <circle cx={cx} cy={cyGround} r="4" fill="#f59e0b" />
                      <circle cx={cx} cy={cyDesign} r="4.5" fill="#84cc16" />
                      <text
                        x={cx}
                        y={profileSvg.h - 4}
                        textAnchor="middle"
                        fill="#a3b8a8"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        PK {s.chainageM}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          <div className="lg:col-span-4 space-y-2.5 flex flex-col justify-between">
            <RoadCrossSectionDiagram
              roadWidthM={Number.isFinite(roadWidthM) && roadWidthM > 0 ? Number(roadWidthM.toFixed(2)) : 9}
              sideSlopeRatio={Number(sideSlopeStr) || 1.5}
              sampleMode={crossSectionPreview}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCrossSectionPreview('fill')}
                className={`min-h-[36px] rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  crossSectionPreview === 'fill'
                    ? 'border-[#84cc16] bg-[#84cc16]/16 text-[#a3e635]'
                    : 'border-white/10 bg-[#0b110d] text-[#a3b8a8]'
                }`}
              >
                مقطع ردم (Remblai)
              </button>
              <button
                type="button"
                onClick={() => setCrossSectionPreview('cut')}
                className={`min-h-[36px] rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  crossSectionPreview === 'cut'
                    ? 'border-[#f59e0b] bg-[#f59e0b]/16 text-[#fbbf24]'
                    : 'border-white/10 bg-[#0b110d] text-[#a3b8a8]'
                }`}
              >
                مقطع حفر (Déblai)
              </button>
            </div>
          </div>
        </div>

        {/* Editable Station Points Table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0b110d] text-[#a3b8a8]">
              <tr>
                <th className="px-3 py-3 font-semibold">المحطة PK (م)</th>
                <th className="px-3 py-3 font-semibold">الأرض الطبيعية TN (م)</th>
                <th className="px-3 py-3 font-semibold">خط المشروع Projet (م)</th>
                <th className="px-3 py-3 font-semibold">الوضع (حفر / ردم)</th>
                <th className="px-3 py-3 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-[#121b15]/80">
              {stations.map((st, idx) => {
                const diff = Number((st.designElevM - st.groundElevM).toFixed(2));
                const isFill = diff > 0;
                const isCut = diff < 0;
                return (
                  <tr key={st.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        aria-label={`مسافة المحطة ${idx + 1}`}
                        value={st.chainageM}
                        onChange={(e) => updateStation(st.id, 'chainageM', e.target.value)}
                        className="font-mono-tabular w-24 min-h-[38px] rounded-lg border border-white/10 bg-[#0b110d] px-2.5 py-1 text-white outline-none focus:border-[#84cc16]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        aria-label={`منسوب الأرض الطبيعية للمحطة ${idx + 1}`}
                        value={st.groundElevM}
                        onChange={(e) => updateStation(st.id, 'groundElevM', e.target.value)}
                        className="font-mono-tabular w-28 min-h-[38px] rounded-lg border border-white/10 bg-[#0b110d] px-2.5 py-1 text-white outline-none focus:border-[#f59e0b]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        aria-label={`منسوب المشروع للمحطة ${idx + 1}`}
                        value={st.designElevM}
                        onChange={(e) => updateStation(st.id, 'designElevM', e.target.value)}
                        className="font-mono-tabular w-28 min-h-[38px] rounded-lg border border-white/10 bg-[#0b110d] px-2.5 py-1 text-white outline-none focus:border-[#84cc16]"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono-tabular font-semibold">
                      {isCut ? (
                        <span className="text-[#fbbf24]">حفر {Math.abs(diff)} م</span>
                      ) : isFill ? (
                        <span className="text-[#a3e635]">ردم +{diff} م</span>
                      ) : (
                        <span className="text-[#a3b8a8]">تطابق (0.0 م)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeStation(st.id)}
                        disabled={stations.length <= 2}
                        aria-label={`حذف المحطة ${idx + 1}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a3b8a8] hover:bg-white/5 hover:text-[#fbbf24] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Earthworks Outputs */}
        {!earthworksResult.valid ? (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
            <span>{earthworksResult.error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              data-testid="road-earthworks-results"
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
              <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-[#a3b8a8]">الطول الخطي / أقصى ميل</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                  {earthworksResult.totalLengthM} <span className="text-xs font-normal text-[#a3b8a8]">م</span>
                </div>
                <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">
                  ميل أقصى {earthworksResult.maxAbsGradientPercent}%
                </div>
              </div>

              <div className="rounded-xl bg-[#0b110d]/90 border border-[#f59e0b]/25 p-3.5">
                <div className="text-[11px] text-[#a3b8a8]">إجمالي الحفر (Déblais)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-[#fbbf24]">
                  {earthworksResult.totalCutVolumeM3} <span className="text-xs font-normal text-[#a3b8a8]">م³</span>
                </div>
                <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">
                  بعد الانتفاش: {earthworksResult.swelledCutVolumeM3} م³
                </div>
              </div>

              <div className="rounded-xl bg-[#0b110d]/90 border border-[#84cc16]/25 p-3.5">
                <div className="text-[11px] text-[#a3b8a8]">إجمالي الردم (Remblais)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-[#a3e635]">
                  {earthworksResult.totalFillVolumeM3} <span className="text-xs font-normal text-[#a3b8a8]">م³</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-[#a3b8a8]">الميزان الترابي الصافي</div>
                <div
                  className={`mt-1 font-mono-tabular text-lg font-bold ${
                    earthworksResult.netEarthBalanceM3 >= 0 ? 'text-[#fbbf24]' : 'text-[#a3e635]'
                  }`}
                  dir="ltr"
                >
                  {earthworksResult.netEarthBalanceM3 > 0
                    ? `+${earthworksResult.netEarthBalanceM3}`
                    : earthworksResult.netEarthBalanceM3}{' '}
                  m³
                </div>
                <div className="text-[11px] text-[#a3b8a8]">
                  {earthworksResult.netEarthBalanceM3 >= 0 ? 'فائض حفر للترحيل' : 'عجز ردم للاستجلاب'}
                </div>
              </div>

              <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-[#a3b8a8]">نقلات الشاحنات (15 م³)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                  {earthworksResult.truckTrips15m3} <span className="text-xs font-normal text-[#a3b8a8]">رحلة</span>
                </div>
              </div>
            </div>

            {/* Segment-by-Segment Details */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0b110d] text-[#a3b8a8]">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">المقطع</th>
                    <th className="px-3 py-2.5 font-semibold">الطول</th>
                    <th className="px-3 py-2.5 font-semibold">ميل المشروع</th>
                    <th className="px-3 py-2.5 font-semibold">حجم الحفر</th>
                    <th className="px-3 py-2.5 font-semibold">حجم الردم</th>
                    <th className="px-3 py-2.5 font-semibold">ملاحظة المقطع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] bg-[#121b15]/70">
                  {earthworksResult.segments.map((seg) => (
                    <tr key={`${seg.fromChainageM}-${seg.toChainageM}`}>
                      <td className="px-3 py-2.5 font-mono-tabular text-white" dir="ltr">
                        PK {seg.fromChainageM} → PK {seg.toChainageM}
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-[#c5d6c9]">
                        {seg.lengthM} م
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-slate-200" dir="ltr">
                        {seg.designGradient.slopePercent}%
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-[#fbbf24]">
                        {seg.cutVolumeM3} م³
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-[#a3e635]">
                        {seg.fillVolumeM3} م³
                      </td>
                      <td className="px-3 py-2.5 text-[#c5d6c9]">
                        {seg.hasTransitionPoint
                          ? `نقطة انقلاب عند PK ${seg.transitionChainageM}`
                          : seg.designGradient.directionLabelAr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#a3b8a8]">
                التكلفة التقديرية للأشغال الترابية: <strong className="font-mono-tabular text-[#fbbf24]">{formatDzd(estimatedEarthworksDzd)}</strong>
              </span>
              <button
                type="button"
                onClick={handleSaveEarthworks}
                className="btn-kiwi inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة إلى كشف الكميات</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
