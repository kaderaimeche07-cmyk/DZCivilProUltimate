import React from 'react';
import { LocateFixed, Search, Navigation, MapPin, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { ALGERIAN_WILAYAT, findWilayaByCode } from '../data/wilayat';
import { type MaterialCategory } from '../data/quarries';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { CollapsibleSection } from './CollapsibleSection';
import { useI18n } from '../i18n/I18nContext';
import {
  formatDistanceLocale,
  formatDurationLocale,
  getQuarryCategoryLabel,
} from '../i18n/translations';

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

const CATEGORY_IDS: (MaterialCategory | 'all')[] = [
  'all',
  'gravier',
  'sable',
  'ciment',
  'enrochement',
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
  const { lang, t } = useI18n();

  const categories = CATEGORY_IDS.map((id) => ({
    id,
    label: id === 'all' ? t.quarries.allCategory : getQuarryCategoryLabel(id, lang),
  }));

  const activeCatLabel = categories.find((c) => c.id === activeCategory)?.label ?? t.quarries.allCategory;

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
                {t.quarries.wilayaSelectLabel}
              </label>
              <select
                id="wilaya-select"
                value={selectedWilayaCode}
                onChange={(e) => onSelectWilaya(e.target.value)}
                className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] px-3.5 py-2.5 text-sm font-medium text-[#f4f7f2] outline-none focus:border-[#84cc16]"
              >
                {ALGERIAN_WILAYAT.map((w) => (
                  <option key={w.code} value={w.code} className="bg-[#0f1612] text-[#f4f7f2]">
                    {lang === 'ar'
                      ? `${w.code} - ${w.arName} (${w.frName})`
                      : `${w.code} - ${w.frName} (${w.arName})`}
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
              <span>{isLocating ? t.quarries.gpsBtnLoading : t.quarries.gpsBtnIdle}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <label htmlFor="quarry-search" className="sr-only">
              {t.quarries.searchSr}
            </label>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7c9bc]" />
            <input
              id="quarry-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.quarries.searchPlaceholder}
              className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] ps-10 pe-4 py-2 text-sm text-[#f4f7f2] placeholder:text-[#728879] outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* Progressive Disclosure for Material Filters */}
          <CollapsibleSection
            title={t.quarries.filterSectionTitle}
            badge={activeCatLabel}
            icon={<Filter className="h-4 w-4" />}
          >
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.quarries.filterAria}>
              {categories.map((cat) => {
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
                {t.quarries.originLabel} <strong className="text-[#f4f7f2]">{origin.label}</strong>
              </span>
            </div>
            <span>
              {t.quarries.sitesLabel}{' '}
              <strong className="font-mono-tabular text-[#84cc16]">{quarries.length}</strong>
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
        className="space-y-2.5 max-h-[500px] overflow-y-auto pe-1"
      >
        {quarries.length === 0 ? (
          <div className="console-panel p-8 text-center space-y-2.5">
            <MapPin className="mx-auto h-7 w-7 text-[#728879]" />
            <p className="text-sm font-semibold text-[#f4f7f2]">
              {t.quarries.noResults}
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-[12px] border border-white/10 bg-[#070b09] px-4 py-2 text-xs font-semibold text-[#f4f7f2] hover:border-[#84cc16]/50 cursor-pointer"
            >
              {t.quarries.resetFilter}
            </button>
          </div>
        ) : (
          quarries.map((quarry, idx) => {
            const isSelected = quarry.id === selectedQuarryId;
            const wilayaObj = findWilayaByCode(quarry.wilayaCode);
            const wilayaDisplayName =
              lang === 'ar' ? quarry.wilayaName : (wilayaObj?.frName ?? quarry.wilayaName);
            const categoryLabel = getQuarryCategoryLabel(quarry.category, lang);

            return (
              <button
                key={quarry.id}
                type="button"
                onClick={() => onSelectQuarry(quarry)}
                className={`w-full text-start rounded-[14px] p-4 transition-colors duration-200 cursor-pointer border ${
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
                      <span>
                        <bdi dir="ltr">{quarry.wilayaCode}</bdi> {wilayaDisplayName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#84cc16] font-semibold">{categoryLabel}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-end">
                    <div className="flex items-center justify-end gap-1 font-mono-tabular text-base font-extrabold text-[#84cc16]">
                      <span className="whitespace-nowrap">
                        <bdi dir="ltr">{formatDistanceLocale(quarry.distanceKm, lang)}</bdi>
                      </span>
                      <Navigation className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-[11px] text-[#b7c9bc] whitespace-nowrap">
                      <bdi dir="ltr">~ {formatDurationLocale(quarry.estimatedMinutes, lang)}</bdi>
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

