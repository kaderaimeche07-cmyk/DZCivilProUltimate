import React, { useMemo, useState } from 'react';
import { Layers, Plus, AlertCircle } from 'lucide-react';
import {
  REBAR_DIAMETERS,
  REBAR_UNIT_WEIGHTS_KG_M,
  calculateRebarWeight,
  type RebarDiameterMm,
} from '../utils/calculators.engine';
import type { SavedBoqItem } from '../types/boq';

interface RebarCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

export const RebarCalculator: React.FC<RebarCalculatorProps> = ({ onSaveToBoq }) => {
  const [elementName, setElementName] = useState('تسليح الأعمدة والكمرات');
  const [diameter, setDiameter] = useState<RebarDiameterMm>(12);
  const [inputMode, setInputMode] = useState<'total' | 'bars'>('total');
  const [totalLengthStr, setTotalLengthStr] = useState('100');
  const [barCountStr, setBarCountStr] = useState('12');
  const [barLengthStr, setBarLengthStr] = useState('6');
  const [wasteStr, setWasteStr] = useState('3');

  const computedTotalLengthM = useMemo(() => {
    if (inputMode === 'total') return Number(totalLengthStr);
    return Number(barCountStr) * Number(barLengthStr);
  }, [inputMode, totalLengthStr, barCountStr, barLengthStr]);

  const result = useMemo(() => {
    return calculateRebarWeight({
      diameterMm: diameter,
      totalLengthM: computedTotalLengthM,
      wastePercent: Number(wasteStr) || 0,
    });
  }, [diameter, computedTotalLengthM, wasteStr]);

  const handleSave = () => {
    if (!result.valid) return;
    onSaveToBoq({
      id: `rebar-${Date.now()}`,
      category: 'rebar',
      categoryLabel: 'حديد التسليح',
      title: `${elementName.trim() || 'حديد تسليح'} (T${diameter})`,
      summary: `الطول الإجمالي ${computedTotalLengthM.toFixed(1)} م · هدر ${wasteStr}%`,
      metrics: [
        { label: 'الوزن الإجمالي', value: `${result.grossWeightKg} كغ (${result.grossWeightTonnes} طن)` },
        { label: 'الوزن الصافي', value: `${result.netWeightKg} كغ` },
        { label: 'القضبان التجارية (12م)', value: `${result.commercial12mBars} قضيب` },
      ],
      createdAtIso: new Date().toISOString(),
    });
  };

  return (
    <section aria-labelledby="rebar-calc-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ec4b6]/15 text-[#2ec4b6]">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h2 id="rebar-calc-heading" className="text-lg font-bold text-white">
              حاسبة وزن حديد التسليح الجزائري (HA FeE400/500)
            </h2>
            <p className="text-xs text-slate-400">
              أقطار قياسية من T6 إلى T32 مع حساب القضبان التجارية (12 متر) والأطنان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#0f1419] p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setInputMode('total')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'total' ? 'bg-[#222d38] text-[#2ec4b6]' : 'text-slate-400 hover:text-white'
            }`}
          >
            الطول الإجمالي
          </button>
          <button
            type="button"
            onClick={() => setInputMode('bars')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'bars' ? 'bg-[#222d38] text-[#2ec4b6]' : 'text-slate-400 hover:text-white'
            }`}
          >
            عدد × طول القضيب
          </button>
        </div>
      </div>

      {/* Diameter Selector */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-slate-300">
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
                className={`min-h-[44px] min-w-[68px] rounded-xl border px-3 py-2 text-center transition-colors cursor-pointer ${
                  active
                    ? 'border-[#ff9f1c] bg-[#ff9f1c]/15 text-[#ff9f1c]'
                    : 'border-white/[0.08] bg-[#0f1419] text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="font-mono-tabular text-sm font-bold">T{d}</div>
                <div className="font-mono-tabular text-[10px] text-slate-400">
                  {REBAR_UNIT_WEIGHTS_KG_M[d]} كغ/م
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label htmlFor="rebar-name" className="mb-1.5 block text-xs font-semibold text-slate-300">
            العنصر الإنشائي
          </label>
          <input
            id="rebar-name"
            type="text"
            value={elementName}
            onChange={(e) => setElementName(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
          />
        </div>

        {inputMode === 'total' ? (
          <div>
            <label htmlFor="rebar-total-len" className="mb-1.5 block text-xs font-semibold text-slate-300">
              الطول الإجمالي (م)
            </label>
            <input
              id="rebar-total-len"
              type="number"
              min="0.1"
              step="1"
              value={totalLengthStr}
              onChange={(e) => setTotalLengthStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="rebar-count" className="mb-1.5 block text-xs font-semibold text-slate-300">
                عدد القضبان
              </label>
              <input
                id="rebar-count"
                type="number"
                min="1"
                step="1"
                value={barCountStr}
                onChange={(e) => setBarCountStr(e.target.value)}
                className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
              />
            </div>
            <div>
              <label htmlFor="rebar-bar-len" className="mb-1.5 block text-xs font-semibold text-slate-300">
                طول القضيب الواحد (م)
              </label>
              <input
                id="rebar-bar-len"
                type="number"
                min="0.1"
                step="0.5"
                value={barLengthStr}
                onChange={(e) => setBarLengthStr(e.target.value)}
                className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="rebar-waste" className="mb-1.5 block text-xs font-semibold text-slate-300">
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
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
          />
        </div>
      </div>

      {!result.valid ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#ff9f1c]/40 bg-[#ff9f1c]/10 p-3.5 text-xs text-[#ffbe6b]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#ff9f1c]" />
          <span>{result.error}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            data-testid="rebar-results"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/[0.08] pt-4"
          >
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">الوزن الخطي / المقطع</div>
              <div className="mt-1 font-mono-tabular text-base font-bold text-white">
                {result.unitWeightKgPerM} <span className="text-xs font-normal text-slate-400">كغ/م</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">{result.crossSectionMm2} مم²</div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">الوزن الصافي</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.netWeightKg} <span className="text-xs font-normal text-slate-400">كغ</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">الوزن الإجمالي مع الهدر</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#ff9f1c]">
                {result.grossWeightKg} <span className="text-xs font-normal text-slate-400">كغ</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">{result.grossWeightTonnes} طن</div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">قضبان تجارية (طول 12م)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#2ec4b6]">
                {result.commercial12mBars} <span className="text-xs font-normal text-slate-400">قضيب</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="btn-kiwi inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm cursor-pointer"
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
