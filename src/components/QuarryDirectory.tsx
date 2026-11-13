import React from 'react';
import { LocateFixed, Search, Navigation, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ALGERIAN_WILAYAT } from '../data/wilayat';
import { MATERIAL_LABELS, type MaterialCategory } from '../data/quarries';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { formatDistanceKm, formatDurationAr } from '../utils/gps.locator';

interface QuarryDirectoryProps {
  selectedWilayaCode: string;
  onSelectWilaya: (code: string) => void;
  origin: GeoCoordinates;
  gpsError: string | null;
  isLocating: boolean;
  onLocateGps: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: MaterialCategory | 'all';
  onSelectCategory: (cat: MaterialCategory | 'all') => void;
  quarries: QuarryWithDistance[];
  selectedQuarryId: string | null;
  onSelectQuarry: (quarry: QuarryWithDistance) => void;
}

const CATEGORIES: { id: MaterialCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'gravier', label: MATERIAL_LABELS.gravier },
  { id: 'sable', label: MATERIAL_LABELS.sable },
  { id: 'ciment', label: MATERIAL_LABELS.ciment },
  { id: 'enrochement', label: MATERIAL_LABELS.enrochement },
];

export const QuarryDirectory: React.FC<QuarryDirectoryProps> = ({
  selectedWilayaCode,
  onSelectWilaya,
  origin,
  gpsError,
  isLocating,
  onLocateGps,
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  quarries,
  selectedQuarryId,
  onSelectQuarry,
}) => {
  return (
    <div className="space-y-4">
      {/* Wilaya Selector + GPS Location Status */}
      <div className="glass-surface rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
          <div>
            <label
              htmlFor="wilaya-select"
              className="mb-1.5 block text-xs font-semibold text-[#c5d6c9]"
            >
              اختر الولاية (58 ولاية جزائرية)
            </label>
            <select
              id="wilaya-select"
              value={selectedWilayaCode}
              onChange={(e) => onSelectWilaya(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] px-3.5 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#84cc16]"
            >
              {ALGERIAN_WILAYAT.map((w) => (
                <option key={w.code} value={w.code} className="bg-[#121b15] text-white">
                  {w.code} - {w.arName} ({w.frName})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onLocateGps}
            disabled={isLocating}
            className="btn-kiwi flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm cursor-pointer disabled:opacity-70"
          >
            <LocateFixed className="h-4 w-4 shrink-0" />
            <span>{isLocating ? 'جاري التقاط GPS...' : '📍 حدد موقعي الحالي (GPS)'}</span>
          </button>
        </div>

        {/* Active Origin Coordinates Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs">
          <div className="flex items-center gap-2 text-[#c5d6c9]">
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${
                origin.source === 'gps' ? 'text-[#a3e635]' : 'text-[#f59e0b]'
              }`}
            />
            <span>
              نقطة القياس النشطة: <strong className="text-white">{origin.label}</strong>
            </span>
          </div>
          <div className="font-mono-tabular text-[#a3b8a8]" dir="ltr">
            {origin.lat.toFixed(4)}° N, {origin.lng.toFixed(4)}° E
            {origin.accuracyMeters ? ` (±${origin.accuracyMeters}m)` : ''}
          </div>
        </div>

        {gpsError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[#f59e0b]/35 bg-[#f59e0b]/10 p-3 text-xs leading-relaxed text-[#fde68a]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Search & Material Filters */}
      <div className="glass-surface rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="relative">
          <label htmlFor="quarry-search" className="sr-only">
            ابحث عن محجرة أو بلدية أو مادة بناء
          </label>
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3b8a8]" />
          <input
            id="quarry-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم، الولاية، البلدية، أو نوع المادة (مثلاً: 8/15، CPJ 42.5)..."
            className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0b110d] pr-10 pl-4 py-2 text-sm text-white placeholder:text-[#6b7f70] outline-none transition-colors focus:border-[#84cc16]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="تصفية حسب نوع المادة">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(cat.id)}
                className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#84cc16] text-[#081006]'
                    : 'bg-[#1a261e] text-[#c5d6c9] hover:bg-[#223227] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-[#a3b8a8] pt-1">
          <span>
            المواقع المطابقة: <strong className="font-mono-tabular text-white">{quarries.length}</strong>
          </span>
          <span>مرتبة حسب أقرب مسافة جغرافية (Haversine)</span>
        </div>
      </div>

      {/* Distance Matrix List */}
      <div
        data-testid="quarry-distance-list"
        className="space-y-2.5 max-h-[540px] overflow-y-auto pl-1"
      >
        {quarries.length === 0 ? (
          <div className="glass-surface rounded-2xl p-8 text-center space-y-2">
            <MapPin className="mx-auto h-7 w-7 text-[#6b7f70]" />
            <p className="text-sm font-semibold text-slate-200">
              لم يتم العثور على محاجر مطابقة لبحثك
            </p>
            <p className="text-xs text-[#a3b8a8]">
              جرّب إزالة نص البحث أو اختيار فئة &quot;الكل&quot; لعرض جميع المحاجر والمصانع.
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
              className="mt-2 inline-flex min-h-[40px] items-center rounded-xl border border-white/10 bg-[#1a261e] px-4 py-2 text-xs font-semibold text-white hover:border-[#84cc16]/40 cursor-pointer"
            >
              إعادة ضبط التصفية
            </button>
          </div>
        ) : (
          quarries.map((quarry, idx) => {
            const isSelected = quarry.id === selectedQuarryId;
            return (
              <button
                key={quarry.id}
                type="button"
                onClick={() => onSelectQuarry(quarry)}
                className={`w-full text-right rounded-2xl p-4 transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1a261e] border-[#84cc16]/75'
                    : 'bg-[#121b15]/90 border-white/[0.08] hover:border-white/20 hover:bg-[#17231b]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#fbbf24]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {quarry.name}
                      </h3>
                    </div>

                    {/* Zero-pill unboxed metadata with middle-dot separators */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#a3b8a8]">
                      <span>
                        {quarry.wilayaCode} {quarry.wilayaName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{quarry.municipality}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#a3e635] font-medium">{quarry.categoryLabel}</span>
                    </div>

                    <p className="text-xs text-[#d4e2d7] pt-1">
                      المواد: {quarry.materials.join(' · ')}
                    </p>
                    <p className="text-[11px] text-[#a3b8a8]">
                      {quarry.rockType} — {quarry.capacityNote}
                    </p>
                  </div>

                  {/* Live Haversine Distance Metric */}
                  <div className="shrink-0 text-left">
                    <div className="flex items-center justify-end gap-1 font-mono-tabular text-base font-bold text-[#a3e635]">
                      <span>{formatDistanceKm(quarry.distanceKm)}</span>
                      <Navigation className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-[11px] text-[#a3b8a8]">
                      ~ {formatDurationAr(quarry.estimatedMinutes)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
