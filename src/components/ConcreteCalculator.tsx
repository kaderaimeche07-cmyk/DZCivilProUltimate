import React, { useMemo, useState } from 'react';
import { Box, AlertCircle, SlidersHorizontal, Sparkles, Layers } from 'lucide-react';
import {
  calculateConcreteMix,
  calculateConcreteCostDzd,
  DEFAULT_CONCRETE_PRICES_DZD,
  formatDzd,
  type ConcreteDosage,
} from '../utils/calculators.engine';
import {
  LENGTH_UNITS,
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

interface ConcreteCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const DOSAGES: { value: ConcreteDosage; label: string; useCase: string }[] = [
  { value: 250, label: '250 كغ/م³', useCase: 'نظافة' },
  { value: 300, label: '300 كغ/م³', useCase: 'دكة أرضية' },
  { value: 350, label: '350 كغ/م³', useCase: 'مسلحة قياسية' },
  { value: 400, label: '400 كغ/م³', useCase: 'أعمدة ومنشآت' },
];

const PRESETS: {
  id: string;
  label: string;
  name: string;
  l: string;
  lu: LengthUnit;
  w: string;
  wu: LengthUnit;
  t: string;
  tu: LengthUnit;
  dosage: ConcreteDosage;
}[] = [
  { id: 'slab', label: 'بلاطة أرضية (10×5م)', name: 'بلاطة أرضية خرسانية', l: '10', lu: 'm', w: '5', wu: 'm', t: '20', tu: 'cm', dosage: 350 },
  { id: 'column', label: 'عمود (Poteau 35×35)', name: 'عمود خرساني 35×35 سم', l: '35', lu: 'cm', w: '35', wu: 'cm', t: '3.2', tu: 'm', dosage: 350 },
  { id: 'beam', label: 'كمرة (Poutre 30×45)', name: 'كمرة رئيسية 30×45 سم', l: '4.5', lu: 'm', w: '30', wu: 'cm', t: '45', tu: 'cm', dosage: 350 },
  { id: 'footing', label: 'أساس (Semelle 1.5×1.5)', name: 'أساس منفرد 1.5×1.5 م', l: '150', lu: 'cm', w: '150', wu: 'cm', t: '40', tu: 'cm', dosage: 350 },
];

const CONCRETE_STATE_KEY = 'dz_civil_calc_concrete_state';

export const ConcreteCalculator: React.FC<ConcreteCalculatorProps> = ({ onSaveToBoq }) => {
  const [elementName, setElementName] = useState(() => {
    try {
      const saved = localStorage.getItem(CONCRETE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.elementName === 'string') return parsed.elementName;
      }
    } catch {}
    return 'بلاطة أرضية خرسانية';
  });

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

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setElementName(p.name);
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
      msgs.push('تنبيه هندسي (CBA 93): سمك الخرسانة أقل من 5 سم غير مطابق للبلاطات المسلحة الحاملة.');
    }
    if (dosage < 250) {
      msgs.push('تنبيه (CBA 93): عيار أقل من 250 كغ/م³ يُعتبر خرسانة نظافة فقط وغير معتمد للمنشآت الحاملة.');
    }
    return msgs;
  }, [thicknessM, dosage]);

  const displayedNetVol = formatEngineeringNumber(fromCubicMeters(result.netVolumeM3, outputVolUnit), 3);
  const displayedGrossVol = formatEngineeringNumber(fromCubicMeters(result.grossVolumeM3, outputVolUnit), 3);
  const volSymbol = outputVolUnit === 'm3' ? 'م³' : 'لتر';

  const telemetryMetrics: TelemetryMetricItem[] = useMemo(
    () => [
      {
        id: 'conc-net',
        label: 'الحجم الصافي',
        value: displayedNetVol,
        unit: volSymbol,
        accent: 'neutral',
      },
      {
        id: 'conc-gross',
        label: 'الحجم مع الهدر',
        value: displayedGrossVol,
        unit: volSymbol,
        accent: 'kiwi',
      },
      {
        id: 'conc-cement',
        label: 'أكياس الإسمنت (50 كغ)',
        value: result.cementBags50kg,
        unit: 'كيس',
        subtext: `${result.cementKg} كغ`,
        accent: 'amber',
      },
      {
        id: 'conc-sand',
        label: 'رمل البناء (0/3)',
        value: result.sandM3,
        unit: 'م³',
        subtext: `${result.sandTonnes} طن`,
        accent: 'neutral',
      },
      {
        id: 'conc-gravel',
        label: 'حصى (8/15 و 15/25)',
        value: result.gravelM3,
        unit: 'م³',
        subtext: `${result.gravelTonnes} طن`,
        accent: 'neutral',
      },
      {
        id: 'conc-water',
        label: 'ماء الخلط / خلاطات',
        value: result.waterLiters,
        unit: 'لتر',
        subtext: `${result.mixTrucks7m3} شاحنة (7م³)`,
        accent: 'neutral',
      },
    ],
    [displayedNetVol, displayedGrossVol, volSymbol, result]
  );

  const handleSave = () => {
    if (!result.valid) return;
    onSaveToBoq({
      id: `conc-${Date.now()}`,
      category: 'concrete',
      categoryLabel: 'الخرسانة',
      title: `${elementName.trim() || 'عنصر خرساني'} (${dosage} كغ/م³)`,
      summary: `${lengthStr}${LENGTH_UNITS[lengthUnit].symbol} × ${widthStr}${LENGTH_UNITS[widthUnit].symbol} × ${thicknessStr}${LENGTH_UNITS[thicknessUnit].symbol} · هدر ${wasteStr}%`,
      metrics: [
        { label: 'الحجم الإجمالي', value: `${result.grossVolumeM3} م³` },
        { label: 'الإسمنت (50 كغ)', value: `${result.cementBags50kg} كيس (${result.cementKg} كغ)` },
        { label: 'الرمل (0/3)', value: `${result.sandM3} م³ (${result.sandTonnes} طن)` },
        { label: 'الحصى (8/15-15/25)', value: `${result.gravelM3} م³ (${result.gravelTonnes} طن)` },
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
          label={`النتيجة الفورية · ${elementName}`}
          primaryValue={`${displayedGrossVol} ${volSymbol}`}
          secondaryDetail={`${result.cementBags50kg} كيس إسمنت`}
          costText={formatDzd(estimatedCostDzd)}
          copyCostLabel="نسخ التكلفة بالدينار"
          onSave={handleSave}
          saveLabel="+ حفظ في المقايسة"
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
                  حاسبة الخرسانة والخلطة
                </h2>
                <p className="text-xs text-[#b7c9bc]">
                  أدخل الأبعاد بأي وحدة (م، سم، ملم، قدم) — عيار <bdi dir="ltr">{dosage} kg/m³</bdi>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPresetsSheetOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/[0.12] bg-[#070b09] px-4 py-2 text-xs font-bold text-[#d9f99d] hover:border-[#84cc16]/50 transition-colors duration-200 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#f59e0b]" />
              <span>قوالب ووحدات سريعة</span>
            </button>
          </div>

          {/* Core Inputs + Desktop CAD Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
              {/* 2-Column Grid for Ergonomic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <UnitInputField
                  id="conc-length"
                  label="الطول (L)"
                  valueStr={lengthStr}
                  onValueChange={setLengthStr}
                  unit={lengthUnit}
                  onUnitChange={setLengthUnit}
                />
                <UnitInputField
                  id="conc-width"
                  label="العرض (W)"
                  valueStr={widthStr}
                  onValueChange={setWidthStr}
                  unit={widthUnit}
                  onUnitChange={setWidthUnit}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <UnitInputField
                  id="conc-thickness"
                  label="السمك / الارتفاع (H)"
                  valueStr={thicknessStr}
                  onValueChange={setThicknessStr}
                  unit={thicknessUnit}
                  onUnitChange={setThicknessUnit}
                />
                <div>
                  <label htmlFor="conc-name-quick" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                    اسم العنصر
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
                  عيار الإسمنت (<bdi dir="ltr">Dosage</bdi>)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DOSAGES.map((d) => {
                    const active = dosage === d.value;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDosage(d.value)}
                        className={`min-h-[54px] rounded-[12px] border px-3 py-2.5 text-right transition-colors duration-200 cursor-pointer ${
                          active
                            ? 'border-[#84cc16] bg-[#84cc16]/14 text-[#f4f7f2]'
                            : 'border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:border-white/20'
                        }`}
                      >
                        <div className={`font-mono-tabular text-sm font-bold ${active ? 'text-[#84cc16]' : 'text-[#f4f7f2]'}`}>
                          <bdi dir="ltr">{d.label}</bdi>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#b7c9bc]">{d.useCase}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progressive Disclosure: Advanced Options */}
              <CollapsibleSection
                title="خيارات متقدمة"
                subtitle="تسمية العنصر، نسبة الهدر، وأسعار المواد بالورشة (دج)"
                badge={`هدر ${wasteStr}%`}
                icon={<SlidersHorizontal className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="conc-name" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      اسم العنصر الإنشائي
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
                      نسبة الهدر (%)
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
                      كيس إسمنت 50 كغ (دج)
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
                      م³ رمل (دج)
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
                      م³ حصى (دج)
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
                  lengthLabel={`${lengthStr || 0}${LENGTH_UNITS[lengthUnit].symbol}`}
                  widthLabel={`${widthStr || 0}${LENGTH_UNITS[widthUnit].symbol}`}
                  thicknessLabel={`${thicknessStr || 0}${LENGTH_UNITS[thicknessUnit].symbol}`}
                  dosage={dosage}
                  result={result}
                />
              </div>
              <div className="lg:hidden">
                <CollapsibleSection
                  title="المخطط الهندسي التفاعلي (3D)"
                  subtitle="معاينة الأبعاد ونسب توزيع الخلطة"
                  icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                >
                  <ConcreteCadDiagram
                    lengthLabel={`${lengthStr || 0}${LENGTH_UNITS[lengthUnit].symbol}`}
                    widthLabel={`${widthStr || 0}${LENGTH_UNITS[widthUnit].symbol}`}
                    thicknessLabel={`${thicknessStr || 0}${LENGTH_UNITS[thicknessUnit].symbol}`}
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
              <span>{result.error}</span>
            </div>
          ) : (
            <div className="space-y-4 border-t border-white/[0.08] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#d9f99d]">تفاصيل الكميات ومواد الخلطة</span>
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
                      {vu === 'm3' ? 'عرض بـ م³' : 'عرض باللتر'}
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
                aria-label="+ حفظ في المقايسة"
                className="btn-kiwi w-full min-h-[48px] py-3 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-[0.97] shadow-lg cursor-pointer disabled:opacity-40"
              >
                <span>+ حفظ في المقايسة</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Sheet: Presets & Quick Unified Units */}
      <BottomSheet
        open={presetsSheetOpen}
        onClose={() => setPresetsSheetOpen(false)}
        title="قوالب جاهزة ووحدات موحدة"
        subtitle="اختر عنصراً قياسياً أو وحّد وحدة الإدخال بضغطة واحدة"
      >
        <div className="space-y-5">
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[#b7c9bc]">عناصر إنشائية قياسية</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="min-h-[48px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-4 py-2.5 text-right text-xs font-bold text-[#d9f99d] hover:border-[#84cc16]/60 transition-colors duration-200 cursor-pointer"
                >
                  <bdi dir="ltr">{p.label}</bdi>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/[0.08] pt-4">
            <div className="text-xs font-bold text-[#b7c9bc]">توحيد وحدة جميع الأبعاد</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['m', 'cm', 'mm', 'ft'] as LengthUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => applyAllUnits(u)}
                  className="min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-3 py-2 text-xs font-bold text-[#f59e0b] hover:border-[#84cc16]/60 hover:text-[#84cc16] transition-colors duration-200 cursor-pointer"
                >
                  {LENGTH_UNITS[u].arName} (<bdi dir="ltr">{LENGTH_UNITS[u].symbol}</bdi>)
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
