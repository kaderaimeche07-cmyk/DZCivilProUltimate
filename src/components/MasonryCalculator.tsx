import React, { useMemo, useState } from 'react';
import { Grid2X2, AlertCircle, SlidersHorizontal, DoorOpen, Layers } from 'lucide-react';
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
import { TelemetryReadoutStrip, type TelemetryMetricItem } from './TelemetryReadout';
import { LiveResultBanner } from './LiveResultBanner';
import { CollapsibleSection } from './CollapsibleSection';
import { BottomSheet } from './BottomSheet';
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

const MASONRY_STATE_KEY = 'dz_civil_calc_masonry_state';

export const MasonryCalculator: React.FC<MasonryCalculatorProps> = ({ onSaveToBoq }) => {
  const [wallName, setWallName] = useState(() => {
    try {
      const saved = localStorage.getItem(MASONRY_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.wallName === 'string') return parsed.wallName;
      }
    } catch {}
    return 'جدار فاصل / واجهة';
  });

  const [unitType, setUnitType] = useState<MasonryUnitType>(() => {
    try {
      const saved = localStorage.getItem(MASONRY_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.unitType) return parsed.unitType;
      }
    } catch {}
    return 'brick_8';
  });

  const [lengthStr, setLengthStr] = useState(() => {
    try {
      const saved = localStorage.getItem(MASONRY_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lengthStr === 'string') return parsed.lengthStr;
      }
    } catch {}
    return '5';
  });
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('m');

  const [heightStr, setHeightStr] = useState(() => {
    try {
      const saved = localStorage.getItem(MASONRY_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.heightStr === 'string') return parsed.heightStr;
      }
    } catch {}
    return '3';
  });
  const [heightUnit, setHeightUnit] = useState<LengthUnit>('m');

  const [openingsStr, setOpeningsStr] = useState('0');
  const [openingsUnit, setOpeningsUnit] = useState<AreaUnit>('m2');
  const [wasteStr, setWasteStr] = useState('5');
  const [unitPriceDzdStr, setUnitPriceDzdStr] = useState('32');
  const [openingsSheetOpen, setOpeningsSheetOpen] = useState(false);

  // Auto-save last entered values in localStorage with try/catch
  React.useEffect(() => {
    try {
      localStorage.setItem(
        MASONRY_STATE_KEY,
        JSON.stringify({
          wallName,
          unitType,
          lengthStr,
          heightStr,
          wasteStr,
        })
      );
    } catch {
      // Storage quota fallback
    }
  }, [wallName, unitType, lengthStr, heightStr, wasteStr]);

  const wallLengthM = useMemo(() => toMeters(Number(lengthStr), lengthUnit), [lengthStr, lengthUnit]);
  const wallHeightM = useMemo(() => toMeters(Number(heightStr), heightUnit), [heightStr, heightUnit]);

  // Engineering compliance limits per Algerian RPA 2024
  const engineeringWarnings = useMemo(() => {
    const msgs: string[] = [];
    if (wallHeightM > 4.5) {
      msgs.push('تنبيه هندسي (RPA 2024): الارتفاع الحر للجدار يتجاوز 4.5 م، يلزم وضع أحزمة خرسانية رابطة (Chaînages) لمنع الانقلاب.');
    }
    return msgs;
  }, [wallHeightM]);
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

  const telemetryMetrics: TelemetryMetricItem[] = useMemo(
    () => [
      {
        id: 'mas-area',
        label: 'المساحة الصافية',
        value: result.netAreaM2,
        unit: 'م²',
        subtext: `كلية ${result.grossAreaM2} م²`,
        accent: 'neutral',
      },
      {
        id: 'mas-units',
        label: 'العدد المطلوب (بالهدر)',
        value: result.totalUnitsWithWaste,
        unit: 'وحدة',
        subtext: `صافي ${result.netUnits}`,
        accent: 'amber',
      },
      {
        id: 'mas-mortar',
        label: 'حجم المونة (Mortier)',
        value: result.mortarVolumeM3,
        unit: 'م³',
        accent: 'kiwi',
      },
      {
        id: 'mas-cement',
        label: 'إسمنت المونة (50 كغ)',
        value: result.cementBags50kg,
        unit: 'كيس',
        accent: 'neutral',
      },
      {
        id: 'mas-sand',
        label: 'رمل المونة المغسول',
        value: result.sandM3,
        unit: 'م³',
        accent: 'neutral',
      },
    ],
    [result]
  );

  const addQuickOpening = (areaM2: number) => {
    const currentM2 = Number.isFinite(openingsAreaM2) ? openingsAreaM2 : 0;
    const nextM2 = Number((currentM2 + areaM2).toFixed(2));
    setOpeningsUnit('m2');
    setOpeningsStr(String(nextM2));
    setOpeningsSheetOpen(false);
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
    <div className="space-y-4">
      {result.valid && (
        <LiveResultBanner
          label={`النتيجة الفورية · ${spec.label}`}
          primaryValue={`${result.totalUnitsWithWaste} وحدة`}
          secondaryDetail={`${result.mortarVolumeM3} م³ مونة`}
          costText={formatDzd(estimatedCostDzd)}
          copyCostLabel="نسخ تكلفة الجدار"
          onSave={handleSave}
          saveLabel="+ حفظ في المقايسة"
        />
      )}

      <section aria-labelledby="masonry-calc-heading" className="console-panel overflow-hidden">
        <div className="topographic-scale" aria-hidden="true" />
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#f59e0b]/25 bg-[#070b09] text-[#f59e0b]">
                <Grid2X2 className="h-5 w-5" />
              </span>
              <div>
                <h2 id="masonry-calc-heading" className="text-lg font-bold text-[#f4f7f2]">
                  حاسبة الآجر والبلوك والمونة
                </h2>
                <p className="text-xs text-[#b7c9bc]">
                  حساب الكميات مع خصم الأبواب والنوافذ وتقدير الرمل والإسمنت
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpeningsSheetOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/[0.12] bg-[#070b09] px-4 py-2 text-xs font-bold text-[#d9f99d] hover:border-[#84cc16]/50 transition-colors duration-200 whitespace-nowrap cursor-pointer"
            >
              <DoorOpen className="h-4 w-4 text-[#f59e0b]" />
              <span>خصم فتحات سريعة{openingsAreaM2 > 0 ? ` (${openingsAreaM2.toFixed(1)} م²)` : ''}</span>
            </button>
          </div>

          {/* Brick / Block Type Selector */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#b7c9bc]">
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
                    className={`min-h-[54px] rounded-[12px] border p-3 text-right transition-colors duration-200 cursor-pointer ${
                      active
                        ? 'border-[#84cc16] bg-[#84cc16]/14 text-[#f4f7f2]'
                        : 'border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:border-white/20'
                    }`}
                  >
                    <div className={`text-xs font-bold ${active ? 'text-[#84cc16]' : 'text-[#f4f7f2]'}`}>
                      {item.label}
                    </div>
                    <div className="mt-1 font-mono-tabular text-[11px] text-[#b7c9bc]">
                      <bdi dir="ltr">{item.dimensionsCm}</bdi> · <bdi dir="ltr">{item.unitsPerM2}/م²</bdi>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
              {/* Engineering Warnings per Algerian RPA */}
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

              {/* 2-Column Grid for Ergonomic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="mas-openings" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                    مساحة الفتحات
                  </label>
                  <div className="dz-input-control flex min-h-[46px] items-stretch overflow-hidden rounded-[14px] border border-[#24352b] bg-[#070b09] focus-within:border-[#f59e0b]">
                    <input
                      id="mas-openings"
                      type="number"
                      min="0"
                      step={openingsUnit === 'm2' ? '0.2' : '100'}
                      value={openingsStr}
                      onChange={(e) => setOpeningsStr(e.target.value)}
                      className="font-mono-tabular w-full min-w-0 bg-transparent px-3 py-2 text-sm font-bold text-[#f4f7f2] outline-none"
                    />
                    <label htmlFor="mas-openings-unit" className="sr-only">
                      وحدة مساحة الفتحات
                    </label>
                    <select
                      id="mas-openings-unit"
                      value={openingsUnit}
                      onChange={(e) => setOpeningsUnit(e.target.value as AreaUnit)}
                      className="border-r border-[#24352b] bg-[#141d18] px-3 text-xs font-bold text-[#f59e0b] outline-none cursor-pointer"
                    >
                      <option value="m2" className="bg-[#0f1612]">م²</option>
                      <option value="cm2" className="bg-[#0f1612]">سم²</option>
                      <option value="ft2" className="bg-[#0f1612]">قدم²</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="mas-name-quick" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                    تسمية الجدار
                  </label>
                  <input
                    id="mas-name-quick"
                    type="text"
                    value={wallName}
                    onChange={(e) => setWallName(e.target.value)}
                    className="w-full min-h-[46px] rounded-[14px] border border-[#24352b] bg-[#070b09] px-3.5 py-2.5 text-sm text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                  />
                </div>
              </div>

              <CollapsibleSection
                title="خيارات متقدمة"
                subtitle="نسبة الهدر، وسعر الوحدة (دج)"
                badge={`هدر ${wasteStr}%`}
                icon={<SlidersHorizontal className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="mas-waste" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
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
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3 py-2 text-sm font-bold text-[#f4f7f2] outline-none focus:border-[#84cc16]"
                    />
                  </div>
                  <div>
                    <label htmlFor="mas-unit-price" className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]">
                      سعر الآجرة / البلوكة (دج)
                    </label>
                    <input
                      id="mas-unit-price"
                      type="number"
                      min="0"
                      step="1"
                      value={unitPriceDzdStr}
                      onChange={(e) => setUnitPriceDzdStr(e.target.value)}
                      className="font-mono-tabular w-full min-h-[44px] rounded-[12px] border border-white/[0.09] bg-[#0f1612] px-3 py-2 text-sm font-bold text-[#f59e0b] outline-none focus:border-[#f59e0b]"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            <div className="lg:col-span-5">
              <div className="hidden lg:block">
                <MasonryCadDiagram
                  lengthLabel={`${lengthStr || 0}${LENGTH_UNITS[lengthUnit].symbol}`}
                  heightLabel={`${heightStr || 0}${LENGTH_UNITS[heightUnit].symbol}`}
                  openingsM2={Number.isFinite(openingsAreaM2) ? openingsAreaM2 : 0}
                  grossAreaM2={result.grossAreaM2}
                  brickLabel={spec.label}
                />
              </div>
              <div className="lg:hidden">
                <CollapsibleSection
                  title="مخطط واجهة الجدار (CAD)"
                  subtitle="معاينة المساحة الصافية ومناطق الفتحات"
                  icon={<Layers className="h-4 w-4 text-[#84cc16]" />}
                >
                  <MasonryCadDiagram
                    lengthLabel={`${lengthStr || 0}${LENGTH_UNITS[lengthUnit].symbol}`}
                    heightLabel={`${heightStr || 0}${LENGTH_UNITS[heightUnit].symbol}`}
                    openingsM2={Number.isFinite(openingsAreaM2) ? openingsAreaM2 : 0}
                    grossAreaM2={result.grossAreaM2}
                    brickLabel={spec.label}
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
              <div className="text-xs font-bold text-[#d9f99d]">تفاصيل الآجر ومواد المونة</div>
              <TelemetryReadoutStrip
                testId="masonry-results"
                items={telemetryMetrics}
                columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
              />

              <button
                type="button"
                onClick={() => {
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
                }}
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

      {/* Bottom Sheet: Door & Window Quick Deductions */}
      <BottomSheet
        open={openingsSheetOpen}
        onClose={() => setOpeningsSheetOpen(false)}
        title="خصم الفتحات القياسية"
        subtitle="أضف مساحة الأبواب أو النوافذ لخصمها تلقائياً من الجدار"
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => addQuickOpening(1.89)}
            className="w-full min-h-[48px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-4 py-3 text-right text-sm font-bold text-[#d9f99d] hover:border-[#84cc16]/60 transition-colors duration-200 cursor-pointer"
          >
            + باب قياسي (<bdi dir="ltr">0.9 × 2.1 m</bdi>)
          </button>
          <button
            type="button"
            onClick={() => addQuickOpening(1.44)}
            className="w-full min-h-[48px] rounded-[12px] border border-white/[0.09] bg-[#070b09] px-4 py-3 text-right text-sm font-bold text-[#d9f99d] hover:border-[#84cc16]/60 transition-colors duration-200 cursor-pointer"
          >
            + نافذة (<bdi dir="ltr">1.2 × 1.2 m</bdi>)
          </button>
          {openingsAreaM2 > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpeningsStr('0');
                setOpeningsSheetOpen(false);
              }}
              className="w-full min-h-[48px] rounded-[12px] border border-[#f59e0b]/40 bg-[#070b09] px-4 py-3 text-right text-sm font-bold text-[#f59e0b] hover:border-[#f59e0b] transition-colors duration-200 cursor-pointer"
            >
              تصفير الفتحات
            </button>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
