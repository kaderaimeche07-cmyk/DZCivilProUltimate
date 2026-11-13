import React, { useMemo, useState } from 'react';
import { Grid2X2, Plus, AlertCircle } from 'lucide-react';
import {
  MASONRY_SPECS,
  calculateMasonryWall,
  calculateMasonryCostDzd,
  formatDzd,
  type MasonryUnitType,
} from '../utils/calculators.engine';
import {
  LENGTH_UNITS,
  toMeters,
  toSquareMeters,
  type AreaUnit,
  type LengthUnit,
} from '../utils/units';
import { UnitInputField } from './UnitInputField';
import { MasonryCadDiagram } from './EngineeringVisuals';
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
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('m');
  const [heightStr, setHeightStr] = useState('3');
  const [heightUnit, setHeightUnit] = useState<LengthUnit>('m');
  const [openingsStr, setOpeningsStr] = useState('0');
  const [openingsUnit, setOpeningsUnit] = useState<AreaUnit>('m2');
  const [wasteStr, setWasteStr] = useState('5');
  const [unitPriceDzdStr, setUnitPriceDzdStr] = useState('32');

  const wallLengthM = useMemo(() => toMeters(Number(lengthStr), lengthUnit), [lengthStr, lengthUnit]);
  const wallHeightM = useMemo(() => toMeters(Number(heightStr), heightUnit), [heightStr, heightUnit]);
  const openingsAreaM2 = useMemo(() => {
    const raw = Number(openingsStr);
    if (!Number.isFinite(raw) || raw < 0) return 0;
    const sqm = toSquareMeters(raw, openingsUnit);
    return Number.isFinite(sqm) ? sqm : 0;
  }, [openingsStr, openingsUnit]);

  const result = useMemo(() => {
    const parsedWaste = Number(wasteStr);
    return calculateMasonryWall({
      wallLengthM,
      wallHeightM,
      openingsAreaM2,
      unitType,
      wastePercent: Number.isFinite(parsedWaste) ? parsedWaste : 0,
    });
  }, [wallLengthM, wallHeightM, openingsAreaM2, unitType, wasteStr]);

  const spec = MASONRY_SPECS[unitType];

  const estimatedCostDzd = useMemo(() => {
    const parsedUnitPrice = Number(unitPriceDzdStr);
    return calculateMasonryCostDzd(
      result.totalUnitsWithWaste,
      result.cementBags50kg,
      result.sandM3,
      Number.isFinite(parsedUnitPrice) ? parsedUnitPrice : 0
    );
  }, [result.totalUnitsWithWaste, result.cementBags50kg, result.sandM3, unitPriceDzdStr]);

  const addQuickOpening = (areaM2: number) => {
    const currentM2 = Number.isFinite(openingsAreaM2) ? openingsAreaM2 : 0;
    const nextM2 = Number((currentM2 + areaM2).toFixed(2));
    setOpeningsUnit('m2');
    setOpeningsStr(String(nextM2));
  };

  const handleSave = () => {
    if (!result.valid) return;
    const safeOpeningsText = Number.isFinite(openingsAreaM2) ? openingsAreaM2.toFixed(2) : '0.00';
    onSaveToBoq({
      id: `masonry-${Date.now()}`,
      category: 'masonry',
      categoryLabel: 'البناء والآجر',
      title: `${wallName.trim() || 'جدار'} — ${spec.label}`,
      summary: `${result.netAreaM2} م² صافية · فتحات ${safeOpeningsText} م²`,
      metrics: [
        { label: 'عدد الوحدات المطلوبة', value: `${result.totalUnitsWithWaste} وحدة` },
        { label: 'مونة البناء', value: `${result.mortarVolumeM3} م³` },
        { label: 'إسمنت المونة', value: `${result.cementBags50kg} كيس` },
        { label: 'رمل المونة', value: `${result.sandM3} م³` },
      ],
      estimatedCostDzd,
      createdAtIso: new Date().toISOString(),
    });
  };

  return (
    <section aria-labelledby="masonry-calc-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f59e0b]/15 text-[#fbbf24]">
            <Grid2X2 className="h-5 w-5" />
          </span>
          <div>
            <h2 id="masonry-calc-heading" className="text-lg font-bold text-white">
              حاسبة الآجر والبلوك والمونة المحلية
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              تقدير آجر 8 / 12 / 16 ثقوب والبلوك الإسمنتي بأي وحدة قياس مع رسم تفاعلي للواجهة والفتحات
            </p>
          </div>
        </div>
      </div>

      {/* Brick / Block Type Selector */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-[#c5d6c9]">
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
                    ? 'border-[#84cc16] bg-[#84cc16]/14 text-white'
                    : 'border-white/[0.08] bg-[#0b110d] text-[#c5d6c9] hover:border-white/20'
                }`}
              >
                <div className={`text-xs font-bold ${active ? 'text-[#a3e635]' : 'text-white'}`}>
                  {item.label}
                </div>
                <div className="mt-1 font-mono-tabular text-[11px] text-[#a3b8a8]">
                  {item.dimensionsCm} · {item.unitsPerM2}/م²
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs + Live Elevation Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label htmlFor="mas-name" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
                تسمية الجدار
              </label>
              <input
                id="mas-name"
                type="text"
                value={wallName}
                onChange={(e) => setWallName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
              />
            </div>

            <UnitInputField
              id="mas-length"
              label="طول الجدار"
              valueStr={lengthStr}
              onValueChange={setLengthStr}
              unit={lengthUnit}
              onUnitChange={setLengthUnit}
            />
            <UnitInputField
              id="mas-height"
              label="ارتفاع الجدار"
              valueStr={heightStr}
              onValueChange={setHeightStr}
              unit={heightUnit}
              onUnitChange={setHeightUnit}
            />

            <div>
              <label htmlFor="mas-openings" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
                مساحة الفتحات (أبواب ونوافذ)
              </label>
              <div className="flex min-h-[44px] items-stretch overflow-hidden rounded-xl border border-white/10 bg-[#0b110d] focus-within:border-[#f59e0b]">
                <input
                  id="mas-openings"
                  type="number"
                  min="0"
                  step={openingsUnit === 'm2' ? '0.2' : '100'}
                  value={openingsStr}
                  onChange={(e) => setOpeningsStr(e.target.value)}
                  className="font-mono-tabular w-full min-w-0 bg-transparent px-3 py-2 text-sm text-white outline-none"
                />
                <label htmlFor="mas-openings-unit" className="sr-only">
                  وحدة مساحة الفتحات
                </label>
                <select
                  id="mas-openings-unit"
                  value={openingsUnit}
                  onChange={(e) => setOpeningsUnit(e.target.value as AreaUnit)}
                  className="border-r border-white/10 bg-[#1a261e] px-2.5 text-xs font-bold text-[#fbbf24] outline-none cursor-pointer"
                >
                  <option value="m2" className="bg-[#121b15]">م²</option>
                  <option value="cm2" className="bg-[#121b15]">سم²</option>
                  <option value="ft2" className="bg-[#121b15]">قدم²</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="mas-waste" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
                  الهدر (%)
                </label>
                <input
                  id="mas-waste"
                  type="number"
                  min="0"
                  max="25"
                  step="1"
                  value={wasteStr}
                  onChange={(e) => setWasteStr(e.target.value)}
                  className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
                />
              </div>
              <div>
                <label htmlFor="mas-unit-price" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
                  سعر الوحدة (دج)
                </label>
                <input
                  id="mas-unit-price"
                  type="number"
                  min="0"
                  step="1"
                  value={unitPriceDzdStr}
                  onChange={(e) => setUnitPriceDzdStr(e.target.value)}
                  className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3 py-2 text-sm text-white outline-none focus:border-[#f59e0b]"
                />
              </div>
            </div>
          </div>

          {/* Quick Door/Window Deduction Helpers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#a3b8a8]">خصم فتحة جاهزة:</span>
            <button
              type="button"
              onClick={() => addQuickOpening(1.89)}
              className="min-h-[34px] rounded-lg border border-white/10 bg-[#1a261e] px-2.5 py-1 text-[#d9f99d] hover:border-[#84cc16]/50 cursor-pointer"
            >
              + باب قياسي (0.9×2.1م)
            </button>
            <button
              type="button"
              onClick={() => addQuickOpening(1.44)}
              className="min-h-[34px] rounded-lg border border-white/10 bg-[#1a261e] px-2.5 py-1 text-[#d9f99d] hover:border-[#84cc16]/50 cursor-pointer"
            >
              + نافذة (1.2×1.2م)
            </button>
            {openingsAreaM2 > 0 && (
              <button
                type="button"
                onClick={() => setOpeningsStr('0')}
                className="min-h-[34px] rounded-lg border border-white/10 bg-[#0b110d] px-2.5 py-1 text-[#fbbf24] hover:border-[#f59e0b]/50 cursor-pointer"
              >
                تصفير الفتحات
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <MasonryCadDiagram
            lengthLabel={`${lengthStr || 0}${LENGTH_UNITS[lengthUnit].symbol}`}
            heightLabel={`${heightStr || 0}${LENGTH_UNITS[heightUnit].symbol}`}
            openingsM2={Number.isFinite(openingsAreaM2) ? openingsAreaM2 : 0}
            grossAreaM2={result.grossAreaM2}
            brickLabel={spec.label}
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
          <div
            data-testid="masonry-results"
            className="grid grid-cols-2 sm:grid-cols-5 gap-3"
          >
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">المساحة الصافية</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.netAreaM2} <span className="text-xs font-normal text-[#a3b8a8]">م²</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">
                كلية {result.grossAreaM2} م²
              </div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#f59e0b]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">العدد المطلوب (بالهدر)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#fbbf24]">
                {result.totalUnitsWithWaste} <span className="text-xs font-normal text-[#a3b8a8]">وحدة</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">صافي {result.netUnits}</div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#84cc16]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">حجم المونة (Mortier)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#a3e635]">
                {result.mortarVolumeM3} <span className="text-xs font-normal text-[#a3b8a8]">م³</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">إسمنت المونة (50 كغ)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.cementBags50kg} <span className="text-xs font-normal text-[#a3b8a8]">كيس</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">رمل المونة المغسول</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.sandM3} <span className="text-xs font-normal text-[#a3b8a8]">م³</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#a3b8a8]">
              التكلفة التقديرية للجدار والمونة: <strong className="font-mono-tabular text-[#fbbf24]">{formatDzd(estimatedCostDzd)}</strong>
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
