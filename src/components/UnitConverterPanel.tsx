import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';
import {
  convertUnitValue,
  formatEngineeringNumber,
  getCategoryUnitMap,
  type UnitCategory,
} from '../utils/units';
import { copyTextSafely } from '../utils/security';

const CATEGORIES: { id: UnitCategory; label: string; defaultFrom: string; defaultVal: string }[] = [
  { id: 'length', label: 'الأطوال والمسافات', defaultFrom: 'cm', defaultVal: '250' },
  { id: 'area', label: 'المساحات والأراضي', defaultFrom: 'm2', defaultVal: '120' },
  { id: 'volume', label: 'الأحجام والخرسانة', defaultFrom: 'm3', defaultVal: '12' },
  { id: 'mass', label: 'الأوزان (كغ / قنطار / طن)', defaultFrom: 't', defaultVal: '2.5' },
  { id: 'stress', label: 'الضغط والمقاومة (MPa)', defaultFrom: 'MPa', defaultVal: '25' },
];

export const UnitConverterPanel: React.FC = () => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState<string>('cm');
  const [valueStr, setValueStr] = useState<string>('250');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const unitMap = useMemo(() => getCategoryUnitMap(category), [category]);
  const unitList = useMemo(() => Object.values(unitMap), [unitMap]);

  const handleCategoryChange = (nextCat: UnitCategory) => {
    const spec = CATEGORIES.find((c) => c.id === nextCat) ?? CATEGORIES[0];
    setCategory(nextCat);
    setFromUnit(spec.defaultFrom);
    setValueStr(spec.defaultVal);
  };

  const numericValue = Number(valueStr);
  const conversions = useMemo(() => {
    return unitList.map((u) => {
      const converted = Number.isFinite(numericValue)
        ? convertUnitValue(category, numericValue, fromUnit, u.id)
        : NaN;
      return {
        ...u,
        formatted: formatEngineeringNumber(converted, 5),
      };
    });
  }, [unitList, numericValue, category, fromUnit]);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyTextSafely(text);
    if (ok) {
      setCopiedId(id);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <section aria-labelledby="unit-conv-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/15 text-[#a3e635]">
            <ArrowLeftRight className="h-5 w-5" />
          </span>
          <div>
            <h2 id="unit-conv-heading" className="text-lg font-bold text-white">
              محول الوحدات الهندسية الشامل
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              تحويل فوري بين المتر والسنتيمتر والمليمتر، الهكتار، القنطار، ومقاومة الخرسانة fc28
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="فئة الوحدات الهندسية">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleCategoryChange(c.id)}
              className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#84cc16] text-[#081006]'
                  : 'bg-[#1a261e] text-[#c5d6c9] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
        <div className="sm:col-span-6">
          <label htmlFor="unit-conv-val" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
            القيمة المراد تحويلها
          </label>
          <input
            id="unit-conv-val"
            type="number"
            step="any"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[46px] rounded-xl border border-white/10 bg-[#0b110d] px-4 py-2 text-base font-bold text-white outline-none focus:border-[#84cc16]"
          />
        </div>
        <div className="sm:col-span-6">
          <label htmlFor="unit-conv-from" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
            من وحدة القياس
          </label>
          <select
            id="unit-conv-from"
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full min-h-[46px] rounded-xl border border-white/10 bg-[#0b110d] px-4 py-2 text-sm font-bold text-[#d9f99d] outline-none focus:border-[#84cc16]"
          >
            {unitList.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#121b15] text-white">
                {u.arName} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Output Matrix */}
      <div
        data-testid="unit-converter-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1"
      >
        {conversions.map((item) => {
          const isSource = item.id === fromUnit;
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3.5 flex items-start justify-between gap-2 ${
                isSource
                  ? 'border-[#84cc16]/50 bg-[#84cc16]/10'
                  : 'border-white/[0.08] bg-[#0b110d]/90'
              }`}
            >
              <div className="min-w-0">
                <div className="text-[11px] text-[#a3b8a8]">{item.arName}</div>
                <div className="mt-1 font-mono-tabular text-base sm:text-lg font-bold text-white truncate" dir="ltr">
                  {item.formatted}
                </div>
                <div className="text-[11px] font-semibold text-[#a3e635]">{item.symbol}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.formatted)}
                aria-label={`نسخ القيمة بوحدة ${item.arName}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a3b8a8] hover:bg-white/5 hover:text-[#a3e635] cursor-pointer"
              >
                {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-[#a3e635]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
