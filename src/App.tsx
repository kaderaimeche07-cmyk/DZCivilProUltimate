import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, CheckCircle2, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Header, type AppTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomSheet } from './components/BottomSheet';

import { ConcreteCalculator } from './components/ConcreteCalculator';
import { RebarCalculator } from './components/RebarCalculator';
import { MasonryCalculator } from './components/MasonryCalculator';
import { UnitConverterPanel } from './components/UnitConverterPanel';
import { RoadDesignCalculator } from './components/RoadDesignCalculator';
import { EngineeringReferencePanel } from './components/EngineeringReferencePanel';
import { SavedEstimatesPanel } from './components/SavedEstimatesPanel';
import { QuarryDirectory } from './components/QuarryDirectory';

const QuarryMapView = lazy(() =>
  import('./components/QuarryMapView').then((m) => ({ default: m.QuarryMapView }))
);

import { ALGERIAN_WILAYAT, findWilayaByCode } from './data/wilayat';
import { ALGERIAN_QUARRIES, type MaterialCategory } from './data/quarries';
import {
  attachDistancesAndSort,
  formatDistanceKm,
  formatDurationAr,
  requestCurrentGpsPosition,
  type GeoCoordinates,
  type QuarryWithDistance,
} from './utils/gps.locator';
import { copyTextSafely, parseStoredBoqItems } from './utils/security';
import type { SavedBoqItem } from './types/boq';

const BOQ_STORAGE_KEY = 'dz_civil_pro_boq_v1';

type CalculatorSubTab = 'concrete' | 'rebar' | 'masonry' | 'converter';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('calculators');
  const [calculatorSubTab, setCalculatorSubTab] = useState<CalculatorSubTab>('concrete');

  // Default Wilaya: 16 - الجزائر (Alger)
  const defaultWilaya = findWilayaByCode('16') ?? ALGERIAN_WILAYAT[15];
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<string>(defaultWilaya.code);
  const [origin, setOrigin] = useState<GeoCoordinates>({
    lat: defaultWilaya.lat,
    lng: defaultWilaya.lng,
    source: 'wilaya',
    label: `ولاية ${defaultWilaya.code} - ${defaultWilaya.arName}`,
  });

  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>({
    lat: defaultWilaya.lat,
    lng: defaultWilaya.lng,
    zoom: 8,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

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
    return () => {
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

  // Compute distances & filter quarries
  const sortedQuarries = useMemo(() => {
    const withDist = attachDistancesAndSort(ALGERIAN_QUARRIES, origin);
    const q = searchQuery.trim().toLowerCase();

    return withDist.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        item.name,
        item.wilayaName,
        item.wilayaCode,
        item.municipality,
        item.categoryLabel,
        item.rockType,
        ...item.materials,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [origin, searchQuery, activeCategory]);

  const selectedQuarry: QuarryWithDistance | undefined = useMemo(() => {
    if (!selectedQuarryId) return sortedQuarries[0];
    return sortedQuarries.find((q) => q.id === selectedQuarryId) ?? sortedQuarries[0];
  }, [sortedQuarries, selectedQuarryId]);

  const handleSelectWilaya = (code: string) => {
    setSelectedWilayaCode(code);
    setGpsError(null);
    const w = findWilayaByCode(code);
    if (!w) return;

    setOrigin({
      lat: w.lat,
      lng: w.lng,
      source: 'wilaya',
      label: `ولاية ${w.code} - ${w.arName}`,
    });
    setFocusCoords({ lat: w.lat, lng: w.lng, zoom: 9 });
    setSelectedQuarryId(null);
    if (activeTab !== 'quarries') {
      setActiveTab('quarries');
    }
  };

  const handleLocateGps = async () => {
    setIsLocating(true);
    setGpsError(null);
    if (activeTab !== 'quarries') {
      setActiveTab('quarries');
    }

    const res = await requestCurrentGpsPosition();
    setIsLocating(false);

    if (res.ok) {
      setOrigin(res.coords);
      setFocusCoords({ lat: res.coords.lat, lng: res.coords.lng, zoom: 10 });
      setSelectedQuarryId(null);
      showToast('تم تحديد موقعك عبر GPS وتحديث مصفوفة المسافات');
    } else {
      setGpsError(res.message);
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
    showToast(`تم حفظ "${item.title}" في السجل والمقايسة`);
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
                  aria-label="اختيار الحاسبة الهندسية"
                  className="grid grid-cols-2 sm:inline-flex items-center gap-1.5 rounded-[14px] bg-[#070b09] p-1.5 border border-white/[0.08] w-full sm:w-auto"
                >
                  {(
                    [
                      { id: 'concrete', label: 'الخرسانة' },
                      { id: 'rebar', label: 'حديد التسليح' },
                      { id: 'masonry', label: 'البناء والآجر' },
                      { id: 'converter', label: 'محول الوحدات' },
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
                  تعمل جميع الحاسبات محلياً دون اتصال
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
                    خريطة المحاجر ومصانع الإسمنت
                  </h1>
                  <p className="text-xs sm:text-sm text-[#b7c9bc]">
                    اختر ولايتك أو فعّل <bdi dir="ltr">GPS</bdi> ثم اضغط على أي محجرة لعرض تفاصيلها الكاملة
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#b7c9bc]">
                  <span>
                    <strong className="font-mono-tabular text-[#84cc16]"><bdi dir="ltr">58</bdi></strong> ولاية
                  </span>
                  <span aria-hidden="true" className="text-[#728879]">·</span>
                  <span>
                    <strong className="font-mono-tabular text-[#f59e0b]"><bdi dir="ltr">{ALGERIAN_QUARRIES.length}</bdi></strong> موقعاً
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <Suspense
                    fallback={
                      <div className="h-[360px] sm:h-[420px] lg:h-[520px] rounded-[14px] border border-[#84cc16]/25 bg-[#070b09] flex items-center justify-center text-xs text-[#b7c9bc]">
                        جاري تحميل الخريطة...
                      </div>
                    }
                  >
                    <QuarryMapView
                      quarries={sortedQuarries}
                      origin={origin}
                      selectedQuarryId={selectedQuarry?.id ?? null}
                      onSelectQuarry={handleSelectQuarryById}
                      focusCoords={focusCoords}
                    />
                  </Suspense>

                  {selectedQuarry && (
                    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.08] bg-[#0f1612] px-4 py-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-[#f59e0b] font-semibold">الأقرب / المحدد: </span>
                        <strong className="text-[#f4f7f2] truncate">{selectedQuarry.name}</strong>
                        <span className="mx-2 text-[#728879]">·</span>
                        <span className="font-mono-tabular font-bold text-[#84cc16]">
                          <bdi dir="ltr">{formatDistanceKm(selectedQuarry.distanceKm)}</bdi>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuarrySheetOpen(true)}
                        className="min-h-[44px] rounded-[10px] border border-[#84cc16]/35 bg-[#070b09] px-3.5 py-2 text-xs font-bold text-[#84cc16] whitespace-nowrap cursor-pointer"
                      >
                        تفاصيل المحجرة
                      </button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <QuarryDirectory
                    selectedWilayaCode={selectedWilayaCode}
                    onSelectWilaya={handleSelectWilaya}
                    origin={origin}
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

          {/* TAB 4: ENGINEERING REFERENCE (RPA / CBA93 / B40) - Zero flash, instant render */}
          {activeTab === 'reference' && <EngineeringReferencePanel />}

          {/* TAB 5: HISTORY & BOQ EXPORT - Zero flash, instant render */}
          {activeTab === 'boq' && (
            <SavedEstimatesPanel
              items={boqItems}
              onDeleteItem={handleDeleteBoqItem}
              onClearAll={handleClearBoq}
              onGoToCalculators={() => {
                setCalculatorSubTab('concrete');
                setActiveTab('calculators');
              }}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#b7c9bc] print:hidden">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#84cc16]" />
          <span>DZ Civil Pro Ultimate — المنصة الهندسية الجزائرية</span>
        </div>
        <span className="text-[#728879]">جميع الحسابات تعمل محلياً دون اتصال</span>
      </footer>

      {/* Bottom Sheet for Quarry Details with Google Maps Directions & GPS copy */}
      <BottomSheet
        open={quarrySheetOpen && Boolean(selectedQuarry)}
        onClose={() => setQuarrySheetOpen(false)}
        title={selectedQuarry?.name ?? 'تفاصيل المحجرة'}
        subtitle={
          selectedQuarry
            ? `${selectedQuarry.wilayaCode} ${selectedQuarry.wilayaName} · ${selectedQuarry.municipality}`
            : undefined
        }
        footer={
          selectedQuarry ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedQuarry.lat},${selectedQuarry.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="فتح مسار الشاحنة في خرائط Google"
                className="btn-amber min-h-[46px] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold no-underline cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>فتح المسار في Google Maps</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyQuarryCoords(selectedQuarry)}
                aria-label="نسخ إحداثيات المحجرة"
                className="btn-kiwi min-h-[46px] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {copiedCoords ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCoords ? 'تم نسخ الإحداثيات' : 'نسخ إحداثيات GPS'}</span>
              </button>
            </div>
          ) : null
        }
      >
        {selectedQuarry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-[14px] border border-white/[0.08] bg-[#070b09] p-4">
              <div>
                <div className="text-xs text-[#b7c9bc]">المسافة الجغرافية</div>
                <div className="mt-1 flex items-center gap-1.5 font-mono-tabular text-lg font-extrabold text-[#84cc16]">
                  <Navigation className="h-4 w-4" />
                  <span className="whitespace-nowrap"><bdi dir="ltr">{formatDistanceKm(selectedQuarry.distanceKm)}</bdi></span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#b7c9bc]">زمن النقل التقريبي</div>
                <div className="mt-1 font-mono-tabular text-lg font-extrabold text-[#f59e0b]">
                  <span className="whitespace-nowrap"><bdi dir="ltr">~ {formatDurationAr(selectedQuarry.estimatedMinutes)}</bdi></span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-b border-white/[0.08] pb-2.5">
                <div className="text-[#b7c9bc]">التصنيف والجيولوجيا</div>
                <div className="mt-1 text-sm font-bold text-[#f4f7f2]">
                  {selectedQuarry.categoryLabel} · <bdi dir="ltr">{selectedQuarry.rockType}</bdi>
                </div>
              </div>
              <div className="border-b border-white/[0.08] pb-2.5">
                <div className="text-[#b7c9bc]">المواد والأصناف المتوفرة</div>
                <div className="mt-1 text-sm font-semibold text-[#d9f99d]">
                  {selectedQuarry.materials.join(' · ')}
                </div>
              </div>
              <div>
                <div className="text-[#b7c9bc]">الطاقة والوصف</div>
                <div className="mt-1 text-xs leading-relaxed text-[#f4f7f2]">
                  {selectedQuarry.capacityNote}
                </div>
              </div>
              <div>
                <div className="text-[#b7c9bc]">الإحداثيات الجغرافية (GPS)</div>
                <div className="mt-1 font-mono-tabular text-sm font-semibold text-[#f4f7f2]" dir="ltr">
                  <bdi dir="ltr">{selectedQuarry.lat.toFixed(4)}, {selectedQuarry.lng.toFixed(4)}</bdi>
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
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-[14px] border border-[#84cc16]/50 bg-[#0f1612]/98 px-4 py-3 text-xs font-semibold text-[#f4f7f2] shadow-2xl backdrop-blur-md"
        >
          <CheckCircle2 className="h-4 w-4 text-[#84cc16] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
