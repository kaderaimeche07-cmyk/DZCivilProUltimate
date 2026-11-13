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
  SlidersHorizontal,
  Layers,
  Table2,
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
import { TelemetryReadoutStrip, type TelemetryMetricItem } from './TelemetryReadout';
import { LiveResultBanner } from './LiveResultBanner';
import { CollapsibleSection } from './CollapsibleSection';
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

type RoadSubMode = 'gradient' | 'earthworks';

export const RoadDesignCalculator: React.FC<RoadDesignCalculatorProps> = ({ onSaveToBoq }) => {
  const [roadMode, setRoadMode] = useState<RoadSubMode>('gradient');

  // 1. Start & End Point Gradient Analyzer
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

  const gradientTelemetry: TelemetryMetricItem[] = useMemo(() => {
    if (!gradientResult.valid) return [];
    const slopeIcon =
      gradientResult.direction === 'rampe' ? (
        <TrendingUp className="h-4 w-4 text-[#84cc16] shrink-0" />
      ) : gradientResult.direction === 'pente' ? (
        <TrendingDown className="h-4 w-4 text-[#f59e0b] shrink-0" />
      ) : (
        <Minus className="h-4 w-4 text-[#b7c9bc] shrink-0" />
      );

    return [
      {
        id: 'grad-slope',
        label: 'نسبة الميل الطولي',
        value: `${gradientResult.slopePercent}%`,
        subtext: gradientResult.directionLabelAr,
        accent: 'kiwi',
        dir: 'ltr',
        icon: slopeIcon,
      },
      {
        id: 'grad-angle',
        label: 'زاوية / نسبة الميل',
        value: `${gradientResult.slopeAngleDeg}°`,
        subtext: gradientResult.slopeRatioText,
        accent: 'neutral',
        dir: 'ltr',
      },
      {
        id: 'grad-dl',
        label: 'المسافة الأفقية (ΔL)',
        value: gradientResult.horizontalDistanceM,
        unit: 'م',
        accent: 'neutral',
      },
      {
        id: 'grad-dz',
        label: 'فرق المنسوب (ΔZ)',
        value: `${gradientResult.elevationDiffM > 0 ? `+${gradientResult.elevationDiffM}` : gradientResult.elevationDiffM} m`,
        accent: 'amber',
        dir: 'ltr',
      },
      {
        id: 'grad-dist',
        label: 'المسافة المائلة الحقيقية',
        value: gradientResult.slopeDistanceM,
        unit: 'م',
        accent: 'neutral',
      },
    ];
  }, [gradientResult]);

  const earthworksTelemetry: TelemetryMetricItem[] = useMemo(() => {
    if (!earthworksResult.valid) return [];
    return [
      {
        id: 'earth-len',
        label: 'الطول الخطي / أقصى ميل',
        value: earthworksResult.totalLengthM,
        unit: 'م',
        subtext: `ميل أقصى ${earthworksResult.maxAbsGradientPercent}%`,
        accent: 'neutral',
      },
      {
        id: 'earth-cut',
        label: 'إجمالي الحفر (Déblais)',
        value: earthworksResult.totalCutVolumeM3,
        unit: 'م³',
        subtext: `بعد الانتفاش: ${earthworksResult.swelledCutVolumeM3} م³`,
        accent: 'amber',
      },
      {
        id: 'earth-fill',
        label: 'إجمالي الردم (Remblais)',
        value: earthworksResult.totalFillVolumeM3,
        unit: 'م³',
        accent: 'kiwi',
      },
      {
        id: 'earth-bal',
        label: 'الميزان الترابي الصافي',
        value: `${earthworksResult.netEarthBalanceM3 > 0 ? `+${earthworksResult.netEarthBalanceM3}` : earthworksResult.netEarthBalanceM3} m³`,
        subtext: earthworksResult.netEarthBalanceM3 >= 0 ? 'فائض حفر للترحيل' : 'عجز ردم للاستجلاب',
        accent: earthworksResult.netEarthBalanceM3 >= 0 ? 'amber' : 'kiwi',
        dir: 'ltr',
      },
      {
        id: 'earth-trucks',
        label: 'نقلات الشاحنات (15 م³)',
        value: earthworksResult.truckTrips15m3,
        unit: 'رحلة',
        accent: 'neutral',
      },
    ];
  }, [earthworksResult]);

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
      ? 'text-[#84cc16] border-[#84cc16]/40 bg-[#84cc16]/10'
      : 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10';

  return (
    <div className="space-y-5">
      {/* Focused Segmented Switcher for Roads Workspace */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="أدوات تصميم الطرقات"
          className="grid grid-cols-2 sm:inline-flex items-center gap-1.5 rounded-[14px] bg-[#070b09] p-1.5 border border-white/[0.08] w-full sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={roadMode === 'gradient'}
            onClick={() => setRoadMode('gradient')}
            className={`min-h-[44px] rounded-[10px] px-4 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
              roadMode === 'gradient'
                ? 'bg-[#84cc16] text-[#060a05]'
                : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
            }`}
          >
            الميل والانحدار (<bdi dir="ltr">Pente</bdi>)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={roadMode === 'earthworks'}
            onClick={() => setRoadMode('earthworks')}
            className={`min-h-[44px] rounded-[10px] px-4 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
              roadMode === 'earthworks'
                ? 'bg-[#84cc16] text-[#060a05]'
                : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
            }`}
          >
            الحفر والردم (<bdi dir="ltr">Profil en Long</bdi>)
          </button>
        </div>

        <span className="text-xs text-[#b7c9bc]">معايير الطرقات الوطنية والولائية <bdi dir="ltr">B40</bdi></span>
      </div>

      {/* MODE 1: GRADIENT ANALYZER */}
      {roadMode === 'gradient' && (
        <div className="space-y-4">
          {gradientResult.valid && (
            <LiveResultBanner
              label="تحليل الميل الطولي (B40)"
              primaryValue={`${gradientResult.slopePercent}% (${gradientResult.directionLabelAr})`}
              secondaryDetail={`ΔL = ${gradientResult.horizontalDistanceM} م`}
            />
          )}

          <section aria-labelledby="road-gradient-heading" className="console-panel overflow-hidden">
            <div className="topographic-scale" aria-hidden="true" />
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16]">
                  <Route className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="road-gradient-heading" className="text-lg font-bold text-[#f4f7f2]">
                    تحليل الميل بين نقطتين (<bdi dir="ltr">Pente / Rampe</bdi>)
                  </h2>
                  <p className="text-xs text-[#b7c9bc]">
                    أدخل نقطتي البداية والنهاية (<bdi dir="ltr">PK</bdi> و <bdi dir="ltr">Z</bdi>) بأي وحدة لحساب الانحدار ومطابقة <bdi dir="ltr">B40</bdi>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div role="alert" className="flex items-center gap-2 rounded-[14px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                      <span>{gradientResult.error}</span>
                    </div>
                  ) : (
                    <div className={`flex items-start gap-3 rounded-[14px] border p-3.5 text-xs transition-colors duration-200 ${complianceColor}`}>
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
                  <div className="hidden lg:block">
                    <RoadSlopeCadDiagram result={gradientResult} />
                  </div>
                  <div className="lg:hidden">
                    <CollapsibleSection
                      title="مثلث الانحدار ومقياس B40"
                      subtitle="رسم هندسي توضيحي لنسبة الميل والفرق الرأسي"
                      icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                    >
                      <RoadSlopeCadDiagram result={gradientResult} />
                    </CollapsibleSection>
                  </div>
                </div>
              </div>

              {gradientResult.valid && (
                <div className="border-t border-white/[0.08] pt-5">
                  <TelemetryReadoutStrip
                    testId="road-gradient-results"
                    items={gradientTelemetry}
                    columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* MODE 2: EARTHWORKS (CUT & FILL) */}
      {roadMode === 'earthworks' && (
        <div className="space-y-4">
          {earthworksResult.valid && (
            <LiveResultBanner
              label={`الحفر والردم · طول ${earthworksResult.totalLengthM} م`}
              primaryValue={`حفر ${earthworksResult.totalCutVolumeM3} م³`}
              secondaryDetail={`ردم ${earthworksResult.totalFillVolumeM3} م³`}
              costText={formatDzd(estimatedEarthworksDzd)}
              copyCostLabel="نسخ تكلفة الأشغال الترابية"
              onSave={handleSaveEarthworks}
              saveLabel="+ حفظ في المقايسة"
            />
          )}

          <section aria-labelledby="road-earthworks-heading" className="console-panel overflow-hidden">
            <div className="topographic-scale" aria-hidden="true" />
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h2 id="road-earthworks-heading" className="text-lg font-bold text-[#f4f7f2]">
                    حسابات الحفر والردم (<bdi dir="ltr">Déblais / Remblais</bdi>)
                  </h2>
                  <p className="text-xs text-[#b7c9bc]">
                    أدخل عرض القارعة ومناسيب المحطات (<bdi dir="ltr">TN / Projet</bdi>) لحساب الحجوم الترابية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStation}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#84cc16]/45 bg-[#84cc16]/14 px-4 py-2 text-xs font-bold text-[#a3e635] hover:bg-[#84cc16]/24 transition-colors duration-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة محطة (<bdi dir="ltr">PK</bdi>)</span>
                </button>
              </div>

              {/* Essential Width + Quick Advanced Options */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-4">
                  <UnitInputField
                    id="road-width"
                    label="عرض القارعة (Plateforme)"
                    valueStr={roadWidthStr}
                    onValueChange={setRoadWidthStr}
                    unit={roadWidthUnit}
                    onUnitChange={setRoadWidthUnit}
                  />
                </div>
                <div className="lg:col-span-8">
                  <CollapsibleSection
                    title="خيارات متقدمة للمحور"
                    subtitle="اسم المشروع، ميل الأكتاف Talus، ومعامل الانتفاش"
                    badge={`Talus ${sideSlopeStr}:1 · انتفاش ${swellFactorStr}`}
                    icon={<SlidersHorizontal className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label htmlFor="road-proj-name" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                          اسم المحور / المشروع
                        </label>
                        <input
                          id="road-proj-name"
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          className="w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                        />
                      </div>
                      <div>
                        <label htmlFor="road-batter" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                          ميل الأكتاف <bdi dir="ltr">Talus (H:V)</bdi>
                        </label>
                        <input
                          id="road-batter"
                          type="number"
                          min="0"
                          step="0.25"
                          value={sideSlopeStr}
                          onChange={(e) => setSideSlopeStr(e.target.value)}
                          className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                        />
                      </div>
                      <div>
                        <label htmlFor="road-swell" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                          معامل الانتفاش
                        </label>
                        <input
                          id="road-swell"
                          type="number"
                          min="1"
                          max="1.6"
                          step="0.05"
                          value={swellFactorStr}
                          onChange={(e) => setSwellFactorStr(e.target.value)}
                          className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                        />
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
              </div>

              {/* Editable Station Points Table with Non-Clipping Single-Line Format */}
              <div className="overflow-x-auto rounded-[14px] border border-white/[0.08] bg-[#070b09]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0b110d] text-[#b7c9bc] border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[120px]">المحطة <bdi dir="ltr">PK</bdi> (م)</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[130px]">الأرض <bdi dir="ltr">TN</bdi> (م)</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[130px]">المشروع <bdi dir="ltr">Projet</bdi> (م)</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[130px]">الحالة الهندسية</th>
                      <th className="px-3 py-3 font-semibold text-center whitespace-nowrap w-14">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] bg-[#0f1612]/90">
                    {stations.map((st, idx) => {
                      const diff = Number((st.designElevM - st.groundElevM).toFixed(2));
                      const isFill = diff > 0;
                      const isCut = diff < 0;
                      return (
                        <tr key={st.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              aria-label={`مسافة المحطة ${idx + 1}`}
                              value={st.chainageM}
                              onChange={(e) => updateStation(st.id, 'chainageM', e.target.value)}
                              className="font-mono-tabular w-24 min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-2.5 py-1 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              aria-label={`منسوب الأرض الطبيعية للمحطة ${idx + 1}`}
                              value={st.groundElevM}
                              onChange={(e) => updateStation(st.id, 'groundElevM', e.target.value)}
                              className="font-mono-tabular w-24 sm:w-28 min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-2.5 py-1 text-[#f4f7f2] outline-none focus:border-[#f59e0b]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              aria-label={`منسوب المشروع للمحطة ${idx + 1}`}
                              value={st.designElevM}
                              onChange={(e) => updateStation(st.id, 'designElevM', e.target.value)}
                              className="font-mono-tabular w-24 sm:w-28 min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-2.5 py-1 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono-tabular font-semibold whitespace-nowrap">
                            {isCut ? (
                              <span className="text-[#f59e0b] whitespace-nowrap">حفر <bdi dir="ltr">{Math.abs(diff)}</bdi> م</span>
                            ) : isFill ? (
                              <span className="text-[#84cc16] whitespace-nowrap">ردم <bdi dir="ltr">+{diff}</bdi> م</span>
                            ) : (
                              <span className="text-[#b7c9bc] whitespace-nowrap">تطابق</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeStation(st.id)}
                              disabled={stations.length <= 2}
                              aria-label={`حذف المحطة ${idx + 1}`}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[#b7c9bc] hover:bg-white/5 hover:text-[#f59e0b] disabled:opacity-30 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
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
                <div role="alert" className="flex items-center gap-2 rounded-[14px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                  <span>{earthworksResult.error}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <TelemetryReadoutStrip
                    testId="road-earthworks-results"
                    items={earthworksTelemetry}
                    columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  />

                  <CollapsibleSection
                    title="المقاطع الهندسية (Profil en Long & Profil en Travers)"
                    subtitle="معاينة المقطع الطولي والجانبي للحفر والردم"
                    icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      {profileSvg && (
                        <div className="lg:col-span-8 blueprint-cad-frame overflow-hidden border border-[#84cc16]/25 flex flex-col justify-between">
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-[#d9f99d]">المقطع الطولي (<bdi dir="ltr">Profil en Long</bdi>)</span>
                              <div className="flex items-center gap-4 text-[11px] text-[#b7c9bc]">
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block h-0.5 w-4 bg-[#f59e0b]" />
                                  <span>الأرض (<bdi dir="ltr">TN</bdi>)</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block h-0.5 w-4 bg-[#84cc16]" />
                                  <span>المشروع (<bdi dir="ltr">Projet</bdi>)</span>
                                </span>
                              </div>
                            </div>
                            <svg
                              viewBox={`0 0 ${profileSvg.w} ${profileSvg.h}`}
                              className="w-full h-44 overflow-visible"
                              role="img"
                              aria-label="رسم بياني للمقطع الطولي للطريق"
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
                              <polygon points={profileSvg.areaBetweenPoints} fill="#84cc16" fillOpacity="0.12" />
                              <polyline
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2.5"
                                strokeDasharray="6 4"
                                points={profileSvg.groundPoints}
                              />
                              <polyline
                                fill="none"
                                stroke="#ea580c"
                                strokeWidth="3.5"
                                points={profileSvg.designPoints}
                              />
                              {profileSvg.sorted.map((s) => {
                                const cx = profileSvg.toX(s.chainageM);
                                const cyGround = profileSvg.toY(s.groundElevM);
                                const cyDesign = profileSvg.toY(s.designElevM);
                                return (
                                  <g key={s.id}>
                                    <line x1={cx} x2={cx} y1={cyGround} y2={cyDesign} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
                                    <circle cx={cx} cy={cyGround} r="4" fill="#f59e0b" />
                                    <circle cx={cx} cy={cyDesign} r="4.5" fill="#ea580c" />
                                    <text x={cx} y={profileSvg.h - 4} textAnchor="middle" fill="#b7c9bc" fontSize="10" fontFamily="JetBrains Mono, monospace">
                                      PK {s.chainageM}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
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
                            className={`min-h-[44px] rounded-[12px] border text-xs font-bold transition-colors duration-200 cursor-pointer ${
                              crossSectionPreview === 'fill'
                                ? 'border-[#84cc16] bg-[#84cc16]/16 text-[#84cc16]'
                                : 'border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:text-[#f4f7f2]'
                            }`}
                          >
                            مقطع ردم
                          </button>
                          <button
                            type="button"
                            onClick={() => setCrossSectionPreview('cut')}
                            className={`min-h-[44px] rounded-[12px] border text-xs font-bold transition-colors duration-200 cursor-pointer ${
                              crossSectionPreview === 'cut'
                                ? 'border-[#f59e0b] bg-[#f59e0b]/16 text-[#f59e0b]'
                                : 'border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:text-[#f4f7f2]'
                            }`}
                          >
                            مقطع حفر
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Segment-by-Segment Table with Strictly Isolated RTL/LTR and Single-Line Number+Unit */}
                  <CollapsibleSection
                    title="تفاصيل كل مقطع (Segment-by-Segment)"
                    subtitle="جدول الحجوم التفصيلية ونقاط الانقلاب بين المحطات"
                    badge={`${earthworksResult.segments.length} مقاطع`}
                    icon={<Table2 className="h-4 w-4 text-[#f59e0b]" />}
                  >
                    <div className="overflow-x-auto rounded-[12px] border border-white/[0.08] bg-[#070b09]">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[#0b110d] text-[#b7c9bc] border-b border-white/[0.08]">
                          <tr>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[160px]">المقطع (<bdi dir="ltr">PK</bdi>)</th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[100px]">الطول</th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[110px]">ميل المشروع</th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[120px]">حجم الحفر</th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[120px]">حجم الردم</th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[170px]">ملاحظة ميدانية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] bg-[#0f1612]/90">
                          {earthworksResult.segments.map((seg) => (
                            <tr key={`${seg.fromChainageM}-${seg.toChainageM}`} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-3.5 py-3 font-mono-tabular text-[#f4f7f2] whitespace-nowrap" dir="ltr">
                                <bdi dir="ltr">PK {seg.fromChainageM} → PK {seg.toChainageM}</bdi>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#b7c9bc] whitespace-nowrap">
                                <span className="whitespace-nowrap"><bdi dir="ltr">{seg.lengthM}</bdi> م</span>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#f4f7f2] whitespace-nowrap" dir="ltr">
                                <bdi dir="ltr">{seg.designGradient.slopePercent}%</bdi>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#f59e0b] whitespace-nowrap">
                                <span className="whitespace-nowrap"><bdi dir="ltr">{seg.cutVolumeM3}</bdi> م³</span>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#84cc16] whitespace-nowrap">
                                <span className="whitespace-nowrap"><bdi dir="ltr">{seg.fillVolumeM3}</bdi> م³</span>
                              </td>
                              <td className="px-3.5 py-3 text-[#b7c9bc] whitespace-nowrap">
                                {seg.hasTransitionPoint ? (
                                  <span>نقطة انقلاب عند <bdi dir="ltr">PK {seg.transitionChainageM}</bdi></span>
                                ) : (
                                  <span>{seg.designGradient.directionLabelAr}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CollapsibleSection>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
