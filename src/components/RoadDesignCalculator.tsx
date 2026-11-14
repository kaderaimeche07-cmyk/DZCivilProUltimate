import React, { useEffect, useMemo, useState } from 'react';
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
  type RoadStationPoint,
} from '../utils/calculators.engine';
import { LENGTH_UNITS, toMeters, type LengthUnit } from '../utils/units';
import { UnitInputField } from './UnitInputField';
import { RoadSlopeCadDiagram, RoadCrossSectionDiagram } from './EngineeringVisuals';
import { TelemetryReadoutStrip, type TelemetryMetricItem } from './TelemetryReadout';
import { LiveResultBanner } from './LiveResultBanner';
import { CollapsibleSection } from './CollapsibleSection';
import type { SavedBoqItem } from '../types/boq';
import { useI18n } from '../i18n/I18nContext';
import {
  TRANSLATIONS,
  formatCurrencyLocale,
  getInitialLang,
  getUnitDisplay,
} from '../i18n/translations';

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

const DEFAULT_PROJECT_TITLES = new Set<string>([
  TRANSLATIONS.ar.roads.earthworks.defaultProjectTitle,
  TRANSLATIONS.fr.roads.earthworks.defaultProjectTitle,
  TRANSLATIONS.en.roads.earthworks.defaultProjectTitle,
]);

type RoadSubMode = 'gradient' | 'earthworks';

export const RoadDesignCalculator: React.FC<RoadDesignCalculatorProps> = ({ onSaveToBoq }) => {
  const { lang, t } = useI18n();
  const mSym = getUnitDisplay(lang, 'm').symbol;
  const m3Sym = getUnitDisplay(lang, 'm3').symbol;

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
  const [projectTitle, setProjectTitle] = useState(
    () => TRANSLATIONS[getInitialLang()].roads.earthworks.defaultProjectTitle
  );
  const [roadWidthStr, setRoadWidthStr] = useState('9.0');
  const [roadWidthUnit, setRoadWidthUnit] = useState<LengthUnit>('m');
  const [sideSlopeStr, setSideSlopeStr] = useState('1.5');
  const [swellFactorStr, setSwellFactorStr] = useState('1.20');
  const [stations, setStations] = useState<RoadStationPoint[]>(DEFAULT_STATIONS);
  const [crossSectionPreview, setCrossSectionPreview] = useState<'cut' | 'fill'>('fill');

  useEffect(() => {
    setProjectTitle((prev) =>
      DEFAULT_PROJECT_TITLES.has(prev) ? t.roads.earthworks.defaultProjectTitle : prev
    );
  }, [t.roads.earthworks.defaultProjectTitle]);

  const startChainageM = toMeters(Number(startPkStr), startPkUnit);
  const startElevationM = toMeters(Number(startZStr), startZUnit);
  const endChainageM = toMeters(Number(endPkStr), endPkUnit);
  const endElevationM = toMeters(Number(endZStr), endZUnit);

  const gradientResult = useMemo(() => {
    return calculateRoadGradient({
      startChainageM,
      startElevationM,
      endChainageM,
      endElevationM,
    });
  }, [startChainageM, startElevationM, endChainageM, endElevationM]);

  const localizedGradientError = useMemo(() => {
    if (gradientResult.valid) return '';
    if (
      !Number.isFinite(startChainageM) ||
      !Number.isFinite(startElevationM) ||
      !Number.isFinite(endChainageM) ||
      !Number.isFinite(endElevationM)
    ) {
      return t.roads.gradient.errorNumeric;
    }
    return t.roads.gradient.errorDistance;
  }, [
    gradientResult.valid,
    startChainageM,
    startElevationM,
    endChainageM,
    endElevationM,
    t.roads.gradient,
  ]);

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

  const localizedEarthworksError = useMemo(() => {
    if (earthworksResult.valid) return '';
    const slopeNum = Number(sideSlopeStr);
    if (!Number.isFinite(roadWidthM) || roadWidthM <= 0) {
      return t.roads.earthworks.errors.width;
    }
    if (!Number.isFinite(slopeNum) || slopeNum < 0) {
      return t.roads.earthworks.errors.talus;
    }
    if (stations.length < 2) {
      return t.roads.earthworks.errors.minStations;
    }
    const allFinite = stations.every(
      (s) =>
        Number.isFinite(s.chainageM) &&
        Number.isFinite(s.groundElevM) &&
        Number.isFinite(s.designElevM)
    );
    if (!allFinite) {
      return t.roads.earthworks.errors.invalidStation;
    }
    return t.roads.earthworks.errors.increasingPk;
  }, [earthworksResult.valid, roadWidthM, sideSlopeStr, stations, t.roads.earthworks.errors]);

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

    const directionLabel = t.roads.gradient.directions[gradientResult.direction];
    const ratioText =
      gradientResult.direction === 'palier'
        ? t.roads.gradient.ratioFlat
        : gradientResult.slopeRatioText;

    return [
      {
        id: 'grad-slope',
        label: t.roads.gradient.metrics.slope,
        value: `${gradientResult.slopePercent}%`,
        subtext: directionLabel,
        accent: 'kiwi',
        dir: 'ltr',
        icon: slopeIcon,
      },
      {
        id: 'grad-angle',
        label: t.roads.gradient.metrics.angleRatio,
        value: `${gradientResult.slopeAngleDeg}°`,
        subtext: ratioText,
        accent: 'neutral',
        dir: 'ltr',
      },
      {
        id: 'grad-dl',
        label: t.roads.gradient.metrics.horizDist,
        value: gradientResult.horizontalDistanceM,
        unit: mSym,
        accent: 'neutral',
      },
      {
        id: 'grad-dz',
        label: t.roads.gradient.metrics.elevDiff,
        value: `${gradientResult.elevationDiffM > 0 ? `+${gradientResult.elevationDiffM}` : gradientResult.elevationDiffM} m`,
        accent: 'amber',
        dir: 'ltr',
      },
      {
        id: 'grad-dist',
        label: t.roads.gradient.metrics.slopeDist,
        value: gradientResult.slopeDistanceM,
        unit: mSym,
        accent: 'neutral',
      },
    ];
  }, [gradientResult, t.roads.gradient, mSym]);

  const earthworksTelemetry: TelemetryMetricItem[] = useMemo(() => {
    if (!earthworksResult.valid) return [];
    return [
      {
        id: 'earth-len',
        label: t.roads.earthworks.metrics.lengthMaxSlope,
        value: earthworksResult.totalLengthM,
        unit: mSym,
        subtext: t.roads.earthworks.metrics.maxSlopeSub(earthworksResult.maxAbsGradientPercent),
        accent: 'neutral',
      },
      {
        id: 'earth-cut',
        label: t.roads.earthworks.metrics.totalCut,
        value: earthworksResult.totalCutVolumeM3,
        unit: m3Sym,
        subtext: t.roads.earthworks.metrics.swelledSub(earthworksResult.swelledCutVolumeM3),
        accent: 'amber',
      },
      {
        id: 'earth-fill',
        label: t.roads.earthworks.metrics.totalFill,
        value: earthworksResult.totalFillVolumeM3,
        unit: m3Sym,
        accent: 'kiwi',
      },
      {
        id: 'earth-bal',
        label: t.roads.earthworks.metrics.netBalance,
        value: `${earthworksResult.netEarthBalanceM3 > 0 ? `+${earthworksResult.netEarthBalanceM3}` : earthworksResult.netEarthBalanceM3} m³`,
        subtext:
          earthworksResult.netEarthBalanceM3 >= 0
            ? t.roads.earthworks.metrics.surplusSub
            : t.roads.earthworks.metrics.deficitSub,
        accent: earthworksResult.netEarthBalanceM3 >= 0 ? 'amber' : 'kiwi',
        dir: 'ltr',
      },
      {
        id: 'earth-trucks',
        label: t.roads.earthworks.metrics.trucks,
        value: earthworksResult.truckTrips15m3,
        unit: t.roads.earthworks.metrics.tripUnit,
        accent: 'neutral',
      },
    ];
  }, [earthworksResult, t.roads.earthworks.metrics, mSym, m3Sym]);

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
        ? t.roads.earthworks.boqSurplus(earthworksResult.netEarthBalanceM3)
        : t.roads.earthworks.boqDeficit(earthworksResult.netEarthBalanceM3);
    const safeWidth = Number.isFinite(roadWidthM) ? roadWidthM.toFixed(2) : '0.00';

    onSaveToBoq({
      id: `road-${Date.now()}`,
      category: 'roads',
      categoryLabel: t.roads.earthworks.boqCategory,
      title: projectTitle.trim() || t.roads.earthworks.defaultProjectTitle,
      summary: t.roads.earthworks.boqSummary(
        earthworksResult.totalLengthM,
        safeWidth,
        earthworksResult.maxAbsGradientPercent
      ),
      metrics: [
        {
          label: t.roads.earthworks.boqMetrics.cut,
          value: `${earthworksResult.totalCutVolumeM3} ${m3Sym}`,
        },
        {
          label: t.roads.earthworks.boqMetrics.fill,
          value: `${earthworksResult.totalFillVolumeM3} ${m3Sym}`,
        },
        { label: t.roads.earthworks.boqMetrics.balance, value: balanceText },
        {
          label: t.roads.earthworks.boqMetrics.trucks,
          value: `${earthworksResult.truckTrips15m3} ${t.roads.earthworks.metrics.tripUnit}`,
        },
      ],
      estimatedCostDzd: estimatedEarthworksDzd,
      createdAtIso: new Date().toISOString(),
    });
  };

  const profileSvg = useMemo(() => {
    if (stations.length < 2) return null;
    const finiteStations = stations.every(
      (s) =>
        Number.isFinite(s.chainageM) &&
        Number.isFinite(s.groundElevM) &&
        Number.isFinite(s.designElevM)
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

    const groundPoints = sorted
      .map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.groundElevM).toFixed(1)}`)
      .join(' ');
    const designPoints = sorted
      .map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.designElevM).toFixed(1)}`)
      .join(' ');

    const areaBetweenPoints = [
      ...sorted.map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.designElevM).toFixed(1)}`),
      ...[...sorted]
        .reverse()
        .map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.groundElevM).toFixed(1)}`),
    ].join(' ');

    return { sorted, w, h, toX, toY, groundPoints, designPoints, areaBetweenPoints };
  }, [stations]);

  const complianceColor =
    gradientResult.compliance === 'OPTIMAL_HIGHWAY' ||
    gradientResult.compliance === 'ACCEPTABLE_REGIONAL'
      ? 'text-[#84cc16] border-[#84cc16]/40 bg-[#84cc16]/10'
      : 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10';

  const complianceCopy = t.roads.gradient.compliance[gradientResult.compliance];

  return (
    <div className="space-y-5">
      {/* Focused Segmented Switcher for Roads Workspace */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={t.roads.tablistAria}
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
            {t.roads.tabGradient} (<bdi dir="ltr">Pente</bdi>)
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
            {t.roads.tabEarthworks} (<bdi dir="ltr">Profil en Long</bdi>)
          </button>
        </div>

        <span className="text-xs text-[#b7c9bc]">
          {t.roads.standardBadgePrefix} <bdi dir="ltr">B40</bdi>
        </span>
      </div>

      {/* MODE 1: GRADIENT ANALYZER */}
      {roadMode === 'gradient' && (
        <div className="space-y-4">
          {gradientResult.valid && (
            <LiveResultBanner
              label={t.roads.gradient.liveLabel}
              primaryValue={`${gradientResult.slopePercent}% (${t.roads.gradient.directions[gradientResult.direction]})`}
              secondaryDetail={`ΔL = ${gradientResult.horizontalDistanceM} ${mSym}`}
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
                    {t.roads.gradient.heading} (<bdi dir="ltr">Pente / Rampe</bdi>)
                  </h2>
                  <p className="text-xs text-[#b7c9bc]">
                    {t.roads.gradient.subtitlePrefix} (<bdi dir="ltr">PK &amp; Z</bdi> · <bdi dir="ltr">B40</bdi>)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UnitInputField
                      id="grad-start-pk"
                      label={t.roads.gradient.startPk}
                      valueStr={startPkStr}
                      onValueChange={setStartPkStr}
                      unit={startPkUnit}
                      onUnitChange={setStartPkUnit}
                      units={PK_UNITS}
                      min="-100000"
                    />
                    <UnitInputField
                      id="grad-start-z"
                      label={t.roads.gradient.startZ}
                      valueStr={startZStr}
                      onValueChange={setStartZStr}
                      unit={startZUnit}
                      onUnitChange={setStartZUnit}
                      units={PK_UNITS}
                      min="-500"
                    />
                    <UnitInputField
                      id="grad-end-pk"
                      label={t.roads.gradient.endPk}
                      valueStr={endPkStr}
                      onValueChange={setEndPkStr}
                      unit={endPkUnit}
                      onUnitChange={setEndPkUnit}
                      units={PK_UNITS}
                      min="-100000"
                    />
                    <UnitInputField
                      id="grad-end-z"
                      label={t.roads.gradient.endZ}
                      valueStr={endZStr}
                      onValueChange={setEndZStr}
                      unit={endZUnit}
                      onUnitChange={setEndZUnit}
                      units={PK_UNITS}
                      min="-500"
                    />
                  </div>

                  {!gradientResult.valid ? (
                    <div
                      role="alert"
                      className="flex items-center gap-2 rounded-[14px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                      <span>{localizedGradientError}</span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-start gap-3 rounded-[14px] border p-3.5 text-xs transition-colors duration-200 ${complianceColor}`}
                    >
                      {gradientResult.compliance === 'OPTIMAL_HIGHWAY' ||
                      gradientResult.compliance === 'ACCEPTABLE_REGIONAL' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-bold">{complianceCopy.label}</div>
                        <div className="text-[#d4e2d7]">{complianceCopy.rec}</div>
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
                      title={t.roads.gradient.cadMobileTitle}
                      subtitle={t.roads.gradient.cadMobileSub}
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
              label={t.roads.earthworks.liveLabel(earthworksResult.totalLengthM)}
              primaryValue={t.roads.earthworks.liveCut(earthworksResult.totalCutVolumeM3)}
              secondaryDetail={t.roads.earthworks.liveFill(earthworksResult.totalFillVolumeM3)}
              costText={formatCurrencyLocale(estimatedEarthworksDzd, lang)}
              copyCostLabel={t.roads.earthworks.copyCostLabel}
              onSave={handleSaveEarthworks}
            />
          )}

          <section aria-labelledby="road-earthworks-heading" className="console-panel overflow-hidden">
            <div className="topographic-scale" aria-hidden="true" />
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h2 id="road-earthworks-heading" className="text-lg font-bold text-[#f4f7f2]">
                    {t.roads.earthworks.heading} (<bdi dir="ltr">Déblais / Remblais</bdi>)
                  </h2>
                  <p className="text-xs text-[#b7c9bc]">
                    {t.roads.earthworks.subtitlePrefix} (<bdi dir="ltr">TN / Projet</bdi>)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStation}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#84cc16]/45 bg-[#84cc16]/14 px-4 py-2 text-xs font-bold text-[#a3e635] hover:bg-[#84cc16]/24 transition-colors duration-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {t.roads.earthworks.addStationBtn} (<bdi dir="ltr">PK</bdi>)
                  </span>
                </button>
              </div>

              {/* Essential Width + Quick Advanced Options */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-4">
                  <UnitInputField
                    id="road-width"
                    label={t.roads.earthworks.roadWidthLabel}
                    valueStr={roadWidthStr}
                    onValueChange={setRoadWidthStr}
                    unit={roadWidthUnit}
                    onUnitChange={setRoadWidthUnit}
                  />
                </div>
                <div className="lg:col-span-8">
                  <CollapsibleSection
                    title={t.roads.earthworks.advTitle}
                    subtitle={t.roads.earthworks.advSub}
                    badge={t.roads.earthworks.advBadge(sideSlopeStr, swellFactorStr)}
                    icon={<SlidersHorizontal className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label htmlFor="road-proj-name" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                          {t.roads.earthworks.projectNameLabel}
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
                          {t.roads.earthworks.talusLabel} <bdi dir="ltr">(H:V)</bdi>
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
                          {t.roads.earthworks.swellLabel}
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
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#0b110d] text-[#b7c9bc] border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[120px]">
                        {t.roads.earthworks.table.station} <bdi dir="ltr">PK</bdi> ({mSym})
                      </th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[130px]">
                        {t.roads.earthworks.table.ground} <bdi dir="ltr">TN</bdi> ({mSym})
                      </th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[130px]">
                        {t.roads.earthworks.table.design} <bdi dir="ltr">Projet</bdi> ({mSym})
                      </th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[130px]">
                        {t.roads.earthworks.table.status}
                      </th>
                      <th className="px-3 py-3 font-semibold text-center whitespace-nowrap w-14">
                        {t.roads.earthworks.table.del}
                      </th>
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
                              aria-label={t.roads.earthworks.table.pkAria(idx + 1)}
                              value={st.chainageM}
                              onChange={(e) => updateStation(st.id, 'chainageM', e.target.value)}
                              className="font-mono-tabular w-24 min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-2.5 py-1 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              aria-label={t.roads.earthworks.table.groundAria(idx + 1)}
                              value={st.groundElevM}
                              onChange={(e) => updateStation(st.id, 'groundElevM', e.target.value)}
                              className="font-mono-tabular w-24 sm:w-28 min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-2.5 py-1 text-[#f4f7f2] outline-none focus:border-[#f59e0b]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              aria-label={t.roads.earthworks.table.designAria(idx + 1)}
                              value={st.designElevM}
                              onChange={(e) => updateStation(st.id, 'designElevM', e.target.value)}
                              className="font-mono-tabular w-24 sm:w-28 min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-2.5 py-1 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono-tabular font-semibold whitespace-nowrap">
                            {isCut ? (
                              <span className="text-[#f59e0b] whitespace-nowrap">
                                {t.roads.earthworks.table.cutTag} <bdi dir="ltr">{Math.abs(diff)}</bdi> {mSym}
                              </span>
                            ) : isFill ? (
                              <span className="text-[#84cc16] whitespace-nowrap">
                                {t.roads.earthworks.table.fillTag} <bdi dir="ltr">+{diff}</bdi> {mSym}
                              </span>
                            ) : (
                              <span className="text-[#b7c9bc] whitespace-nowrap">
                                {t.roads.earthworks.table.matchTag}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeStation(st.id)}
                              disabled={stations.length <= 2}
                              aria-label={t.roads.earthworks.table.delAria(idx + 1)}
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
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-[14px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                  <span>{localizedEarthworksError}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <TelemetryReadoutStrip
                    testId="road-earthworks-results"
                    items={earthworksTelemetry}
                    columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  />

                  <CollapsibleSection
                    title={t.roads.earthworks.sectionsTitle}
                    subtitle={t.roads.earthworks.sectionsSub}
                    icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      {profileSvg && (
                        <div className="lg:col-span-8 blueprint-cad-frame overflow-hidden border border-[#84cc16]/25 flex flex-col justify-between">
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-[#d9f99d]">
                                {t.roads.earthworks.longProfileTitle} (<bdi dir="ltr">Profil en Long</bdi>)
                              </span>
                              <div className="flex items-center gap-4 text-[11px] text-[#b7c9bc]">
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block h-0.5 w-4 bg-[#f59e0b]" />
                                  <span>
                                    {t.roads.earthworks.groundLegend} (<bdi dir="ltr">TN</bdi>)
                                  </span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block h-0.5 w-4 bg-[#84cc16]" />
                                  <span>
                                    {t.roads.earthworks.designLegend} (<bdi dir="ltr">Projet</bdi>)
                                  </span>
                                </span>
                              </div>
                            </div>
                            <svg
                              viewBox={`0 0 ${profileSvg.w} ${profileSvg.h}`}
                              className="w-full h-44 overflow-visible"
                              role="img"
                              aria-label={t.roads.earthworks.longProfileAria}
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
                                    <line
                                      x1={cx}
                                      x2={cx}
                                      y1={cyGround}
                                      y2={cyDesign}
                                      stroke="rgba(255,255,255,0.22)"
                                      strokeWidth="1"
                                    />
                                    <circle cx={cx} cy={cyGround} r="4" fill="#f59e0b" />
                                    <circle cx={cx} cy={cyDesign} r="4.5" fill="#ea580c" />
                                    <text
                                      x={cx}
                                      y={profileSvg.h - 4}
                                      textAnchor="middle"
                                      fill="#b7c9bc"
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
                        </div>
                      )}

                      <div className="lg:col-span-4 space-y-2.5 flex flex-col justify-between">
                        <RoadCrossSectionDiagram
                          roadWidthM={
                            Number.isFinite(roadWidthM) && roadWidthM > 0
                              ? Number(roadWidthM.toFixed(2))
                              : 9
                          }
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
                            {t.roads.earthworks.fillSectionBtn}
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
                            {t.roads.earthworks.cutSectionBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Segment-by-Segment Table with Strictly Isolated RTL/LTR and Single-Line Number+Unit */}
                  <CollapsibleSection
                    title={t.roads.earthworks.segmentsTitle}
                    subtitle={t.roads.earthworks.segmentsSub}
                    badge={t.roads.earthworks.segmentsBadge(earthworksResult.segments.length)}
                    icon={<Table2 className="h-4 w-4 text-[#f59e0b]" />}
                  >
                    <div className="overflow-x-auto rounded-[12px] border border-white/[0.08] bg-[#070b09]">
                      <table className="w-full text-start text-xs">
                        <thead className="bg-[#0b110d] text-[#b7c9bc] border-b border-white/[0.08]">
                          <tr>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[160px]">
                              {t.roads.earthworks.segTable.segment} (<bdi dir="ltr">PK</bdi>)
                            </th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[100px]">
                              {t.roads.earthworks.segTable.length}
                            </th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[110px]">
                              {t.roads.earthworks.segTable.slope}
                            </th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[120px]">
                              {t.roads.earthworks.segTable.cutVol}
                            </th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[120px]">
                              {t.roads.earthworks.segTable.fillVol}
                            </th>
                            <th className="px-3.5 py-3 font-semibold whitespace-nowrap min-w-[170px]">
                              {t.roads.earthworks.segTable.note}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] bg-[#0f1612]/90">
                          {earthworksResult.segments.map((seg) => (
                            <tr
                              key={`${seg.fromChainageM}-${seg.toChainageM}`}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-3.5 py-3 font-mono-tabular text-[#f4f7f2] whitespace-nowrap" dir="ltr">
                                <bdi dir="ltr">
                                  PK {seg.fromChainageM} → PK {seg.toChainageM}
                                </bdi>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#b7c9bc] whitespace-nowrap">
                                <span className="whitespace-nowrap">
                                  <bdi dir="ltr">{seg.lengthM}</bdi> {mSym}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#f4f7f2] whitespace-nowrap" dir="ltr">
                                <bdi dir="ltr">{seg.designGradient.slopePercent}%</bdi>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#f59e0b] whitespace-nowrap">
                                <span className="whitespace-nowrap">
                                  <bdi dir="ltr">{seg.cutVolumeM3}</bdi> {m3Sym}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 font-mono-tabular text-[#84cc16] whitespace-nowrap">
                                <span className="whitespace-nowrap">
                                  <bdi dir="ltr">{seg.fillVolumeM3}</bdi> {m3Sym}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-[#b7c9bc] whitespace-nowrap">
                                {seg.hasTransitionPoint ? (
                                  <span>
                                    {t.roads.earthworks.segTable.transitionAt}{' '}
                                    <bdi dir="ltr">PK {seg.transitionChainageM}</bdi>
                                  </span>
                                ) : (
                                  <span>{t.roads.gradient.directions[seg.designGradient.direction]}</span>
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

