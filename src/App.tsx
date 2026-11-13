import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, CheckCircle2, MapPin, FolderArchive } from 'lucide-react';
import { Header, type AppTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuarryMapView } from './components/QuarryMapView';
import { QuarryDirectory } from './components/QuarryDirectory';
import { ConcreteCalculator } from './components/ConcreteCalculator';
import { RebarCalculator } from './components/RebarCalculator';
import { MasonryCalculator } from './components/MasonryCalculator';
import { RoadDesignCalculator } from './components/RoadDesignCalculator';
import { SavedEstimatesPanel } from './components/SavedEstimatesPanel';
import { ProjectDownloadModal } from './components/ProjectDownloadModal';
import { OfflineIndicator } from './components/OfflineIndicator';
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
import type { SavedBoqItem } from './types/boq';

const BOQ_STORAGE_KEY = 'dz_civil_pro_boq_v1';

type StructuralFilter = 'all' | 'concrete' | 'rebar' | 'masonry';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('quarries');
  const [structuralFilter, setStructuralFilter] = useState<StructuralFilter>('all');

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
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Persistent Saved BoQ Items
  const [boqItems, setBoqItems] = useState<SavedBoqItem[]>(() => {
    try {
      const raw = localStorage.getItem(BOQ_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BOQ_STORAGE_KEY, JSON.stringify(boqItems));
    } catch {
      // Storage quota fallback
    }
  }, [boqItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
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
    try {
      await navigator.clipboard.writeText(`${q.lat}, ${q.lng}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 1800);
    } catch {
      // Clipboard fallback
    }
  };

  const handleSaveBoqItem = (item: SavedBoqItem) => {
    setBoqItems((prev) => [item, ...prev]);
    showToast(`تم حفظ "${item.title}" في كشف الكميات`);
  };

  const handleDeleteBoqItem = (id: string) => {
    setBoqItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearBoq = () => {
    setBoqItems([]);
  };

  return (
    <div id="top" className="min-h-screen bg-[#0f1419] text-[#f1f5f9] pb-24 md:pb-12">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={boqItems.length}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 sm:pt-7 space-y-6">
        {/* Clean Contextual Intro Bar */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              المنصة الميدانية للهندسة المدنية والأشغال العمومية في الجزائر
            </h1>
            <p className="text-sm text-slate-400">
              دليل المحاجر ومصانع الإسمنت عبر 58 ولاية · حساب المسافات الحية عبر GPS · حاسبات الخرسانة والحديد والبناء والطرقات دون اتصال
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 shrink-0">
            <span>
              <strong className="font-mono-tabular text-[#2ec4b6]">58</strong> ولاية مغطاة
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-tabular text-[#ff9f1c]">{ALGERIAN_QUARRIES.length}</strong> محجرة ومصنع مواد
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>دقة معادلة Haversine</span>
          </div>
        </section>

        {/* TAB 1: QUARRIES & INTERACTIVE MAP */}
        {activeTab === 'quarries' && (
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
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-[#ff9f1c]">الموقع المحدد</span>
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
                        <div className="font-mono-tabular text-lg font-bold text-[#2ec4b6]">
                          {formatDistanceKm(selectedQuarry.distanceKm)}
                        </div>
                        <div className="font-mono-tabular text-[11px] text-slate-400">
                          زمن النقل التقديري ~ {formatDurationAr(selectedQuarry.estimatedMinutes)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.06] pt-3 text-xs">
                    <div>
                      <div className="text-slate-400">التصنيف والجيولوجيا</div>
                      <div className="mt-0.5 font-semibold text-slate-200">
                        {selectedQuarry.categoryLabel} · {selectedQuarry.rockType}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">المواد والأصناف المتوفرة</div>
                      <div className="mt-0.5 font-semibold text-slate-200">
                        {selectedQuarry.materials.join(' · ')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <div className="sm:text-left">
                        <div className="text-slate-400">الإحداثيات</div>
                        <div className="mt-0.5 font-mono-tabular text-slate-200" dir="ltr">
                          {selectedQuarry.lat.toFixed(4)}, {selectedQuarry.lng.toFixed(4)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyQuarryCoords(selectedQuarry)}
                        aria-label="نسخ إحداثيات المحجرة"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#222d38] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#2ec4b6]/50 cursor-pointer shrink-0"
                      >
                        {copiedCoords ? (
                          <Check className="h-3.5 w-3.5 text-[#2ec4b6]" />
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
        )}

        {/* TAB 2: STRUCTURAL & MASONRY CALCULATORS */}
        {activeTab === 'structural' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="تصفية الحاسبات الإنشائية"
                className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#19222a] p-1.5 border border-white/[0.08]"
              >
                {(
                  [
                    { id: 'all', label: 'جميع الحاسبات' },
                    { id: 'concrete', label: 'الخرسانة 350 كغ/م³' },
                    { id: 'rebar', label: 'حديد التسليح' },
                    { id: 'masonry', label: 'الآجر والبناء' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={structuralFilter === item.id}
                    onClick={() => setStructuralFilter(item.id)}
                    className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      structuralFilter === item.id
                        ? 'bg-[#2ec4b6] text-[#0f1419]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                تعمل جميع المعادلات فورياً دون اتصال بالإنترنت
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
            onGoToCalculators={() => setActiveTab('structural')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#ff9f1c]" />
          <span>DZ Civil Pro Ultimate — أداة مهندسي البناء والأشغال العمومية في الجزائر</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/10 bg-[#19222a] px-3.5 py-2 text-xs font-semibold text-[#2ec4b6] hover:border-[#2ec4b6]/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderArchive className="h-4 w-4 shrink-0" />
            <span>تحميل ملفات التطبيق (ZIP)</span>
          </button>
          <span className="text-slate-500">جميع الحسابات تعمل محلياً دون اتصال</span>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={boqItems.length}
      />

      <ProjectDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      <OfflineIndicator />

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-[#2ec4b6]/40 bg-[#19222a]/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md"
        >
          <CheckCircle2 className="h-4 w-4 text-[#2ec4b6] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
