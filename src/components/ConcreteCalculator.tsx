import React, { useMemo, useState } from 'react';
import { Box, Plus, AlertCircle, Coins } from 'lucide-react';
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
import type { SavedBoqItem } from '../types/boq';

interface ConcreteCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const DOSAGES: { value: ConcreteDosage; label: string; useCase: string }[] = [
  { value: 250, label: '250 كغ/م³', useCase: 'خرسانة نظافة (Propreté)' },
  { value: 300, label: '300 كغ/م³', useCase: 'دكة أرضية وأرصفة' },
  { value: 350, label: '350 كغ/م³', useCase: 'خرسانة مسلحة قياسية' },
  { value: 400, label: '400 كغ/م³', useCase: 'أعمدة ومنشآت فنية' },
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
  { id: 'slab', label: 'بلاطة أرضية', name: 'بلاطة أرضية خرسانية', l: '10', lu: 'm', w: '5', wu: 'm', t: '20', tu: 'cm', dosage: 350 },
  { id: 'column', label: 'عمود (Poteau)', name: 'عمود خرساني 35×35 سم', l: '35', lu: 'cm', w: '35', wu: 'cm', t: '3.2', tu: 'm', dosage: 350 },
  { id: 'beam', label: 'كمرة (Poutre)', name: 'كمرة رئيسية 30×45 سم', l: '4.5', lu: 'm', w: '30', wu: 'cm', t: '45', tu: 'cm', dosage: 350 },
  { id: 'footing', label: 'أساس (Semelle)', name: 'أساس منفرد 1.5×1.5 م', l: '150', lu: 'cm', w: '150', wu: 'cm', t: '40', tu: 'cm', dosage: 350 },
];

export const ConcreteCalculator: React.FC<ConcreteCalculatorProps> = ({ onSaveToBoq }) => {
  const [elementName, setElementName] = useState('بلاطة أرضية خرسانية');
  const [lengthStr, setLengthStr] = useState('10');
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('m');
  const [widthStr, setWidthStr] = useState('5');
  const [widthUnit, setWidthUnit] = useState<LengthUnit>('m');
  const [thicknessStr, setThicknessStr] = useState('20');
  const [thicknessUnit, setThicknessUnit] = useState<LengthUnit>('cm');
  const [dosage, setDosage] = useState<ConcreteDosage>(350);
  const [wasteStr, setWasteStr] = useState('5');
  const [outputVolUnit, setOutputVolUnit] = useState<VolumeUnit>('m3');

  const [showPricing, setShowPricing] = useState(false);
  const [bagPriceStr, setBagPriceStr] = useState(String(DEFAULT_CONCRETE_PRICES_DZD.cementBag50kg));
  const [sandPriceStr, setSandPriceStr] = useState(String(DEFAULT_CONCRETE_PRICES_DZD.sandM3));
  const [gravelPriceStr, setGravelPriceStr] = useState(String(DEFAULT_CONCRETE_PRICES_DZD.gravelM3));

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
  };

  const applyAllUnits = (unit: LengthUnit) => {
    setLengthUnit(unit);
    setWidthUnit(unit);
    setThicknessUnit(unit);
  };

  const displayedNetVol = formatEngineeringNumber(fromCubicMeters(result.netVolumeM3, outputVolUnit), 3);
  const displayedGrossVol = formatEngineeringNumber(fromCubicMeters(result.grossVolumeM3, outputVolUnit), 3);
  const volSymbol = outputVolUnit === 'm3' ? 'م³' : 'لتر';

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
    <section aria-labelledby="concrete-calc-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header + Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/15 text-[#a3e635]">
            <Box className="h-5 w-5" />
          </span>
          <div>
            <h2 id="concrete-calc-heading" className="text-lg font-bold text-white">
              حاسبة الخرسانة والخلطة الميدانية
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              ادخال مرن بأي وحدة قياس (م، سم، ملم، قدم) مع معايرة CPJ 42.5 ومخطط 3D
            </p>
          </div>
        </div>

        {/* Quick Element Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="min-h-[36px] rounded-lg border border-white/[0.08] bg-[#1a261e] px-3 py-1.5 text-xs font-semibold text-[#d9f99d] hover:border-[#84cc16]/50 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Inputs on Start, Live Parametric CAD Visual on End */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Unified Unit Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#a3b8a8]">توحيد وحدة الأبعاد:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['m', 'cm', 'mm', 'ft'] as LengthUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => applyAllUnits(u)}
                  className="min-h-[32px] rounded-lg border border-white/10 bg-[#0b110d] px-2.5 py-1 text-xs font-bold text-[#c5d6c9] hover:border-[#84cc16]/60 hover:text-[#a3e635] cursor-pointer"
                >
                  {LENGTH_UNITS[u].arName} ({LENGTH_UNITS[u].symbol})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label htmlFor="conc-name" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
                اسم العنصر الإنشائي
              </label>
              <input
                id="conc-name"
                type="text"
                value={elementName}
                onChange={(e) => setElementName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
              />
            </div>

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
            <UnitInputField
              id="conc-thickness"
              label="السمك / الارتفاع (H)"
              valueStr={thicknessStr}
              onValueChange={setThicknessStr}
              unit={thicknessUnit}
              onUnitChange={setThicknessUnit}
            />

            <div>
              <label htmlFor="conc-waste" className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]">
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
                className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>

          {/* Dosage Selector */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#c5d6c9]">
              عيار الإسمنت (Dosage)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DOSAGES.map((d) => {
                const active = dosage === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDosage(d.value)}
                    className={`min-h-[52px] rounded-xl border p-2.5 text-right transition-colors cursor-pointer ${
                      active
                        ? 'border-[#84cc16] bg-[#84cc16]/14 text-white'
                        : 'border-white/[0.08] bg-[#0b110d]/80 text-[#c5d6c9] hover:border-white/20'
                    }`}
                  >
                    <div className={`font-mono-tabular text-sm font-bold ${active ? 'text-[#a3e635]' : 'text-white'}`}>
                      {d.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#a3b8a8]">{d.useCase}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Parametric 3D CAD Schematic */}
        <div className="lg:col-span-5 space-y-3">
          <ConcreteCadDiagram
            lengthLabel={`${lengthStr || 0}${LENGTH_UNITS[lengthUnit].symbol}`}
            widthLabel={`${widthStr || 0}${LENGTH_UNITS[widthUnit].symbol}`}
            thicknessLabel={`${thicknessStr || 0}${LENGTH_UNITS[thicknessUnit].symbol}`}
            dosage={dosage}
            result={result}
          />

          {/* Collapsible DZD Unit Pricing */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0b110d]/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="text-[#a3b8a8]">التكلفة التقديرية للمواد: </span>
                <strong className="font-mono-tabular text-sm text-[#fbbf24]">
                  {formatDzd(estimatedCostDzd)}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setShowPricing((v) => !v)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a261e] px-2.5 py-1 text-xs font-semibold text-[#d9f99d] hover:border-[#84cc16]/50 cursor-pointer"
              >
                <Coins className="h-3.5 w-3.5 text-[#fbbf24]" />
                <span>{showPricing ? 'إخفاء الأسعار' : 'تعديل الأسعار (دج)'}</span>
              </button>
            </div>

            {showPricing && (
              <div className="grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-3 text-xs">
                <div>
                  <label htmlFor="price-bag" className="mb-1 block text-[11px] text-[#a3b8a8]">
                    كيس إسمنت (دج)
                  </label>
                  <input
                    id="price-bag"
                    type="number"
                    min="0"
                    value={bagPriceStr}
                    onChange={(e) => setBagPriceStr(e.target.value)}
                    className="font-mono-tabular w-full min-h-[38px] rounded-lg border border-white/10 bg-[#121b15] px-2.5 text-white outline-none focus:border-[#84cc16]"
                  />
                </div>
                <div>
                  <label htmlFor="price-sand" className="mb-1 block text-[11px] text-[#a3b8a8]">
                    م³ رمل (دج)
                  </label>
                  <input
                    id="price-sand"
                    type="number"
                    min="0"
                    value={sandPriceStr}
                    onChange={(e) => setSandPriceStr(e.target.value)}
                    className="font-mono-tabular w-full min-h-[38px] rounded-lg border border-white/10 bg-[#121b15] px-2.5 text-white outline-none focus:border-[#84cc16]"
                  />
                </div>
                <div>
                  <label htmlFor="price-gravel" className="mb-1 block text-[11px] text-[#a3b8a8]">
                    م³ حصى (دج)
                  </label>
                  <input
                    id="price-gravel"
                    type="number"
                    min="0"
                    value={gravelPriceStr}
                    onChange={(e) => setGravelPriceStr(e.target.value)}
                    className="font-mono-tabular w-full min-h-[38px] rounded-lg border border-white/10 bg-[#121b15] px-2.5 text-white outline-none focus:border-[#84cc16]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Strip or Validation Alert */}
      {!result.valid ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
          <span>{result.error}</span>
        </div>
      ) : (
        <div className="space-y-4 border-t border-white/[0.08] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#d9f99d]">نتائج الخلطة والكميات المطلوبة</span>
            <div className="flex items-center gap-1 rounded-lg bg-[#0b110d] p-1 border border-white/[0.08]">
              {(['m3', 'L'] as VolumeUnit[]).map((vu) => (
                <button
                  key={vu}
                  type="button"
                  onClick={() => setOutputVolUnit(vu)}
                  className={`min-h-[30px] rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    outputVolUnit === vu ? 'bg-[#84cc16] text-[#081006]' : 'text-[#a3b8a8] hover:text-white'
                  }`}
                >
                  {vu === 'm3' ? 'عرض بـ م³' : 'عرض باللتر'}
                </button>
              ))}
            </div>
          </div>

          <div
            data-testid="concrete-results"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">الحجم الصافي</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {displayedNetVol} <span className="text-xs font-normal text-[#a3b8a8]">{volSymbol}</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#84cc16]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">الحجم مع الهدر</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#a3e635]">
                {displayedGrossVol} <span className="text-xs font-normal text-[#a3b8a8]">{volSymbol}</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-[#f59e0b]/25 p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">أكياس الإسمنت (50 كغ)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#fbbf24]">
                {result.cementBags50kg} <span className="text-xs font-normal text-[#a3b8a8]">كيس</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">{result.cementKg} كغ</div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">رمل البناء (0/3)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.sandM3} <span className="text-xs font-normal text-[#a3b8a8]">م³</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">{result.sandTonnes} طن</div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">حصى (8/15 و 15/25)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.gravelM3} <span className="text-xs font-normal text-[#a3b8a8]">م³</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">{result.gravelTonnes} طن</div>
            </div>
            <div className="rounded-xl bg-[#0b110d]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-[#a3b8a8]">ماء الخلط / خلاطات</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.waterLiters} <span className="text-xs font-normal text-[#a3b8a8]">لتر</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">
                {result.mixTrucks7m3} شاحنة (7م³)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#a3b8a8]">
              التكلفة الإجمالية المقدرة: <strong className="font-mono-tabular text-[#fbbf24]">{formatDzd(estimatedCostDzd)}</strong>
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
