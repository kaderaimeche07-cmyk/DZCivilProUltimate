import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, CheckCircle2, MapPin } from 'lucide-react';
import { Header, type AppTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OverviewHub, type StructuralToolFocus } from './components/OverviewHub';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';

const QuarryMapView = lazy(() =>
  import('./components/QuarryMapView').then((m) => ({ default: m.QuarryMapView }))
);
const QuarryDirectory = lazy(() =>
  import('./components/QuarryDirectory').then((m) => ({ default: m.QuarryDirectory }))
);
const ConcreteCalculator = lazy(() =>
  import('./components/ConcreteCalculator').then((m) => ({ default: m.ConcreteCalculator }))
);
const RebarCalculator = lazy(() =>
  import('./components/RebarCalculator').then((m) => ({ default: m.RebarCalculator }))
);
const MasonryCalculator = lazy(() =>
  import('./components/MasonryCalculator').then((m) => ({ default: m.MasonryCalculator }))
);
const UnitConverterPanel = lazy(() =>
  import('./components/UnitConverterPanel').then((m) => ({ default: m.UnitConverterPanel }))
);
const RoadDesignCalculator = lazy(() =>
  import('./components/RoadDesignCalculator').then((m) => ({ default: m.RoadDesignCalculator }))
);
const SavedEstimatesPanel = lazy(() =>
  import('./components/SavedEstimatesPanel').then((m) => ({ default: m.SavedEstimatesPanel }))
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

type StructuralFilter = 'concrete' | 'rebar' | 'masonry' | 'converter' | 'all';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [structuralFilter, setStructuralFilter] = useState<StructuralFilter>('concrete');

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

  const totalEstimatedDzd = useMemo(
    () => boqItems.reduce((acc, item) => acc + (item.estimatedCostDzd ?? 0), 0),
    [boqItems]
  );

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

  const handleOpenStructuralTool = (tool: StructuralToolFocus) => {
    setStructuralFilter(tool);
    setActiveTab('structural');
  };

  const handleSaveBoqItem = (item: SavedBoqItem) => {
    setBoqItems((prev) => [item, ...prev].slice(0, 250));
    showToast(`تم حفظ "${item.title}" في كشف الكميات`);
  };

  const handleDeleteBoqItem = (id: string) => {
    setBoqItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearBoq = () => {
    setBoqItems([]);
  };

  return (
    <div id="top" className="min-h-screen bg-[#0b110d] text-[#f4f7f2] pb-24 md:pb-12">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={boqItems.length}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 sm:pt-7 space-y-6">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="glass-surface rounded-2xl p-8 text-center text-xs text-[#a3b8a8]">
                جاري تحميل الوحدة الهندسية...
              </div>
            }
          >
            {/* TAB 0: STRUCTURED OVERVIEW HUB */}
            {activeTab === 'overview' && (
              <OverviewHub
                onNavigateTab={setActiveTab}
                onOpenStructuralTool={handleOpenStructuralTool}
                savedCount={boqItems.length}
                totalEstimatedDzd={totalEstimatedDzd}
              />
            )}

        {/* TAB 1: QUARRIES & INTERACTIVE MAP */}
        {activeTab === 'quarries' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  خريطة المحاجر ومصانع الإسمنت عبر 58 ولاية
                </h1>
                <p className="text-xs sm:text-sm text-[#a3b8a8]">
                  حدد ولايتك أو فعّل GPS لحساب المسافات وزمن النقل التقديري لأقرب محجرة
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#c5d6c9]">
                <span>
                  <strong className="font-mono-tabular text-[#a3e635]">58</strong> ولاية
                </span>
                <span aria-hidden="true" className="text-[#6b7f70]">·</span>
                <span>
                  <strong className="font-mono-tabular text-[#fbbf24]">{ALGERIAN_QUARRIES.length}</strong> موقعاً
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Map & Focused Quarry Details */}
              <div className="lg:col-span-7 space-y-4">
                <QuarryMapView
                  quarries={sortedQuarries}
                  origin={origin}
                  selectedQuarryId={selectedQuarry?.id ?? null}
                  onSelectQuarry={handleSelectQuarryById}
                  focusCoords={focusCoords}
                />

                {selectedQuarry && (
                  <article
                    aria-label="تفاصيل المحجرة المختارة"
                    className="glass-surface rounded-2xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#a3b8a8]">
                          <span className="font-semibold text-[#fbbf24]">الموقع المحدد</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {selectedQuarry.wilayaCode} {selectedQuarry.wilayaName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{selectedQuarry.municipality}</span>
                        </div>
                        <h2 className="text-lg font-bold text-white">{selectedQuarry.name}</h2>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="font-mono-tabular text-lg font-bold text-[#a3e635]">
                            {formatDistanceKm(selectedQuarry.distanceKm)}
                          </div>
                          <div className="font-mono-tabular text-[11px] text-[#a3b8a8]">
                            زمن النقل التقديري ~ {formatDurationAr(selectedQuarry.estimatedMinutes)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.06] pt-3 text-xs">
                      <div>
                        <div className="text-[#a3b8a8]">التصنيف والجيولوجيا</div>
                        <div className="mt-0.5 font-semibold text-slate-200">
                          {selectedQuarry.categoryLabel} · {selectedQuarry.rockType}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#a3b8a8]">المواد والأصناف المتوفرة</div>
                        <div className="mt-0.5 font-semibold text-slate-200">
                          {selectedQuarry.materials.join(' · ')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <div className="sm:text-left">
                          <div className="text-[#a3b8a8]">الإحداثيات</div>
                          <div className="mt-0.5 font-mono-tabular text-slate-200" dir="ltr">
                            {selectedQuarry.lat.toFixed(4)}, {selectedQuarry.lng.toFixed(4)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyQuarryCoords(selectedQuarry)}
                          aria-label="نسخ إحداثيات المحجرة"
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a261e] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#84cc16]/50 cursor-pointer shrink-0"
                        >
                          {copiedCoords ? (
                            <Check className="h-3.5 w-3.5 text-[#a3e635]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedCoords ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                )}
              </div>

              {/* Wilaya Selector, GPS Controls & Quarry Distance Matrix */}
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

        {/* TAB 2: STRUCTURAL CALCULATORS & UNIT CONVERTER */}
        {activeTab === 'structural' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="اختيار الحاسبة الهندسية"
                className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#121b15] p-1.5 border border-[#84cc16]/15"
              >
                {(
                  [
                    { id: 'concrete', label: 'الخرسانة 350 كغ/م³' },
                    { id: 'rebar', label: 'حديد التسليح' },
                    { id: 'masonry', label: 'الآجر والبناء' },
                    { id: 'converter', label: 'محول الوحدات' },
                    { id: 'all', label: 'عرض الكل' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={structuralFilter === item.id}
                    onClick={() => setStructuralFilter(item.id)}
                    className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      structuralFilter === item.id
                        ? 'bg-[#84cc16] text-[#081006]'
                        : 'text-[#c5d6c9] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#a3b8a8]">
                حساب فوري بأي وحدة قياس دون اتصال بالإنترنت
              </span>
            </div>

            {(structuralFilter === 'all' || structuralFilter === 'concrete') && (
              <ConcreteCalculator onSaveToBoq={handleSaveBoqItem} />
            )}
            {(structuralFilter === 'all' || structuralFilter === 'rebar') && (
              <RebarCalculator onSaveToBoq={handleSaveBoqItem} />
            )}
            {(structuralFilter === 'all' || structuralFilter === 'masonry') && (
              <MasonryCalculator onSaveToBoq={handleSaveBoqItem} />
            )}
            {(structuralFilter === 'all' || structuralFilter === 'converter') && (
              <UnitConverterPanel />
            )}
          </div>
        )}

        {/* TAB 3: ROAD DESIGN & EARTHWORKS */}
        {activeTab === 'roads' && <RoadDesignCalculator onSaveToBoq={handleSaveBoqItem} />}

            {/* TAB 4: SAVED SITE BILL OF QUANTITIES */}
            {activeTab === 'boq' && (
              <SavedEstimatesPanel
                items={boqItems}
                onDeleteItem={handleDeleteBoqItem}
                onClearAll={handleClearBoq}
                onGoToCalculators={() => {
                  setStructuralFilter('concrete');
                  setActiveTab('structural');
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#a3b8a8]">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#a3e635]" />
          <span>DZ Civil Pro Ultimate — أداة مهندسي البناء والأشغال العمومية في الجزائر</span>
        </div>
        <span className="text-[#6b7f70]">جميع الحسابات تعمل محلياً دون اتصال</span>
      </footer>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={boqItems.length}
      />

      <OfflineIndicator />

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-[#84cc16]/45 bg-[#121b15]/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md whitespace-nowrap"
        >
          <CheckCircle2 className="h-4 w-4 text-[#a3e635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
