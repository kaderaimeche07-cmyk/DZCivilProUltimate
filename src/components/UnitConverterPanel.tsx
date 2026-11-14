import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';
import {
  convertUnitValue,
  formatEngineeringNumber,
  getCategoryUnitMap,
  type UnitCategory,
} from '../utils/units';
import { copyTextSafely } from '../utils/security';
import { useI18n } from '../i18n/I18nContext';
import { getUnitDisplay } from '../i18n/translations';

const CATEGORY_SPECS: { id: UnitCategory; defaultFrom: string; defaultVal: string }[] = [
  { id: 'length', defaultFrom: 'cm', defaultVal: '250' },
  { id: 'area', defaultFrom: 'm2', defaultVal: '120' },
  { id: 'volume', defaultFrom: 'm3', defaultVal: '12' },
  { id: 'mass', defaultFrom: 't', defaultVal: '2.5' },
  { id: 'stress', defaultFrom: 'MPa', defaultVal: '25' },
];

export const UnitConverterPanel: React.FC = () => {
  const { lang, t } = useI18n();
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
    const spec = CATEGORY_SPECS.find((c) => c.id === nextCat) ?? CATEGORY_SPECS[0];
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
      const disp = getUnitDisplay(lang, u.id);
      return {
        ...u,
        displayName: disp.name,
        displaySymbol: disp.symbol,
        formatted: formatEngineeringNumber(converted, 5),
      };
    });
  }, [unitList, numericValue, category, fromUnit, lang]);

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
                {t.converter.heading}
              </h2>
              <p className="text-xs text-[#b7c9bc]">
                {t.converter.subtitlePrefix} <bdi dir="ltr">fc28</bdi>
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.converter.tablistAria}>
          {CATEGORY_SPECS.map((c) => {
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
                  <span>{t.converter.categories.stress} (<bdi dir="ltr">MPa</bdi>)</span>
                ) : (
                  <span>{t.converter.categories[c.id]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-6">
            <label htmlFor="unit-conv-val" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
              {t.converter.valueLabel}
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
              {t.converter.fromUnitLabel}
            </label>
            <select
              id="unit-conv-from"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] px-4 py-2 text-sm font-bold text-[#f59e0b] outline-none transition-colors duration-200 focus:border-[#84cc16]"
            >
              {unitList.map((u) => {
                const disp = getUnitDisplay(lang, u.id);
                return (
                  <option key={u.id} value={u.id} className="bg-[#0f1612] text-[#f4f7f2]">
                    {disp.name} ({disp.symbol})
                  </option>
                );
              })}
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
                    <div className="text-[11px] font-medium text-[#b7c9bc]">{item.displayName}</div>
                    <div
                      className={`font-mono-tabular text-base sm:text-lg font-extrabold truncate ${
                        isSource ? 'text-[#84cc16]' : 'text-[#f4f7f2]'
                      }`}
                      dir="ltr"
                    >
                      <bdi dir="ltr">{item.formatted}</bdi>
                    </div>
                    <div className="text-[11px] font-semibold text-[#f59e0b]"><bdi dir="ltr">{item.displaySymbol}</bdi></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.formatted)}
                    aria-label={t.converter.copyUnitAria(item.displayName)}
                    className="inline-flex h-11 w-11 -mt-1.5 -ms-1.5 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-[#0f1612] text-[#728879] hover:border-[#84cc16]/50 hover:text-[#a3e635] active:scale-95 transition-all duration-200 cursor-pointer"
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
