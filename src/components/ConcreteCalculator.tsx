import React, { useMemo, useState } from 'react';
import { Box, Plus, AlertCircle } from 'lucide-react';
import { calculateConcreteMix, type ConcreteDosage } from '../utils/calculators.engine';
import type { SavedBoqItem } from '../types/boq';

interface ConcreteCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const DOSAGES: { value: ConcreteDosage; label: string; useCase: string }[] = [
  { value: 250, label: '250 كغ/م³', useCase: 'خرسانة نظافة (Béton de propreté)' },
  { value: 300, label: '300 كغ/م³', useCase: 'دكة أرضية وأعمال ثانوية' },
  { value: 350, label: '350 كغ/م³', useCase: 'خرسانة مسلحة قياسية (أساسات، أعمدة، بلاطات)' },
  { value: 400, label: '400 كغ/م³', useCase: 'عناصر عالية المقاومة ومنشآت فنية' },
];

export const ConcreteCalculator: React.FC<ConcreteCalculatorProps> = ({ onSaveToBoq }) => {
  const [elementName, setElementName] = useState('بلاطة أرضية / أساس');
  const [lengthStr, setLengthStr] = useState('10');
  const [widthStr, setWidthStr] = useState('5');
  const [thicknessStr, setThicknessStr] = useState('0.20');
  const [dosage, setDosage] = useState<ConcreteDosage>(350);
  const [wasteStr, setWasteStr] = useState('5');

  const result = useMemo(() => {
    return calculateConcreteMix({
      lengthM: Number(lengthStr),
      widthM: Number(widthStr),
      thicknessM: Number(thicknessStr),
      dosageKgPerM3: dosage,
      wastePercent: Number(wasteStr) || 0,
    });
  }, [lengthStr, widthStr, thicknessStr, dosage, wasteStr]);

  const handleSave = () => {
    if (!result.valid) return;
    onSaveToBoq({
      id: `conc-${Date.now()}`,
      category: 'concrete',
      categoryLabel: 'الخرسانة',
      title: `${elementName.trim() || 'عنصر خرساني'} (${dosage} كغ/م³)`,
      summary: `${lengthStr}م × ${widthStr}م × ${thicknessStr}م · هدر ${wasteStr}%`,
      metrics: [
        { label: 'الحجم الإجمالي', value: `${result.grossVolumeM3} م³` },
        { label: 'الإسمنت (50 كغ)', value: `${result.cementBags50kg} كيس (${result.cementKg} كغ)` },
        { label: 'الرمل (0/3)', value: `${result.sandM3} م³ (${result.sandTonnes} طن)` },
        { label: 'الحصى (8/15-15/25)', value: `${result.gravelM3} م³ (${result.gravelTonnes} طن)` },
      ],
      createdAtIso: new Date().toISOString(),
    });
  };

  return (
    <section aria-labelledby="concrete-calc-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9f1c]/15 text-[#ff9f1c]">
            <Box className="h-5 w-5" />
          </span>
          <div>
            <h2 id="concrete-calc-heading" className="text-lg font-bold text-white">
              حاسبة الخرسانة والخلطة الميدانية
            </h2>
            <p className="text-xs text-slate-400">
              معايرة محلية جزائرية (350 كغ/م³ CPJ 42.5 افتراضياً) مع حساب الأكياس والركام
            </p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="conc-name" className="mb-1.5 block text-xs font-semibold text-slate-300">
            اسم العنصر
          </label>
          <input
            id="conc-name"
            type="text"
            value={elementName}
            onChange={(e) => setElementName(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="conc-length" className="mb-1.5 block text-xs font-semibold text-slate-300">
            الطول (م)
          </label>
          <input
            id="conc-length"
            type="number"
            min="0.01"
            step="0.1"
            value={lengthStr}
            onChange={(e) => setLengthStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="conc-width" className="mb-1.5 block text-xs font-semibold text-slate-300">
            العرض (م)
          </label>
          <input
            id="conc-width"
            type="number"
            min="0.01"
            step="0.1"
            value={widthStr}
            onChange={(e) => setWidthStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="conc-thickness" className="mb-1.5 block text-xs font-semibold text-slate-300">
            السمك / الارتفاع (م)
          </label>
          <input
            id="conc-thickness"
            type="number"
            min="0.01"
            step="0.05"
            value={thicknessStr}
            onChange={(e) => setThicknessStr(e.target.value)}
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
        <div>
          <label htmlFor="conc-waste" className="mb-1.5 block text-xs font-semibold text-slate-300">
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
            className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
          />
        </div>
      </div>

      {/* Dosage Selector */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-slate-300">
          عيار الإسمنت (Dosage)
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DOSAGES.map((d) => {
            const active = dosage === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDosage(d.value)}
                className={`min-h-[48px] rounded-xl border p-3 text-right transition-colors cursor-pointer ${
                  active
                    ? 'border-[#2ec4b6] bg-[#2ec4b6]/12 text-white'
                    : 'border-white/[0.08] bg-[#0f1419]/70 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className={`font-mono-tabular text-sm font-bold ${active ? 'text-[#2ec4b6]' : 'text-white'}`}>
                  {d.label}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{d.useCase}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output or Validation Error */}
      {!result.valid ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#ff9f1c]/40 bg-[#ff9f1c]/10 p-3.5 text-xs text-[#ffbe6b]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#ff9f1c]" />
          <span>{result.error}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            data-testid="concrete-results"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-t border-white/[0.08] pt-4"
          >
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">الحجم الصافي</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.netVolumeM3} <span className="text-xs font-normal text-slate-400">م³</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">الحجم مع الهدر</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#2ec4b6]">
                {result.grossVolumeM3} <span className="text-xs font-normal text-slate-400">م³</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">أكياس الإسمنت (50 كغ)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-[#ff9f1c]">
                {result.cementBags50kg} <span className="text-xs font-normal text-slate-400">كيس</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">{result.cementKg} كغ</div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">رمل البناء (0/3)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.sandM3} <span className="text-xs font-normal text-slate-400">م³</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">{result.sandTonnes} طن</div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">حصى (8/15 و 15/25)</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.gravelM3} <span className="text-xs font-normal text-slate-400">م³</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">{result.gravelTonnes} طن</div>
            </div>
            <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
              <div className="text-[11px] text-slate-400">ماء الخلط / خلاطات</div>
              <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                {result.waterLiters} <span className="text-xs font-normal text-slate-400">لتر</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">
                {result.mixTrucks7m3} شاحنة (7م³)
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
