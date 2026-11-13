import React, { useMemo, useState } from 'react';
import { Layers, Plus, AlertCircle } from 'lucide-react';
import {
  REBAR_DIAMETERS,
  REBAR_UNIT_WEIGHTS_KG_M,
  calculateRebarWeight,
  calculateRebarCostDzd,
  formatDzd,
  type RebarDiameterMm,
} from '../utils/calculators.engine';
import {
  LENGTH_UNITS,
  fromKilograms,
  formatEngineeringNumber,
  toMeters,
  type LengthUnit,
  type MassUnit,
} from '../utils/units';
import { UnitInputField } from './UnitInputField';
import { RebarCadDiagram } from './EngineeringVisuals';
import type { SavedBoqItem } from '../types/boq';

interface RebarCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

export const RebarCalculator: React.FC<RebarCalculatorProps> = ({ onSaveToBoq }) => {
  const [elementName, setElementName] = useState('تسليح الأعمدة والكمرات');
  const [diameter, setDiameter] = useState<RebarDiameterMm>(12);
  const [inputMode, setInputMode] = useState<'total' | 'bars'>('total');
  const [totalLengthStr, setTotalLengthStr] = useState('100');
  const [totalLengthUnit, setTotalLengthUnit] = useState<LengthUnit>('m');
  const [barCountStr, setBarCountStr] = useState('12');
  const [barLengthStr, setBarLengthStr] = useState('6');
  const [barLengthUnit, setBarLengthUnit] = useState<LengthUnit>('m');
  const [wasteStr, setWasteStr] = useState('3');
  const [massDisplayUnit, setMassDisplayUnit] = useState<MassUnit>('kg');
  const [tonnePriceStr, setTonnePriceStr] = useState('155000');

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
    <section aria-labelledby="rebar-calc-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/15 text-[#a3e635]">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h2 id="rebar-calc-heading" className="text-lg font-bold text-white">
              حاسبة وزن حديد التسليح الجزائري (HA FeE400/500)
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              إدخال الأطوال بأي وحدة (م، سم، ملم، قدم) مع حساب القضبان التجارية 12م والقنطار والطن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#0b110d] p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setInputMode('total')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'total' ? 'bg-[#84cc16] text-[#081006]' : 'text-[#a3b8a8] hover:text-white'
            }`}
          >
            الطول الإجمالي
          </button>
          <button
            type="button"
            onClick={() => setInputMode('bars')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'bars' ? 'bg-[#84cc16] text-[#081006]' : 'text-[#a3b8a8] hover:text-white'
            }`}
          >
            عدد × طول القضيب
          </button>
        </div>
      </div>

      {/* Diameter Selector */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-[#c5d6c9]">
          قطر الحديد (T / Ø مم)
        </span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="اختر قطر حديد التسليح">
          {REBAR_DIAMETERS.map((d) => {
            const active = diameter === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDiameter(d)}
                className={`min-h-[46px] min-w-[70px] rounded-xl border px-3 py-2 text-center transition-colors cursor-pointer ${
                  active
                    ? 'border-[#84cc16] bg-[#84cc16]/16 text-[#a3e635]'
                    : 'border-white/[0.08] bg-[#0b110d] text-[#c5d6c9] hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="font-mono-tabular text-sm font-bold">T{d}</div>
                <div className="font-mono-tabular text-[10px] text-[#a3b8a8]">
                  {REBAR_UNIT_WEIGHTS_KG_M[d]} كغ/م
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs + Live CAD Cross-Section Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label htmlFor="rebar-name" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
              العنصر الإنشائي
            </label>
            <input
              id="rebar-name"
              type="text"
              value={elementName}
              onChange={(e) => setElementName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
            />
          </div>

          {inputMode === 'total' ? (
            <UnitInputField
              id="rebar-total-len"
              label={`الطول الإجمالي (${LENGTH_UNITS[totalLengthUnit].arName})`}
              valueStr={totalLengthStr}
              onValueChange={setTotalLengthStr}
              unit={totalLengthUnit}
              onUnitChange={setTotalLengthUnit}
            />
          ) : (
            <>
              <div>
                <label htmlFor="rebar-count" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
                  عدد القضبان
                </label>
                <input
                  id="rebar-count"
                  type="number"
                  min="1"
                  step="1"
                  value={barCountStr}
                  onChange={(e) => setBarCountStr(e.target.value)}
                  className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
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

          <div>
            <label htmlFor="rebar-waste" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
              نسبة الهدر والتوصيل (%)
            </label>
            <input
              id="rebar-waste"
              type="number"
              min="0"
              max="25"
              step="1"
              value={wasteStr}
              onChange={(e) => setWasteStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
            />
          </div>

          <div>
            <label htmlFor="rebar-tonne-price" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
              سعر الطن المرجعي (دج/طن)
            </label>
            <input
              id="rebar-tonne-price"
              type="number"
              min="0"
              step="1000"
              value={tonnePriceStr}
              onChange={(e) => setTonnePriceStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#f59e0b]"
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <RebarCadDiagram
            diameterMm={diameter}
            crossSectionMm2={result.crossSectionMm2}
            totalLengthM={Number.isFinite(computedTotalLengthM) && computedTotalLengthM > 0 ? computedTotalLengthM : 0}
            commercialBars={result.commercial12mBars}
          />
        </div>
      </div>

      {!result.valid ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
          <span>{result.error}</span>
        </div>
      ) : (
        <div className="space-y-4 border-t border-white/[0.08] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#d9f99d]">ملخص الأوزان والتقطيع التجاري</span>
            <div className="flex items-center gap-1 rounded-lg bg-[#0b110d] p-1 border border-white/[0.08]">
              {(['kg', 'q', 't'] as MassUnit[]).map((mu) => (
                <button
                  key={mu}
                  type="button"
                  onClick={() => setMassDisplayUnit(mu)}
                  className={`min-h-[30px] rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    massDisplayUnit === mu ? 'bg-[#84cc16] text-[#081006]' : 'text-[#a3b8a8] hover:text-white'
                  }`}
                >
                  {mu === 'kg' ? 'كغ' : mu === 'q' ? 'قنطار' : 'طن'}
                </button>
              ))}
            </div>
          </div>

          <div
            data-testid="rebar-results"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">الوزن الخطي / المقطع</div>
              <div className="mt-1 font-mono-tabular text-base font-bold text-white">
                {result.unitWeightKgPerM} <span className="text-xs font-normal text-[#a3b8a8]">كغ/م</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">{result.crossSectionMm2} مم²</div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">الوزن الصافي</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {displayedNetWeight} <span className="text-xs font-normal text-[#a3b8a8]">{massSymbol}</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#f59e0b]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">الوزن الإجمالي مع الهدر</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#fbbf24]">
                {displayedGrossWeight} <span className="text-xs font-normal text-[#a3b8a8]">{massSymbol}</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">{result.grossWeightTonnes} طن</div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#84cc16]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">قضبان تجارية (طول 12م)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#a3e635]">
                {result.commercial12mBars} <span className="text-xs font-normal text-[#a3b8a8]">قضيب</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#a3b8a8]">
              التكلفة المقدرة للحديد: <strong className="font-mono-tabular text-[#fbbf24]">{formatDzd(estimatedCostDzd)}</strong>
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="btn-kiwi inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة إلى كشف الكميات</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
