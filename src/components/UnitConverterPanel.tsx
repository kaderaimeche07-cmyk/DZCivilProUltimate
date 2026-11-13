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
    <section aria-labelledby="unit-conv-heading" className="console-panel overflow-hidden">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16]">
              <ArrowLeftRight className="h-5 w-5" />
            </span>
            <div>
              <h2 id="unit-conv-heading" className="text-lg font-bold text-[#f4f7f2]">
                محول الوحدات الهندسية الشامل
              </h2>
              <p className="text-xs text-[#b7c9bc]">
                تحويل فوري بين المتر والسنتيمتر والمليمتر، الهكتار، القنطار، ومقاومة الخرسانة <bdi dir="ltr">fc28</bdi>
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="فئة الوحدات الهندسية">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleCategoryChange(c.id)}
                className={`min-h-[44px] rounded-[12px] px-4 py-2 text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#84cc16] text-[#060a05]'
                    : 'border border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:border-white/20 hover:text-[#f4f7f2]'
                }`}
              >
                {c.id === 'stress' ? (
                  <span>الضغط والمقاومة (<bdi dir="ltr">MPa</bdi>)</span>
                ) : (
                  <span>{c.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-6">
            <label htmlFor="unit-conv-val" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
              القيمة المراد تحويلها
            </label>
            <input
              id="unit-conv-val"
              type="number"
              step="any"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] px-4 py-2 text-base font-bold text-[#f4f7f2] outline-none transition-colors duration-200 focus:border-[#84cc16]"
            />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="unit-conv-from" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
              من وحدة القياس
            </label>
            <select
              id="unit-conv-from"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] px-4 py-2 text-sm font-bold text-[#f59e0b] outline-none transition-colors duration-200 focus:border-[#84cc16]"
            >
              {unitList.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0f1612] text-[#f4f7f2]">
                  {u.arName} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Telemetry Matrix */}
        <div className="telemetry-strip">
          <div className="topographic-scale" aria-hidden="true" />
          <div
            data-testid="unit-converter-grid"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/[0.08]"
          >
            {conversions.map((item) => {
              const isSource = item.id === fromUnit;
              return (
                <div
                  key={item.id}
                  className={`telemetry-cell p-3.5 sm:p-4 flex items-start justify-between gap-2 ${
                    isSource ? 'bg-[#84cc16]/[0.08]' : ''
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="text-[11px] font-medium text-[#b7c9bc]">{item.arName}</div>
                    <div
                      className={`font-mono-tabular text-base sm:text-lg font-extrabold truncate ${
                        isSource ? 'text-[#84cc16]' : 'text-[#f4f7f2]'
                      }`}
                      dir="ltr"
                    >
                      <bdi dir="ltr">{item.formatted}</bdi>
                    </div>
                    <div className="text-[11px] font-semibold text-[#f59e0b]"><bdi dir="ltr">{item.symbol}</bdi></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.formatted)}
                    aria-label={`نسخ القيمة بوحدة ${item.arName}`}
                    className="inline-flex h-11 w-11 -mt-1.5 -ml-1.5 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-[#0f1612] text-[#728879] hover:border-[#84cc16]/50 hover:text-[#a3e635] active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-4 w-4 text-[#84cc16]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
