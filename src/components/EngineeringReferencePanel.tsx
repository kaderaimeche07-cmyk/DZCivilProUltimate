import React, { useMemo, useState } from 'react';
import { BookOpen, Search, ShieldCheck, Layers, Route, Ruler } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { KadTechStudioBadge } from './KadTechBranding';
import { useI18n } from '../i18n/I18nContext';

type RefCategory = 'concrete' | 'seismic' | 'roads';
type RefFilter = 'all' | RefCategory;

export const EngineeringReferencePanel: React.FC = () => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<RefFilter>('all');
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return t.reference.items.filter((item) => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (!q) return true;
      return `${item.code} ${item.title} ${item.valueText} ${item.noteText}`.toLowerCase().includes(q);
    });
  }, [filter, query, t.reference.items]);

  const filterTabs: { id: RefFilter; label: string }[] = [
    { id: 'all', label: t.reference.filters.all },
    { id: 'concrete', label: t.reference.filters.concrete },
    { id: 'seismic', label: t.reference.filters.seismic },
    { id: 'roads', label: t.reference.filters.roads },
  ];

  const getCategoryIcon = (cat: RefCategory) => {
    if (cat === 'concrete') return <Layers className="h-4 w-4 text-[#84cc16]" />;
    if (cat === 'seismic') return <ShieldCheck className="h-4 w-4 text-[#f59e0b]" />;
    return <Route className="h-4 w-4 text-[#84cc16]" />;
  };

  return (
    <section aria-labelledby="eng-ref-heading" className="console-panel overflow-hidden">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h1 id="eng-ref-heading" className="text-lg sm:text-xl font-bold text-[#f4f7f2]">
                {t.reference.heading} (<bdi dir="ltr">RPA / CBA 93 / B40</bdi>)
              </h1>
              <p className="text-xs text-[#b7c9bc]">
                {t.reference.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Clean Search + Category Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          <div className="lg:col-span-5 relative">
            <label htmlFor="ref-search" className="sr-only">
              {t.reference.searchSr}
            </label>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7c9bc]" />
            <input
              id="ref-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.reference.searchPlaceholder}
              className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] ps-10 pe-4 py-2 text-sm text-[#f4f7f2] placeholder:text-[#728879] outline-none focus:border-[#84cc16]"
            />
          </div>

          <div
            className="lg:col-span-7 flex flex-wrap gap-2"
            role="tablist"
            aria-label={t.reference.filterAria}
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[44px] rounded-[12px] px-4 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#84cc16] text-[#060a05]'
                      : 'border border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:text-[#f4f7f2]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Reference Accordions */}
        {filteredItems.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-[#070b09] p-8 text-center space-y-2">
            <Ruler className="mx-auto h-7 w-7 text-[#728879]" />
            <div className="text-sm font-semibold text-[#f4f7f2]">
              {t.reference.noResults}
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-[12px] border border-white/10 bg-[#0f1612] px-4 py-2 text-xs font-bold text-[#84cc16] cursor-pointer"
            >
              {t.reference.showAllBtn}
            </button>
          </div>
        ) : (
          <div data-testid="engineering-reference-list" className="space-y-3">
            {filteredItems.map((item, idx) => (
              <CollapsibleSection
                key={item.id}
                title={item.title}
                subtitle={`${item.code} · ${item.valueText}`}
                badge={item.code}
                icon={getCategoryIcon(item.category)}
                defaultOpen={idx < 2}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#84cc16]/20 bg-[#0f1612] px-4 py-3">
                    <span className="text-xs text-[#b7c9bc]">{t.reference.approvedValueLabel}</span>
                    <strong className="font-mono-tabular text-sm sm:text-base font-extrabold text-[#84cc16]">
                      <bdi dir="ltr">{item.valueText}</bdi>
                    </strong>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#d4e2d7]">{item.noteText}</p>
                  <ul className="space-y-1.5 border-t border-white/[0.08] pt-3 text-xs text-[#b7c9bc]">
                    {item.checklist.map((tip, tipIdx) => (
                      <li key={tipIdx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" aria-hidden="true" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        )}

        {/* About App & Encrypted Technical Identity Card */}
        <div
          data-testid="about-kadtech-card"
          className="mt-6 rounded-[14px] border border-[#84cc16]/25 theme-day:border-lime-600/30 bg-[#070b09] theme-day:bg-slate-50 p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] theme-day:border-slate-200 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-[#f4f7f2] theme-day:text-slate-900">
              {t.reference.aboutHeading}
            </h2>
            <span className="font-mono-tabular text-[11px] font-semibold text-[#84cc16] theme-day:text-lime-700">
              <bdi dir="ltr">{t.brandTitle}</bdi>
            </span>
          </div>

          <div className="text-xs sm:text-sm font-bold text-[#f4f7f2] theme-day:text-slate-900">
            <KadTechStudioBadge />
          </div>

          <p className="text-[11px] sm:text-xs leading-relaxed text-[#b7c9bc] theme-day:text-slate-600">
            {t.reference.legalDisclaimer}
          </p>
        </div>
      </div>
    </section>
  );
};


