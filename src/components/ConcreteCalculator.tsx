import React, { useMemo, useState } from 'react';
import { Box, AlertCircle, SlidersHorizontal, Sparkles, Layers } from 'lucide-react';
import {
  calculateConcreteMix,
  calculateConcreteCostDzd,
  DEFAULT_CONCRETE_PRICES_DZD,
  type ConcreteDosage,
} from '../utils/calculators.engine';
import {
  fromCubicMeters,
  formatEngineeringNumber,
  toMeters,
  type LengthUnit,
  type VolumeUnit,
} from '../utils/units';
import { UnitInputField } from './UnitInputField';
import { ConcreteCadDiagram } from './EngineeringVisuals';
import { TelemetryReadoutStrip, type TelemetryMetricItem } from './TelemetryReadout';
import { LiveResultBanner } from './LiveResultBanner';
import { CollapsibleSection } from './CollapsibleSection';
import { BottomSheet } from './BottomSheet';
import type { SavedBoqItem } from '../types/boq';
import { useI18n } from '../i18n/I18nContext';
import {
  TRANSLATIONS,
  formatCurrencyLocale,
  getInitialLang,
  getUnitDisplay,
} from '../i18n/translations';

interface ConcreteCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const DOSAGE_VALUES: ConcreteDosage[] = [250, 300, 350, 400];

const PRESET_SPECS: {
  id: 'slab' | 'column' | 'beam' | 'footing';
  l: string;
  lu: LengthUnit;
  w: string;
  wu: LengthUnit;
  t: string;
  tu: LengthUnit;
  dosage: ConcreteDosage;
}[] = [
  { id: 'slab', l: '10', lu: 'm', w: '5', wu: 'm', t: '20', tu: 'cm', dosage: 350 },
  { id: 'column', l: '35', lu: 'cm', w: '35', wu: 'cm', t: '3.2', tu: 'm', dosage: 350 },
  { id: 'beam', l: '4.5', lu: 'm', w: '30', wu: 'cm', t: '45', tu: 'cm', dosage: 350 },
  { id: 'footing', l: '150', lu: 'cm', w: '150', wu: 'cm', t: '40', tu: 'cm', dosage: 350 },
];

const DEFAULT_CONCRETE_NAMES = new Set<string>([
  TRANSLATIONS.ar.concrete.defaultElementName,
  TRANSLATIONS.fr.concrete.defaultElementName,
  TRANSLATIONS.en.concrete.defaultElementName,
]);

const CONCRETE_STATE_KEY = 'dz_civil_calc_concrete_state';

export const ConcreteCalculator: React.FC<ConcreteCalculatorProps> = ({ onSaveToBoq }) => {
  const { lang, t } = useI18n();

  const [elementName, setElementName] = useState(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.elementName === 'string' && !DEFAULT_CONCRETE_NAMES.has(parsed.elementName)) {
          return parsed.elementName;
        }
      }
    } catch {}
    return TRANSLATIONS[getInitialLang()].concrete.defaultElementName;
  });

  React.useEffect(() => {
    setElementName((prev: string) => (DEFAULT_CONCRETE_NAMES.has(prev) ? t.concrete.defaultElementName : prev));
  }, [t.concrete.defaultElementName]);

  const [lengthStr, setLengthStr] = useState(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lengthStr === 'string') return parsed.lengthStr;
      }
    } catch {}
    return '10';
  });
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lengthUnit) return parsed.lengthUnit;
      }
    } catch {}
    return 'm';
  });

  const [widthStr, setWidthStr] = useState(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.widthStr === 'string') return parsed.widthStr;
      }
    } catch {}
    return '5';
  });
  const [widthUnit, setWidthUnit] = useState<LengthUnit>(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.widthUnit) return parsed.widthUnit;
      }
    } catch {}
    return 'm';
  });

  const [thicknessStr, setThicknessStr] = useState(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.thicknessStr === 'string') return parsed.thicknessStr;
      }
    } catch {}
    return '20';
  });
  const [thicknessUnit, setThicknessUnit] = useState<LengthUnit>(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.thicknessUnit) return parsed.thicknessUnit;
      }
    } catch {}
    return 'cm';
  });

  const [dosage, setDosage] = useState<ConcreteDosage>(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.dosage === 'number') return parsed.dosage;
      }
    } catch {}
    return 350;
  });
  const [wasteStr, setWasteStr] = useState('5');
  const [outputVolUnit, setOutputVolUnit] = useState<VolumeUnit>('m3');

  const [bagPriceStr, setBagPriceStr] = useState(String(DEFAULT_CONCRETE_PRICES_DZD.cementBag50kg));
  const [sandPriceStr, setSandPriceStr] = useState(String(DEFAULT_CONCRETE_PRICES_DZD.sandM3));
  const [gravelPriceStr, setGravelPriceStr] = useState(String(DEFAULT_CONCRETE_PRICES_DZD.gravelM3));
  const [presetsSheetOpen, setPresetsSheetOpen] = useState(false);

  // Auto-save last entered values in localStorage with try/catch
  React.useEffect(() => {
    try {
      localStorage.setItem(
        CONCRETE_STATE_KEY,
        JSON.stringify({
          elementName,
          lengthStr,
          lengthUnit,
          widthStr,
          widthUnit,
          thicknessStr,
          thicknessUnit,
          dosage,
        })
      );
    } catch {
      // Storage quota fallback
    }
  }, [elementName, lengthStr, lengthUnit, widthStr, widthUnit, thicknessStr, thicknessUnit, dosage]);

  const lengthM = useMemo(() => toMeters(Number(lengthStr), lengthUnit), [lengthStr, lengthUnit]);
  const widthM = useMemo(() => toMeters(Number(widthStr), widthUnit), [widthStr, widthUnit]);
  const thicknessM = useMemo(() => toMeters(Number(thicknessStr), thicknessUnit), [thicknessStr, thicknessUnit]);

  const result = useMemo(() => {
    const parsedWaste = Number(wasteStr);
    return calculateConcreteMix({
      lengthM,
      widthM,
      thicknessM,
      dosageKgPerM3: dosage,
      wastePercent: Number.isFinite(parsedWaste) ? parsedWaste : 0,
    });
  }, [lengthM, widthM, thicknessM, dosage, wasteStr]);

  const estimatedCostDzd = useMemo(() => {
    const bagP = Number(bagPriceStr);
    const sandP = Number(sandPriceStr);
    const gravelP = Number(gravelPriceStr);
    return calculateConcreteCostDzd(result, {
      cementBag50kg: Number.isFinite(bagP) ? bagP : 0,
      sandM3: Number.isFinite(sandP) ? sandP : 0,
      gravelM3: Number.isFinite(gravelP) ? gravelP : 0,
    });
  }, [result, bagPriceStr, sandPriceStr, gravelPriceStr]);

  const applyPreset = (p: (typeof PRESET_SPECS)[number]) => {
    setElementName(t.concrete.presets[p.id].name);
    setLengthStr(p.l);
    setLengthUnit(p.lu);
    setWidthStr(p.w);
    setWidthUnit(p.wu);
    setThicknessStr(p.t);
    setThicknessUnit(p.tu);
    setDosage(p.dosage);
    setPresetsSheetOpen(false);
  };

  const applyAllUnits = (unit: LengthUnit) => {
    setLengthUnit(unit);
    setWidthUnit(unit);
    setThicknessUnit(unit);
    setPresetsSheetOpen(false);
  };

  // Engineering compliance limits per Algerian CBA 93 / RPA
  const engineeringWarnings = useMemo(() => {
    const msgs: string[] = [];
    if (thicknessM > 0 && thicknessM < 0.05) {
      msgs.push(t.concrete.warnThickness);
    }
    if (dosage < 250) {
      msgs.push(t.concrete.warnDosage);
    }
    return msgs;
  }, [thicknessM, dosage, t.concrete.warnThickness, t.concrete.warnDosage]);

  const displayedNetVol = formatEngineeringNumber(fromCubicMeters(result.netVolumeM3, outputVolUnit), 3);
  const displayedGrossVol = formatEngineeringNumber(fromCubicMeters(result.grossVolumeM3, outputVolUnit), 3);

  const m3Symbol = getUnitDisplay(lang, 'm3').symbol;
  const volSymbol = getUnitDisplay(lang, outputVolUnit).symbol;
  const kgSymbol = getUnitDisplay(lang, 'kg').symbol;
  const tonneSymbol = getUnitDisplay(lang, 't').symbol;
  const literSymbol = getUnitDisplay(lang, 'L').symbol;

  const lengthUnitSym = getUnitDisplay(lang, lengthUnit).symbol;
  const widthUnitSym = getUnitDisplay(lang, widthUnit).symbol;
  const thicknessUnitSym = getUnitDisplay(lang, thicknessUnit).symbol;

  const telemetryMetrics: TelemetryMetricItem[] = useMemo(
    () => [
      {
        id: 'conc-net',
        label: t.concrete.metrics.netVol,
        value: displayedNetVol,
        unit: volSymbol,
        accent: 'neutral',
      },
      {
        id: 'conc-gross',
        label: t.concrete.metrics.grossVol,
        value: displayedGrossVol,
        unit: volSymbol,
        accent: 'kiwi',
      },
      {
        id: 'conc-cement',
        label: t.concrete.metrics.cementBags,
        value: result.cementBags50kg,
        unit: t.concrete.metrics.bagUnit,
        subtext: `${result.cementKg} ${kgSymbol}`,
        accent: 'amber',
      },
      {
        id: 'conc-sand',
        label: t.concrete.metrics.sand,
        value: result.sandM3,
        unit: m3Symbol,
        subtext: `${result.sandTonnes} ${tonneSymbol}`,
        accent: 'neutral',
      },
      {
        id: 'conc-gravel',
        label: t.concrete.metrics.gravel,
        value: result.gravelM3,
        unit: m3Symbol,
        subtext: `${result.gravelTonnes} ${tonneSymbol}`,
        accent: 'neutral',
      },
      {
        id: 'conc-water',
        label: t.concrete.metrics.waterTrucks,
        value: result.waterLiters,
        unit: literSymbol,
        subtext: t.concrete.metrics.trucksSub(result.mixTrucks7m3),
        accent: 'neutral',
      },
    ],
    [displayedNetVol, displayedGrossVol, volSymbol, m3Symbol, kgSymbol, tonneSymbol, literSymbol, result, t]
  );

  const handleSave = () => {
    if (!result.valid) return;
    onSaveToBoq({
      id: `conc-${Date.now()}`,
      category: 'concrete',
      categoryLabel: t.concrete.boqCategory,
      title: `${elementName.trim() || t.concrete.defaultElementName} (${dosage} ${t.concrete.dosageUnit})`,
      summary: `${lengthStr}${lengthUnitSym} × ${widthStr}${widthUnitSym} × ${thicknessStr}${thicknessUnitSym} · ${t.concrete.boqSummaryPrefix} ${wasteStr}%`,
      metrics: [
        { label: t.concrete.boqMetrics.totalVol, value: `${result.grossVolumeM3} ${m3Symbol}` },
        { label: t.concrete.boqMetrics.cement, value: `${result.cementBags50kg} ${t.concrete.metrics.bagUnit} (${result.cementKg} ${kgSymbol})` },
        { label: t.concrete.boqMetrics.sand, value: `${result.sandM3} ${m3Symbol} (${result.sandTonnes} ${tonneSymbol})` },
        { label: t.concrete.boqMetrics.gravel, value: `${result.gravelM3} ${m3Symbol} (${result.gravelTonnes} ${tonneSymbol})` },
      ],
      estimatedCostDzd,
      createdAtIso: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Pinned Real-Time Quantity + Cost Summary */}
      {result.valid && (
        <LiveResultBanner
          label={t.concrete.liveLabel(elementName || t.concrete.defaultElementName)}
          primaryValue={`${displayedGrossVol} ${volSymbol}`}
          secondaryDetail={t.concrete.liveSecondary(result.cementBags50kg)}
          costText={formatCurrencyLocale(estimatedCostDzd, lang)}
          copyCostLabel={t.concrete.copyCostLabel}
          onSave={handleSave}
          saveLabel={t.common.saveToBoq}
        />
      )}

      <section aria-labelledby="concrete-calc-heading" className="console-panel overflow-hidden">
        <div className="topographic-scale" aria-hidden="true" />
        <div className="p-4 sm:p-6 space-y-6">
          {/* Clean Header + Single BottomSheet Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16]">
                <Box className="h-5 w-5" />
              </span>
              <div>
                <h2 id="concrete-calc-heading" className="text-lg font-bold text-[#f4f7f2]">
                  {t.concrete.heading}
                </h2>
                <p className="text-xs text-[#b7c9bc]">
                  {t.concrete.subtitlePrefix} <bdi dir="ltr">{dosage} kg/m³</bdi>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPresetsSheetOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/[0.12] bg-[#070b09] px-4 py-2 text-xs font-bold text-[#d9f99d] hover:border-[#84cc16]/50 transition-colors duration-200 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#f59e0b]" />
              <span>{t.concrete.presetsBtn}</span>
            </button>
          </div>

          {/* Core Inputs + Desktop CAD Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
              {/* 2-Column Grid for Ergonomic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <UnitInputField
                  id="conc-length"
                  label={t.concrete.lengthLabel}
                  valueStr={lengthStr}
                  onValueChange={setLengthStr}
                  unit={lengthUnit}
                  onUnitChange={setLengthUnit}
                />
                <UnitInputField
                  id="conc-width"
                  label={t.concrete.widthLabel}
                  valueStr={widthStr}
                  onValueChange={setWidthStr}
                  unit={widthUnit}
                  onUnitChange={setWidthUnit}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <UnitInputField
                  id="conc-thickness"
                  label={t.concrete.thicknessLabel}
                  valueStr={thicknessStr}
                  onValueChange={setThicknessStr}
                  unit={thicknessUnit}
                  onUnitChange={setThicknessUnit}
                />
                <div>
                  <label htmlFor="conc-name-quick" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                    {t.concrete.elementNameQuickLabel}
                  </label>
                  <input
                    id="conc-name-quick"
                    type="text"
                    value={elementName}
                    onChange={(e) => setElementName(e.target.value)}
                    className="w-full min-h-[46px] rounded-[14px] border border-[#24352b] bg-[#070b09] px-3.5 py-2.5 text-sm text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                  />
                </div>
              </div>

              {/* Engineering Warnings per RPA / CBA 93 */}
              {engineeringWarnings.length > 0 && (
                <div className="space-y-1.5">
                  {engineeringWarnings.map((msg, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[12px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-2.5 text-xs text-[#fde68a]">
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Clean Dosage Selector */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-[#b7c9bc]">
                  {t.concrete.dosageLabel} (<bdi dir="ltr">{t.concrete.dosageWord}</bdi>)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DOSAGE_VALUES.map((dVal) => {
                    const active = dosage === dVal;
                    return (
                      <button
                        key={dVal}
                        type="button"
                        onClick={() => setDosage(dVal)}
                        className={`min-h-[54px] rounded-[12px] border px-3 py-2.5 text-start transition-colors duration-200 cursor-pointer ${
                          active
                            ? 'border-[#84cc16] bg-[#84cc16]/14 text-[#f4f7f2]'
                            : 'border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:border-white/20'
                        }`}
                      >
                        <div className={`font-mono-tabular text-sm font-bold ${active ? 'text-[#84cc16]' : 'text-[#f4f7f2]'}`}>
                          <bdi dir="ltr">{dVal} {t.concrete.dosageUnit}</bdi>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#b7c9bc]">{t.concrete.dosages[dVal]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progressive Disclosure: Advanced Options */}
              <CollapsibleSection
                title={t.common.advancedOptions}
                subtitle={t.concrete.advSubtitle}
                badge={t.common.wasteBadge(wasteStr)}
                icon={<SlidersHorizontal className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="conc-name" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      {t.concrete.elementNameFullLabel}
                    </label>
                    <input
                      id="conc-name"
                      type="text"
                      value={elementName}
                      onChange={(e) => setElementName(e.target.value)}
                      className="w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>
                  <div>
                    <label htmlFor="conc-waste" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      {t.concrete.wastePercentLabel}
                    </label>
                    <input
                      id="conc-waste"
                      type="number"
                      min="0"
                      max="30"
                      step="1"
                      value={wasteStr}
                      onChange={(e) => setWasteStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.08] pt-3.5 text-xs">
                  <div>
                    <label htmlFor="price-bag" className="mb-1 block text-[11px] text-[#b7c9bc]">
                      {t.concrete.bagPriceLabel}
                    </label>
                    <input
                      id="price-bag"
                      type="number"
                      min="0"
                      value={bagPriceStr}
                      onChange={(e) => setBagPriceStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>
                  <div>
                    <label htmlFor="price-sand" className="mb-1 block text-[11px] text-[#b7c9bc]">
                      {t.concrete.sandPriceLabel}
                    </label>
                    <input
                      id="price-sand"
                      type="number"
                      min="0"
                      value={sandPriceStr}
                      onChange={(e) => setSandPriceStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>
                  <div>
                    <label htmlFor="price-gravel" className="mb-1 block text-[11px] text-[#b7c9bc]">
                      {t.concrete.gravelPriceLabel}
                    </label>
                    <input
                      id="price-gravel"
                      type="number"
                      min="0"
                      value={gravelPriceStr}
                      onChange={(e) => setGravelPriceStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3 text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            {/* Desktop CAD Schematic */}
            <div className="lg:col-span-5">
              <div className="hidden lg:block">
                <ConcreteCadDiagram
                  lengthLabel={`${lengthStr || 0}${lengthUnitSym}`}
                  widthLabel={`${widthStr || 0}${widthUnitSym}`}
                  thicknessLabel={`${thicknessStr || 0}${thicknessUnitSym}`}
                  dosage={dosage}
                  result={result}
                />
              </div>
              <div className="lg:hidden">
                <CollapsibleSection
                  title={t.concrete.cadMobileTitle}
                  subtitle={t.concrete.cadMobileSub}
                  icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                >
                  <ConcreteCadDiagram
                    lengthLabel={`${lengthStr || 0}${lengthUnitSym}`}
                    widthLabel={`${widthStr || 0}${widthUnitSym}`}
                    thicknessLabel={`${thicknessStr || 0}${thicknessUnitSym}`}
                    dosage={dosage}
                    result={result}
                  />
                </CollapsibleSection>
              </div>
            </div>
          </div>

          {/* Telemetry Readout Strip or Validation Alert */}
          {!result.valid ? (
            <div role="alert" className="flex items-center gap-2 rounded-[14px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
              <span>{t.concrete.invalidInputsError}</span>
            </div>
          ) : (
            <div className="space-y-4 border-t border-white/[0.08] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#d9f99d]">{t.concrete.resultsHeading}</span>
                <div className="flex items-center gap-1 rounded-[12px] bg-[#070b09] p-1 border border-white/[0.08]">
                  {(['m3', 'L'] as VolumeUnit[]).map((vu) => (
                    <button
                      key={vu}
                      type="button"
                      onClick={() => setOutputVolUnit(vu)}
                      className={`min-h-[44px] rounded-[10px] px-3 py-1.5 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                        outputVolUnit === vu ? 'bg-[#84cc16] text-[#060a05]' : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
                      }`}
                    >
                      {vu === 'm3' ? t.concrete.showInM3 : t.concrete.showInLiters}
                    </button>
                  ))}
                </div>
              </div>

              <TelemetryReadoutStrip
                testId="concrete-results"
                items={telemetryMetrics}
                columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
              />

              <button
                type="button"
                onClick={handleSave}
                disabled={!result.valid}
                aria-label={t.common.saveToBoq}
                className="btn-kiwi w-full min-h-[48px] py-3 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-[0.97] shadow-lg cursor-pointer disabled:opacity-40"
              >
                <span>{t.common.saveToBoq}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Sheet: Presets & Quick Unified Units */}
      <BottomSheet
        open={presetsSheetOpen}
        onClose={() => setPresetsSheetOpen(false)}
        title={t.concrete.presetsSheetTitle}
        subtitle={t.concrete.presetsSheetSub}
      >
        <div className="space-y-5">
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[#b7c9bc]">{t.concrete.presetsSectionTitle}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_SPECS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="min-h-[48px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-4 py-2.5 text-start text-xs font-bold text-[#d9f99d] hover:border-[#84cc16]/60 transition-colors duration-200 cursor-pointer"
                >
                  <bdi dir="ltr">{t.concrete.presets[p.id].label}</bdi>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/[0.08] pt-4">
            <div className="text-xs font-bold text-[#b7c9bc]">{t.concrete.unifyUnitsTitle}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['m', 'cm', 'mm', 'ft'] as LengthUnit[]).map((u) => {
                const disp = getUnitDisplay(lang, u);
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => applyAllUnits(u)}
                    className="min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-3 py-2 text-xs font-bold text-[#f59e0b] hover:border-[#84cc16]/60 hover:text-[#84cc16] transition-colors duration-200 cursor-pointer"
                  >
                    {disp.name} (<bdi dir="ltr">{disp.symbol}</bdi>)
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
