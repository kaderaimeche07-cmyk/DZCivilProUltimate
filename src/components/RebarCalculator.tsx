import React, { useMemo, useState } from 'react';
import { Layers, AlertCircle, SlidersHorizontal } from 'lucide-react';
import {
  REBAR_DIAMETERS,
  REBAR_UNIT_WEIGHTS_KG_M,
  calculateRebarWeight,
  calculateRebarCostDzd,
  formatDzd,
  type RebarDiameterMm,
} from '../utils/calculators.engine';
import {
  fromKilograms,
  formatEngineeringNumber,
  toMeters,
  type LengthUnit,
  type MassUnit,
} from '../utils/units';
import { UnitInputField } from './UnitInputField';
import { RebarCadDiagram } from './EngineeringVisuals';
import { TelemetryReadoutStrip, type TelemetryMetricItem } from './TelemetryReadout';
import { LiveResultBanner } from './LiveResultBanner';
import { CollapsibleSection } from './CollapsibleSection';
import type { SavedBoqItem } from '../types/boq';

interface RebarCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const REBAR_STATE_KEY = 'dz_civil_calc_rebar_state';

export const RebarCalculator: React.FC<RebarCalculatorProps> = ({ onSaveToBoq }) => {
  const [elementName, setElementName] = useState(() => {
    try {
      const saved = localStorage.getItem(REBAR_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.elementName === 'string') return parsed.elementName;
      }
    } catch {}
    return 'تسليح الأعمدة والكمرات';
  });

  const [diameter, setDiameter] = useState<RebarDiameterMm>(() => {
    try {
      const saved = localStorage.getItem(REBAR_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.diameter === 'number') return parsed.diameter as RebarDiameterMm;
      }
    } catch {}
    return 12;
  });

  const [inputMode, setInputMode] = useState<'total' | 'bars'>('total');
  const [totalLengthStr, setTotalLengthStr] = useState(() => {
    try {
      const saved = localStorage.getItem(REBAR_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.totalLengthStr === 'string') return parsed.totalLengthStr;
      }
    } catch {}
    return '100';
  });
  const [totalLengthUnit, setTotalLengthUnit] = useState<LengthUnit>('m');

  const [barCountStr, setBarCountStr] = useState('12');
  const [barLengthStr, setBarLengthStr] = useState('6');
  const [barLengthUnit, setBarLengthUnit] = useState<LengthUnit>('m');
  const [wasteStr, setWasteStr] = useState('3');
  const [massDisplayUnit, setMassDisplayUnit] = useState<MassUnit>('kg');
  const [tonnePriceStr, setTonnePriceStr] = useState('155000');

  // Auto-save last entered values in localStorage with try/catch
  React.useEffect(() => {
    try {
      localStorage.setItem(
        REBAR_STATE_KEY,
        JSON.stringify({
          elementName,
          diameter,
          totalLengthStr,
          totalLengthUnit,
          wasteStr,
        })
      );
    } catch {
      // Storage quota fallback
    }
  }, [elementName, diameter, totalLengthStr, totalLengthUnit, wasteStr]);

  // Engineering compliance limits per Algerian RPA 2024
  const engineeringWarnings = useMemo(() => {
    const msgs: string[] = [];
    if (diameter < 10) {
      msgs.push('تنبيه هندسي (RPA 2024): أقطار T6 و T8 مخصصة للأساور (Cadres/Épingles) ولا تُستخدم كتسليح طولي رئيسي للأعمدة.');
    }
    return msgs;
  }, [diameter]);

  const computedTotalLengthM = useMemo(() => {
    if (inputMode === 'total') return toMeters(Number(totalLengthStr), totalLengthUnit);
    const count = Number(barCountStr);
    if (!Number.isFinite(count) || count <= 0) return NaN;
    return count * toMeters(Number(barLengthStr), barLengthUnit);
  }, [inputMode, totalLengthStr, totalLengthUnit, barCountStr, barLengthStr, barLengthUnit]);

  const result = useMemo(() => {
    const parsedWaste = Number(wasteStr);
    return calculateRebarWeight({
      diameterMm: diameter,
      totalLengthM: computedTotalLengthM,
      wastePercent: Number.isFinite(parsedWaste) ? parsedWaste : 0,
    });
  }, [diameter, computedTotalLengthM, wasteStr]);

  const estimatedCostDzd = useMemo(() => {
    const parsedPrice = Number(tonnePriceStr);
    return calculateRebarCostDzd(result.grossWeightKg, Number.isFinite(parsedPrice) ? parsedPrice : 0);
  }, [result.grossWeightKg, tonnePriceStr]);

  const massSymbol = massDisplayUnit === 'kg' ? 'كغ' : massDisplayUnit === 'q' ? 'قنطار' : 'طن';
  const displayedNetWeight = formatEngineeringNumber(fromKilograms(result.netWeightKg, massDisplayUnit), 3);
  const displayedGrossWeight = formatEngineeringNumber(fromKilograms(result.grossWeightKg, massDisplayUnit), 3);

  const telemetryMetrics: TelemetryMetricItem[] = useMemo(
    () => [
      {
        id: 'rebar-unit',
        label: 'الوزن الخطي / المقطع',
        value: result.unitWeightKgPerM,
        unit: 'كغ/م',
        subtext: `${result.crossSectionMm2} مم²`,
        accent: 'neutral',
      },
      {
        id: 'rebar-net',
        label: 'الوزن الصافي',
        value: displayedNetWeight,
        unit: massSymbol,
        accent: 'neutral',
      },
      {
        id: 'rebar-gross',
        label: 'الوزن الإجمالي مع الهدر',
        value: displayedGrossWeight,
        unit: massSymbol,
        subtext: `${result.grossWeightTonnes} طن`,
        accent: 'amber',
      },
      {
        id: 'rebar-bars',
        label: 'قضبان تجارية (طول 12م)',
        value: result.commercial12mBars,
        unit: 'قضيب',
        accent: 'kiwi',
      },
    ],
    [result, displayedNetWeight, displayedGrossWeight, massSymbol]
  );

  const handleSave = () => {
    if (!result.valid) return;
    onSaveToBoq({
      id: `rebar-${Date.now()}`,
      category: 'rebar',
      categoryLabel: 'حديد التسليح',
      title: `${elementName.trim() || 'حديد تسليح'} (T${diameter})`,
      summary: `الطول الإجمالي ${computedTotalLengthM.toFixed(2)} م · هدر ${wasteStr}%`,
      metrics: [
        { label: 'الوزن الإجمالي', value: `${result.grossWeightKg} كغ (${result.grossWeightTonnes} طن)` },
        { label: 'الوزن الصافي', value: `${result.netWeightKg} كغ` },
        { label: 'القضبان التجارية (12م)', value: `${result.commercial12mBars} قضيب` },
      ],
      estimatedCostDzd,
      createdAtIso: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {result.valid && (
        <LiveResultBanner
          label={`النتيجة الفورية · T${diameter}`}
          primaryValue={`${displayedGrossWeight} ${massSymbol}`}
          secondaryDetail={`${result.commercial12mBars} قضيب (12م)`}
          costText={formatDzd(estimatedCostDzd)}
          copyCostLabel="نسخ تكلفة الحديد"
          onSave={handleSave}
          saveLabel="+ حفظ في المقايسة"
        />
      )}

      <section aria-labelledby="rebar-calc-heading" className="console-panel overflow-hidden">
        <div className="topographic-scale" aria-hidden="true" />
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16]">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <h2 id="rebar-calc-heading" className="text-lg font-bold text-[#f4f7f2]">
                  حاسبة حديد التسليح (<bdi dir="ltr">HA FeE400/500</bdi>)
                </h2>
                <p className="text-xs text-[#b7c9bc]">
                  إدخال الأطوال بأي وحدة مع حساب الوزن والقضبان التجارية (<bdi dir="ltr">12m</bdi>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-[12px] bg-[#070b09] p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setInputMode('total')}
                className={`min-h-[44px] rounded-[10px] px-3.5 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                  inputMode === 'total' ? 'bg-[#84cc16] text-[#060a05]' : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
                }`}
              >
                الطول الإجمالي
              </button>
              <button
                type="button"
                onClick={() => setInputMode('bars')}
                className={`min-h-[44px] rounded-[10px] px-3.5 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                  inputMode === 'bars' ? 'bg-[#84cc16] text-[#060a05]' : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
                }`}
              >
                عدد × طول القضيب
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
              {/* Diameter Selector */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-[#b7c9bc]">
                  قطر الحديد (<bdi dir="ltr">T / Ø</bdi> مم)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" role="radiogroup" aria-label="اختر قطر حديد التسليح">
                  {REBAR_DIAMETERS.map((d) => {
                    const active = diameter === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDiameter(d)}
                        className={`min-h-[48px] rounded-[12px] border px-2 py-2 text-center transition-colors duration-200 cursor-pointer ${
                          active
                            ? 'border-[#84cc16] bg-[#84cc16]/16 text-[#84cc16]'
                            : 'border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:border-white/20 hover:text-[#f4f7f2]'
                        }`}
                      >
                        <div className="font-mono-tabular text-sm font-bold"><bdi dir="ltr">T{d}</bdi></div>
                        <div className="font-mono-tabular text-[10px] text-[#b7c9bc]">
                          <bdi dir="ltr">{REBAR_UNIT_WEIGHTS_KG_M[d]}</bdi>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Engineering Warnings per RPA 2024 */}
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

              {/* Essential Length Inputs in 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {inputMode === 'total' ? (
                  <>
                    <UnitInputField
                      id="rebar-total-len"
                      label="الطول الإجمالي للقضبان"
                      valueStr={totalLengthStr}
                      onValueChange={setTotalLengthStr}
                      unit={totalLengthUnit}
                      onUnitChange={setTotalLengthUnit}
                    />
                    <div>
                      <label htmlFor="rebar-quick-waste" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                        نسبة الهدر والتوصيل (%)
                      </label>
                      <input
                        id="rebar-quick-waste"
                        type="number"
                        min="0"
                        max="25"
                        value={wasteStr}
                        onChange={(e) => setWasteStr(e.target.value)}
                        className="font-mono-tabular w-full min-h-[46px] rounded-[14px] border border-[#24352b] bg-[#070b09] px-3.5 py-2.5 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="rebar-count" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                        عدد القضبان
                      </label>
                      <input
                        id="rebar-count"
                        type="number"
                        min="1"
                        step="1"
                        value={barCountStr}
                        onChange={(e) => setBarCountStr(e.target.value)}
                        className="font-mono-tabular w-full min-h-[46px] rounded-[14px] border border-[#24352b] bg-[#070b09] px-3.5 py-2 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                      />
                    </div>
                    <UnitInputField
                      id="rebar-bar-len"
                      label="طول القضيب الواحد"
                      valueStr={barLengthStr}
                      onValueChange={setBarLengthStr}
                      unit={barLengthUnit}
                      onUnitChange={setBarLengthUnit}
                    />
                  </>
                )}
              </div>

              {/* Progressive Disclosure: Advanced Options */}
              <CollapsibleSection
                title="خيارات متقدمة"
                subtitle="تسمية العنصر، نسبة التوصيل والهدر، وسعر الطن (دج)"
                badge={`هدر ${wasteStr}%`}
                icon={<SlidersHorizontal className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-3">
                    <label htmlFor="rebar-name" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      العنصر الإنشائي
                    </label>
                    <input
                      id="rebar-name"
                      type="text"
                      value={elementName}
                      onChange={(e) => setElementName(e.target.value)}
                      className="w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>

                  <div>
                    <label htmlFor="rebar-waste" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      الهدر والتوصيل (%)
                    </label>
                    <input
                      id="rebar-waste"
                      type="number"
                      min="0"
                      max="25"
                      step="1"
                      value={wasteStr}
                      onChange={(e) => setWasteStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="rebar-tonne-price" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      سعر الطن المرجعي (دج/طن)
                    </label>
                    <input
                      id="rebar-tonne-price"
                      type="number"
                      min="0"
                      step="1000"
                      value={tonnePriceStr}
                      onChange={(e) => setTonnePriceStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3.5 py-2 text-sm font-bold text-[#f59e0b] outline-none focus:border-[#f59e0b]"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            <div className="lg:col-span-5">
              <div className="hidden lg:block">
                <RebarCadDiagram
                  diameterMm={diameter}
                  crossSectionMm2={result.crossSectionMm2}
                  totalLengthM={Number.isFinite(computedTotalLengthM) && computedTotalLengthM > 0 ? computedTotalLengthM : 0}
                  commercialBars={result.commercial12mBars}
                />
              </div>
              <div className="lg:hidden">
                <CollapsibleSection
                  title="مقطع التقطيع الهندسي (CAD)"
                  subtitle="معاينة المقطع العرضي والقضبان التجارية"
                  icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                >
                  <RebarCadDiagram
                    diameterMm={diameter}
                    crossSectionMm2={result.crossSectionMm2}
                    totalLengthM={Number.isFinite(computedTotalLengthM) && computedTotalLengthM > 0 ? computedTotalLengthM : 0}
                    commercialBars={result.commercial12mBars}
                  />
                </CollapsibleSection>
              </div>
            </div>
          </div>

          {!result.valid ? (
            <div role="alert" className="flex items-center gap-2 rounded-[14px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
              <span>{result.error}</span>
            </div>
          ) : (
            <div className="space-y-4 border-t border-white/[0.08] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#d9f99d]">تفاصيل الأوزان والتقطيع التجاري</span>
                <div className="flex items-center gap-1 rounded-[12px] bg-[#070b09] p-1 border border-white/[0.08]">
                  {(['kg', 'q', 't'] as MassUnit[]).map((mu) => (
                    <button
                      key={mu}
                      type="button"
                      onClick={() => setMassDisplayUnit(mu)}
                      className={`min-h-[44px] rounded-[10px] px-3 py-1.5 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                        massDisplayUnit === mu ? 'bg-[#84cc16] text-[#060a05]' : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
                      }`}
                    >
                      {mu === 'kg' ? 'كغ' : mu === 'q' ? 'قنطار' : 'طن'}
                    </button>
                  ))}
                </div>
              </div>

              <TelemetryReadoutStrip
                testId="rebar-results"
                items={telemetryMetrics}
                columnsClassName="grid-cols-2 sm:grid-cols-4"
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
    </div>
  );
};
