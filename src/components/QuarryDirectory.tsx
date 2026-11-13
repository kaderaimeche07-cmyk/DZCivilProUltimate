import React from 'react';
import { LocateFixed, Search, Navigation, MapPin, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { ALGERIAN_WILAYAT } from '../data/wilayat';
import { MATERIAL_LABELS, type MaterialCategory } from '../data/quarries';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { formatDistanceKm, formatDurationAr } from '../utils/gps.locator';
import { CollapsibleSection } from './CollapsibleSection';

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
  const activeCatLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'الكل';

  return (
    <div className="space-y-4">
      {/* Unified Wilaya + GPS + Search Control Console */}
      <div className="console-panel overflow-hidden">
        <div className="topographic-scale" aria-hidden="true" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div>
              <label
                htmlFor="wilaya-select"
                className="mb-1.5 block text-xs font-semibold text-[#b7c9bc]"
              >
                الولاية (58 ولاية)
              </label>
              <select
                id="wilaya-select"
                value={selectedWilayaCode}
                onChange={(e) => onSelectWilaya(e.target.value)}
                className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] px-3.5 py-2.5 text-sm font-medium text-[#f4f7f2] outline-none focus:border-[#84cc16]"
              >
                {ALGERIAN_WILAYAT.map((w) => (
                  <option key={w.code} value={w.code} className="bg-[#0f1612] text-[#f4f7f2]">
                    {w.code} - {w.arName} ({w.frName})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onLocateGps}
              disabled={isLocating}
              className="btn-kiwi flex min-h-[46px] w-full items-center justify-center gap-2 px-4 py-2.5 text-sm cursor-pointer disabled:opacity-70"
            >
              <LocateFixed className="h-4 w-4 shrink-0" />
              <span>{isLocating ? 'جاري التقاط GPS...' : 'تحديد موقعي (GPS)'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <label htmlFor="quarry-search" className="sr-only">
              ابحث عن محجرة أو بلدية أو مادة بناء
            </label>
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7c9bc]" />
            <input
              id="quarry-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث بالاسم، البلدية، أو المادة (8/15، CPJ 42.5)..."
              className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] pr-10 pl-4 py-2 text-sm text-[#f4f7f2] placeholder:text-[#728879] outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* Progressive Disclosure for Material Filters */}
          <CollapsibleSection
            title="تصفية حسب المادة"
            badge={activeCatLabel}
            icon={<Filter className="h-4 w-4" />}
          >
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="تصفية حسب نوع المادة">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`min-h-[44px] rounded-[12px] px-3.5 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#84cc16] text-[#060a05]'
                        : 'border border-white/[0.08] bg-[#0f1612] text-[#b7c9bc] hover:text-[#f4f7f2]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Compact Origin Status Line */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-3 text-xs text-[#b7c9bc]">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${
                  origin.source === 'gps' ? 'text-[#84cc16]' : 'text-[#f59e0b]'
                }`}
              />
              <span>
                المرجع: <strong className="text-[#f4f7f2]">{origin.label}</strong>
              </span>
            </div>
            <span>
              المواقع: <strong className="font-mono-tabular text-[#84cc16]">{quarries.length}</strong>
            </span>
          </div>

          {gpsError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[14px] border border-[#f59e0b]/35 bg-[#f59e0b]/10 p-3 text-xs leading-relaxed text-[#fde68a]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Distance Matrix List */}
      <div
        data-testid="quarry-distance-list"
        className="space-y-2.5 max-h-[500px] overflow-y-auto pl-1"
      >
        {quarries.length === 0 ? (
          <div className="console-panel p-8 text-center space-y-2.5">
            <MapPin className="mx-auto h-7 w-7 text-[#728879]" />
            <p className="text-sm font-semibold text-[#f4f7f2]">
              لم يتم العثور على محاجر مطابقة لبحثك
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-[12px] border border-white/10 bg-[#070b09] px-4 py-2 text-xs font-semibold text-[#f4f7f2] hover:border-[#84cc16]/50 cursor-pointer"
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
                className={`w-full text-right rounded-[14px] p-4 transition-colors duration-200 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#141d18] border-[#84cc16]/75'
                    : 'bg-[#0f1612]/95 border-white/[0.08] hover:border-white/20 hover:bg-[#141d18]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#f59e0b]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-sm font-bold text-[#f4f7f2] truncate">
                        {quarry.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#b7c9bc]">
                      <span><bdi dir="ltr">{quarry.wilayaCode}</bdi> {quarry.wilayaName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#84cc16] font-semibold">{quarry.categoryLabel}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left">
                    <div className="flex items-center justify-end gap-1 font-mono-tabular text-base font-extrabold text-[#84cc16]">
                      <span className="whitespace-nowrap"><bdi dir="ltr">{formatDistanceKm(quarry.distanceKm)}</bdi></span>
                      <Navigation className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-[11px] text-[#b7c9bc] whitespace-nowrap">
                      <bdi dir="ltr">~ {formatDurationAr(quarry.estimatedMinutes)}</bdi>
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
