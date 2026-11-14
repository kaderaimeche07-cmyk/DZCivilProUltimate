import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Navigation, ExternalLink, Copy, Check } from 'lucide-react';
import { Header, type AppTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomSheet } from './components/BottomSheet';
import { KadTechStudioBadge } from './components/KadTechBranding';

import { ConcreteCalculator } from './components/ConcreteCalculator';
import { RebarCalculator } from './components/RebarCalculator';
import { MasonryCalculator } from './components/MasonryCalculator';
import { UnitConverterPanel } from './components/UnitConverterPanel';
import { RoadDesignCalculator } from './components/RoadDesignCalculator';
import { EngineeringReferencePanel } from './components/EngineeringReferencePanel';
import { SavedEstimatesPanel } from './components/SavedEstimatesPanel';
import { QuarryDirectory } from './components/QuarryDirectory';
import { trackUniqueVisitor } from './utils/firebase';

const QuarryMapView = lazy(() =>
  import('./components/QuarryMapView').then((m) => ({ default: m.QuarryMapView }))
);

import { ALGERIAN_WILAYAT, findWilayaByCode } from './data/wilayat';
import { ALGERIAN_QUARRIES, type MaterialCategory } from './data/quarries';
import {
  attachDistancesAndSort,
  loadCachedOriginCoords,
  requestCurrentGpsPosition,
  saveCachedOriginCoords,
  type GeoCoordinates,
  type GpsError,
  type QuarryWithDistance,
} from './utils/gps.locator';
import { copyTextSafely, parseStoredBoqItems } from './utils/security';
import type { SavedBoqItem } from './types/boq';
import { useI18n } from './i18n/I18nContext';
import {
  formatDistanceLocale,
  formatDurationLocale,
  getQuarryCategoryLabel,
} from './i18n/translations';

const BOQ_STORAGE_KEY = 'dz_civil_pro_boq_v1';

type CalculatorSubTab = 'concrete' | 'rebar' | 'masonry' | 'converter';

export default function App() {
  const { lang, t } = useI18n();
  const [activeTab, setActiveTab] = useState<AppTab>('calculators');
  const [calculatorSubTab, setCalculatorSubTab] = useState<CalculatorSubTab>('concrete');

  // Default Wilaya: 16 - الجزائر (Alger) or cached origin
  const defaultWilaya = findWilayaByCode('16') ?? ALGERIAN_WILAYAT[15];
  const initialOrigin = useMemo<GeoCoordinates>(() => {
    const cached = loadCachedOriginCoords();
    if (cached) return cached;
    return {
      lat: defaultWilaya.lat,
      lng: defaultWilaya.lng,
      source: 'wilaya',
      label: `ولاية ${defaultWilaya.code} - ${defaultWilaya.arName}`,
    };
  }, [defaultWilaya]);

  const [selectedWilayaCode, setSelectedWilayaCode] = useState<string>(defaultWilaya.code);
  const [origin, setOrigin] = useState<GeoCoordinates>(initialOrigin);

  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>({
    lat: initialOrigin.lat,
    lng: initialOrigin.lng,
    zoom: 8,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsErrorCode, setGpsErrorCode] = useState<GpsError['code'] | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [selectedQuarryId, setSelectedQuarryId] = useState<string | null>(null);
  const [quarrySheetOpen, setQuarrySheetOpen] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Persistent Saved BoQ Items (validated against schema)
  const [boqItems, setBoqItems] = useState<SavedBoqItem[]>(() => {
    try {
      return parseStoredBoqItems(localStorage.getItem(BOQ_STORAGE_KEY));
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void trackUniqueVisitor();

    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);

    // Client protection layer: block desktop right-click & DevTools shortcuts while preserving mobile copy on result fields
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isCoarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      const isCopyableField = Boolean(
        target?.closest('.telemetry-strip, .telemetry-cell, [data-copyable="true"], input, textarea')
      );
      if (isCoarsePointer && isCopyableField) {
        return;
      }
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'U') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BOQ_STORAGE_KEY, JSON.stringify(boqItems));
    } catch {
      // Storage quota fallback
    }
  }, [boqItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2800);
  };

  // Keep origin label dynamically localized across AR / FR / EN
  const displayOrigin = useMemo<GeoCoordinates>(() => {
    if (origin.source === 'gps') {
      return { ...origin, label: t.quarries.myLocationGps };
    }
    const w = findWilayaByCode(selectedWilayaCode);
    if (w) {
      return {
        ...origin,
        label: `${t.quarries.wilayaPrefix} ${w.code} - ${lang === 'ar' ? w.arName : w.frName}`,
      };
    }
    return origin;
  }, [origin, selectedWilayaCode, lang, t.quarries.myLocationGps, t.quarries.wilayaPrefix]);

  const gpsError = useMemo(() => {
    if (!gpsErrorCode) return null;
    switch (gpsErrorCode) {
      case 'UNSUPPORTED':
        return t.quarries.gpsErrors.unsupported;
      case 'PERMISSION_DENIED':
        return t.quarries.gpsErrors.denied;
      case 'POSITION_UNAVAILABLE':
        return t.quarries.gpsErrors.unavailable;
      case 'TIMEOUT':
        return t.quarries.gpsErrors.timeout;
      default:
        return t.quarries.gpsErrors.unknown;
    }
  }, [gpsErrorCode, t.quarries.gpsErrors]);

  // Compute distances & filter quarries
  const sortedQuarries = useMemo(() => {
    const withDist = attachDistancesAndSort(ALGERIAN_QUARRIES, displayOrigin);
    const q = searchQuery.trim().toLowerCase();

    return withDist.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const wObj = findWilayaByCode(item.wilayaCode);
      const haystack = [
        item.name,
        item.wilayaName,
        wObj?.frName ?? '',
        item.wilayaCode,
        item.municipality,
        item.categoryLabel,
        getQuarryCategoryLabel(item.category, lang),
        item.rockType,
        ...item.materials,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [displayOrigin, searchQuery, activeCategory, lang]);

  const selectedQuarry: QuarryWithDistance | undefined = useMemo(() => {
    if (!selectedQuarryId) return sortedQuarries[0];
    return sortedQuarries.find((q) => q.id === selectedQuarryId) ?? sortedQuarries[0];
  }, [sortedQuarries, selectedQuarryId]);

  const selectedQuarryWilayaName = useMemo(() => {
    if (!selectedQuarry) return '';
    if (lang === 'ar') return selectedQuarry.wilayaName;
    return findWilayaByCode(selectedQuarry.wilayaCode)?.frName ?? selectedQuarry.wilayaName;
  }, [selectedQuarry, lang]);

  const handleSelectWilaya = (code: string) => {
    setSelectedWilayaCode(code);
    setGpsErrorCode(null);
    const w = findWilayaByCode(code);
    if (!w) return;

    const nextOrigin: GeoCoordinates = {
      lat: w.lat,
      lng: w.lng,
      source: 'wilaya',
      label: `ولاية ${w.code} - ${w.arName}`,
    };
    setOrigin(nextOrigin);
    saveCachedOriginCoords(nextOrigin);
    setFocusCoords({ lat: w.lat, lng: w.lng, zoom: 9 });
    setSelectedQuarryId(null);
    if (activeTab !== 'quarries') {
      setActiveTab('quarries');
    }
  };

  const handleLocateGps = async () => {
    setIsLocating(true);
    setGpsErrorCode(null);
    if (activeTab !== 'quarries') {
      setActiveTab('quarries');
    }

    const res = await requestCurrentGpsPosition();
    setIsLocating(false);

    if (res.ok) {
      setOrigin(res.coords);
      saveCachedOriginCoords(res.coords);
      setFocusCoords({ lat: res.coords.lat, lng: res.coords.lng, zoom: 10 });
      setSelectedQuarryId(null);
      showToast(t.quarries.gpsSuccessToast);
    } else {
      setGpsErrorCode(res.code);
    }
  };

  const handleSelectQuarry = (quarry: QuarryWithDistance) => {
    setSelectedQuarryId(quarry.id);
    setFocusCoords({ lat: quarry.lat, lng: quarry.lng, zoom: 11 });
    setQuarrySheetOpen(true);
  };

  const handleSelectQuarryById = (id: string) => {
    const found = sortedQuarries.find((q) => q.id === id);
    if (found) handleSelectQuarry(found);
  };

  const handleCopyQuarryCoords = async (q: QuarryWithDistance) => {
    const ok = await copyTextSafely(`${q.lat}, ${q.lng}`);
    if (ok) {
      setCopiedCoords(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedCoords(false), 1800);
    }
  };

  const handleSaveBoqItem = (item: SavedBoqItem) => {
    setBoqItems((prev) => [item, ...prev].slice(0, 250));
    showToast(t.boq.savedToast(item.title));
  };

  const handleDeleteBoqItem = (id: string) => {
    setBoqItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearBoq = () => {
    setBoqItems([]);
  };

  const [theme, setTheme] = useState<'night' | 'day'>(() => {
    try {
      return (localStorage.getItem('dz_civil_theme') as 'night' | 'day') || 'night';
    } catch {
      return 'night';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dz_civil_theme', theme);
    } catch {}
    if (theme === 'day') {
      document.documentElement.classList.add('theme-day');
      document.body.classList.add('theme-day');
    } else {
      document.documentElement.classList.remove('theme-day');
      document.body.classList.remove('theme-day');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  };

  return (
    <div
      id="top"
      className="min-h-[100dvh] flex flex-col text-[#f4f7f2] theme-day:text-slate-900 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-12 overflow-x-hidden transition-colors duration-200"
    >
      {gmpQuotaExceeded && (
        <div
          dir="ltr"
          className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm"
        >
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={boqItems.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 pt-5 sm:pt-7 space-y-6">
        <ErrorBoundary>
          {/* TAB 1: CALCULATORS & UNIT CONVERTER (Primary Workspace) */}
          {activeTab === 'calculators' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  role="tablist"
                  aria-label={t.calcTabs.tablistAria}
                  className="grid grid-cols-2 sm:inline-flex items-center gap-1.5 rounded-[14px] bg-[#070b09] p-1.5 border border-white/[0.08] w-full sm:w-auto"
                >
                  {(
                    [
                      { id: 'concrete', label: t.calcTabs.concrete },
                      { id: 'rebar', label: t.calcTabs.rebar },
                      { id: 'masonry', label: t.calcTabs.masonry },
                      { id: 'converter', label: t.calcTabs.converter },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={calculatorSubTab === item.id}
                      onClick={() => setCalculatorSubTab(item.id)}
                      className={`min-h-[44px] rounded-[10px] px-4 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                        calculatorSubTab === item.id
                          ? 'bg-[#84cc16] text-[#060a05]'
                          : 'text-[#b7c9bc] hover:text-[#f4f7f2] hover:bg-[#141d18]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[#b7c9bc]">
                  {t.common.allOfflineNote}
                </span>
              </div>

              {calculatorSubTab === 'concrete' && (
                <ConcreteCalculator onSaveToBoq={handleSaveBoqItem} />
              )}
              {calculatorSubTab === 'rebar' && (
                <RebarCalculator onSaveToBoq={handleSaveBoqItem} />
              )}
              {calculatorSubTab === 'masonry' && (
                <MasonryCalculator onSaveToBoq={handleSaveBoqItem} />
              )}
              {calculatorSubTab === 'converter' && <UnitConverterPanel />}
            </div>
          )}

          {/* TAB 2: ROADS & EARTHWORKS */}
          {activeTab === 'roads' && <RoadDesignCalculator onSaveToBoq={handleSaveBoqItem} />}

          {/* TAB 3: QUARRIES GPS MAP & DIRECTORY */}
          {activeTab === 'quarries' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#f4f7f2]">
                    {t.quarries.pageTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#b7c9bc]">
                    {t.quarries.pageSubtitlePrefix} <bdi dir="ltr">GPS</bdi> {t.quarries.pageSubtitleSuffix}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#b7c9bc]">
                  <span>
                    <strong className="font-mono-tabular text-[#84cc16]">
                      <bdi dir="ltr">58</bdi>
                    </strong>{' '}
                    {t.quarries.wilayatCountLabel}
                  </span>
                  <span aria-hidden="true" className="text-[#728879]">·</span>
                  <span>
                    <strong className="font-mono-tabular text-[#f59e0b]">
                      <bdi dir="ltr">{ALGERIAN_QUARRIES.length}</bdi>
                    </strong>{' '}
                    {t.quarries.sitesCountLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <Suspense
                    fallback={
                      <div className="h-[360px] sm:h-[420px] lg:h-[520px] rounded-[14px] border border-[#84cc16]/25 bg-[#070b09] flex items-center justify-center text-xs text-[#b7c9bc]">
                        {t.quarries.loadingMap}
                      </div>
                    }
                  >
                    <QuarryMapView
                      quarries={sortedQuarries}
                      origin={displayOrigin}
                      selectedQuarryId={selectedQuarry?.id ?? null}
                      onSelectQuarry={handleSelectQuarryById}
                      focusCoords={focusCoords}
                    />
                  </Suspense>

                  {selectedQuarry && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/[0.08] theme-day:border-slate-200 bg-[#0f1612] theme-day:bg-white px-4 py-3 text-xs">
                      <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[#f59e0b] font-semibold">
                          {t.quarries.nearestSelected}
                        </span>
                        <strong className="text-[#f4f7f2] theme-day:text-slate-900">
                          {selectedQuarry.name}
                        </strong>
                        <span className="text-[#728879]">·</span>
                        <span className="font-mono-tabular font-bold text-[#84cc16] theme-day:text-lime-700 whitespace-nowrap">
                          <bdi dir="ltr">{formatDistanceLocale(selectedQuarry.distanceKm, lang)}</bdi>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuarrySheetOpen(true)}
                        className="min-h-[44px] rounded-[10px] border border-[#84cc16]/35 bg-[#070b09] theme-day:bg-lime-50 px-3.5 py-2 text-xs font-bold text-[#84cc16] theme-day:text-lime-800 whitespace-nowrap cursor-pointer"
                      >
                        {t.quarries.detailsBtn}
                      </button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <QuarryDirectory
                    selectedWilayaCode={selectedWilayaCode}
                    onSelectWilaya={handleSelectWilaya}
                    origin={displayOrigin}
                    gpsError={gpsError}
                    isLocating={isLocating}
                    onLocateGps={handleLocateGps}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    quarries={sortedQuarries}
                    selectedQuarryId={selectedQuarry?.id ?? null}
                    onSelectQuarry={handleSelectQuarry}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENGINEERING REFERENCE (RPA / CBA93 / B40) */}
          {activeTab === 'reference' && <EngineeringReferencePanel />}

          {/* TAB 5: HISTORY & BOQ EXPORT */}
          {activeTab === 'boq' && (
            <SavedEstimatesPanel
              items={boqItems}
              onDeleteItem={handleDeleteBoqItem}
              onClearAll={handleClearBoq}
              onGoToCalculators={() => {
                setCalculatorSubTab('concrete');
                setActiveTab('calculators');
              }}
              onNotify={showToast}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-4 sm:px-6 mt-10 pt-6 border-t border-white/[0.06] theme-day:border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-[#b7c9bc] theme-day:text-slate-600 print:hidden">
        <KadTechStudioBadge className="font-semibold text-[#f4f7f2] theme-day:text-slate-800" />
        <span className="text-[#728879] theme-day:text-slate-500">{t.footer.localBadge}</span>
      </footer>

      {/* Bottom Sheet for Quarry Details with Google Maps Directions & GPS copy */}
      <BottomSheet
        open={quarrySheetOpen && Boolean(selectedQuarry)}
        onClose={() => setQuarrySheetOpen(false)}
        title={selectedQuarry?.name ?? t.quarries.sheetTitleFallback}
        subtitle={
          selectedQuarry
            ? `${selectedQuarry.wilayaCode} ${selectedQuarryWilayaName} · ${selectedQuarry.municipality}`
            : undefined
        }
        footer={
          selectedQuarry ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedQuarry.lat},${selectedQuarry.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.quarries.openGoogleMapsAria}
                className="btn-amber min-h-[46px] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold no-underline cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{t.quarries.openGoogleMaps}</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyQuarryCoords(selectedQuarry)}
                aria-label={t.quarries.copyCoordsAria}
                className="btn-kiwi min-h-[46px] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {copiedCoords ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCoords ? t.quarries.coordsCopied : t.quarries.copyCoords}</span>
              </button>
            </div>
          ) : null
        }
      >
        {selectedQuarry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-[14px] border border-white/[0.08] bg-[#070b09] p-4">
              <div>
                <div className="text-xs text-[#b7c9bc]">{t.quarries.distanceLabel}</div>
                <div className="mt-1 flex items-center gap-1.5 font-mono-tabular text-lg font-extrabold text-[#84cc16]">
                  <Navigation className="h-4 w-4" />
                  <span className="whitespace-nowrap">
                    <bdi dir="ltr">{formatDistanceLocale(selectedQuarry.distanceKm, lang)}</bdi>
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#b7c9bc]">{t.quarries.etaLabel}</div>
                <div className="mt-1 font-mono-tabular text-lg font-extrabold text-[#f59e0b]">
                  <span className="whitespace-nowrap">
                    <bdi dir="ltr">~ {formatDurationLocale(selectedQuarry.estimatedMinutes, lang)}</bdi>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-b border-white/[0.08] pb-2.5">
                <div className="text-[#b7c9bc]">{t.quarries.catGeologyLabel}</div>
                <div className="mt-1 text-sm font-bold text-[#f4f7f2]">
                  {getQuarryCategoryLabel(selectedQuarry.category, lang)} · <bdi dir="ltr">{selectedQuarry.rockType}</bdi>
                </div>
              </div>
              <div className="border-b border-white/[0.08] pb-2.5">
                <div className="text-[#b7c9bc]">{t.quarries.materialsLabel}</div>
                <div className="mt-1 text-sm font-semibold text-[#d9f99d]">
                  {selectedQuarry.materials.join(' · ')}
                </div>
              </div>
              <div>
                <div className="text-[#b7c9bc]">{t.quarries.capacityLabel}</div>
                <div className="mt-1 text-xs leading-relaxed text-[#f4f7f2]">
                  {selectedQuarry.capacityNote}
                </div>
              </div>
              <div>
                <div className="text-[#b7c9bc]">{t.quarries.gpsCoordsLabel}</div>
                <div className="mt-1 font-mono-tabular text-sm font-semibold text-[#f4f7f2]" dir="ltr">
                  <bdi dir="ltr">
                    {selectedQuarry.lat.toFixed(4)}, {selectedQuarry.lng.toFixed(4)}
                  </bdi>
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={boqItems.length}
      />

      <OfflineIndicator />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-[14px] border border-[#84cc16]/50 theme-day:border-lime-500/70 bg-[#0f1612]/98 theme-day:bg-slate-900 px-4 py-3 text-xs font-semibold text-[#f4f7f2] theme-day:text-white shadow-2xl backdrop-blur-md"
        >
          <CheckCircle2 className="h-4 w-4 text-[#84cc16] theme-day:text-lime-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

