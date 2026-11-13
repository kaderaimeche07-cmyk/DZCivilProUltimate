import React, { useMemo, useState } from 'react';
import { Grid2X2, Plus, AlertCircle } from 'lucide-react';
import {
  MASONRY_SPECS,
  calculateMasonryWall,
  type MasonryUnitType,
} from '../utils/calculators.engine';
import type { SavedBoqItem } from '../types/boq';

interface MasonryCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const UNIT_OPTIONS: MasonryUnitType[] = [
  'brick_8',
  'brick_12',
  'brick_16',
  'parpaing_15',
  'parpaing_20',
];

export const MasonryCalculator: React.FC<MasonryCalculatorProps> = ({ onSaveToBoq }) => {
  const [wallName, setWallName] = useState('جدار فاصل / واجهة');
  const [unitType, setUnitType] = useState<MasonryUnitType>('brick_8');
  const [lengthStr, setLengthStr] = useState('5');
  const [heightStr, setHeightStr] = useState('3');
  const [openingsStr, setOpeningsStr] = useState('0');
  const [wasteStr, setWasteStr] = useState('5');

  const result = useMemo(() => {
    return calculateMasonryWall({
      wallLengthM: Number(lengthStr),
      wallHeightM: Number(heightStr),
      openingsAreaM2: Number(openingsStr) || 0,
      unitType,
      wastePercent: Number(wasteStr) || 0,
    });
  }, [lengthStr, heightStr, openingsStr, unitType, wasteStr]);

  const spec = MASONRY_SPECS[unitType];

  const handleSave = () => {
    if (!result.valid) return;
    onSaveToBoq({
      id: `masonry-${Date.now()}`,
      category: 'masonry',
      categoryLabel: 'البناء والآجر',
      title: `${wallName.trim() || 'جدار'} — ${spec.label}`,
      summary: `${result.netAreaM2} م² صافية · فتحات ${openingsStr} م²`,
      metrics: [
        { label: 'عدد الوحدات المطلوبة', value: `${result.totalUnitsWithWaste} وحدة` },
        { label: 'مونة البناء', value: `${result.mortarVolumeM3} م³` },
        { label: 'إسمنت المونة', value: `${result.cementBags50kg} كيس` },
        { label: 'رمل المونة', value: `${result.sandM3} م³` },
      ],
      createdAtIso: new Date().toISOString(),
    });
  };

  return (
    <section aria-labelledby="masonry-calc-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9f1c]/15 text-[#ff9f1c]">
            <Grid2X2 className="h-5 w-5" />
          </span>
          <div>
            <h2 id="masonry-calc-heading" className="text-lg font-bold text-white">
              حاسبة الآجر والبلوك والمونة المحلية
            </h2>
            <p className="text-xs text-slate-400">
              تقدير آجر 8 / 12 / 16 ثقوب والبلوك الإسمنتي مع خصم الأبواب والنوافذ وحساب المونة
            </p>
          </div>
        </div>
      </div>

      {/* Brick / Block Type Selector */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-slate-300">
          نوع وحدة البناء المعتمدة
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {UNIT_OPTIONS.map((key) => {
            const item = MASONRY_SPECS[key];
            const active = unitType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setUnitType(key)}
                className={`min-h-[54px] rounded-xl border p-3 text-right transition-colors cursor-pointer ${
                  active
                    ? 'border-[#ff9f1c] bg-[#ff9f1c]/12 text-white'
                    : 'border-white/[0.08] bg-[#0f1419] text-slate-300 hover:border-white/20'
                }`}
              >
                <div className={`text-xs font-bold ${active ? 'text-[#ff9f1c]' : 'text-white'}`}>
                  {item.label}
                </div>
                <div className="mt-1 font-mono-tabular text-[11px] text-slate-400">
                  {item.dimensionsCm} · {item.unitsPerM2}/م²
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div>
          <label htmlFor="mas-name" className="mb-1.5 block text-xs font-semibold text-slate-300">
            تسمية الجدار
          </label>
          <input
            id="mas-name"
            type="text"
            value={wallName}
            onChange={(e) => setWallName(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="mas-length" className="mb-1.5 block text-xs font-semibold text-slate-300">
            طول الجدار (م)
          </label>
          <input
            id="mas-length"
            type="number"
            min="0.1"
            step="0.1"
            value={lengthStr}
            onChange={(e) => setLengthStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="mas-height" className="mb-1.5 block text-xs font-semibold text-slate-300">
            ارتفاع الجدار (م)
          </label>
          <input
            id="mas-height"
            type="number"
            min="0.1"
            step="0.1"
            value={heightStr}
            onChange={(e) => setHeightStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="mas-openings" className="mb-1.5 block text-xs font-semibold text-slate-300">
            مساحة الفتحات (م²)
          </label>
          <input
            id="mas-openings"
            type="number"
            min="0"
            step="0.5"
            value={openingsStr}
            onChange={(e) => setOpeningsStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="mas-waste" className="mb-1.5 block text-xs font-semibold text-slate-300">
            نسبة الكسر والهدر (%)
          </label>
          <input
            id="mas-waste"
            type="number"
            min="0"
            max="25"
            step="1"
            value={wasteStr}
            onChange={(e) => setWasteStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
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
            data-testid="masonry-results"
            className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-white/[0.08] pt-4"
          >
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">المساحة الصافية</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.netAreaM2} <span className="text-xs font-normal text-slate-400">م²</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">
                كلية {result.grossAreaM2} م²
              </div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">العدد المطلوب (بالهدر)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#ff9f1c]">
                {result.totalUnitsWithWaste} <span className="text-xs font-normal text-slate-400">وحدة</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">صافي {result.netUnits}</div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">حجم المونة (Mortier)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#2ec4b6]">
                {result.mortarVolumeM3} <span className="text-xs font-normal text-slate-400">م³</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">إسمنت المونة (50 كغ)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.cementBags50kg} <span className="text-xs font-normal text-slate-400">كيس</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">رمل المونة المغسول</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.sandM3} <span className="text-xs font-normal text-slate-400">م³</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="btn-mango inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm cursor-pointer"
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
