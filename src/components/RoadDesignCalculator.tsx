import React, { useMemo, useState } from 'react';
import {
  Route,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  calculateRoadGradient,
  calculateLinearCutFill,
  type RoadStationPoint,
} from '../utils/calculators.engine';
import type { SavedBoqItem } from '../types/boq';

interface RoadDesignCalculatorProps {
  onSaveToBoq: (item: SavedBoqItem) => void;
}

const DEFAULT_STATIONS: RoadStationPoint[] = [
  { id: 'st-1', chainageM: 0, groundElevM: 422.5, designElevM: 420.0 },
  { id: 'st-2', chainageM: 100, groundElevM: 421.0, designElevM: 422.5 },
  { id: 'st-3', chainageM: 200, groundElevM: 424.2, designElevM: 425.0 },
  { id: 'st-4', chainageM: 300, groundElevM: 428.8, designElevM: 427.5 },
];

export const RoadDesignCalculator: React.FC<RoadDesignCalculatorProps> = ({ onSaveToBoq }) => {
  // 1. User-defined Start & End Point Gradient Analyzer
  const [startPkStr, setStartPkStr] = useState('0');
  const [startZStr, setStartZStr] = useState('420.0');
  const [endPkStr, setEndPkStr] = useState('250');
  const [endZStr, setEndZStr] = useState('431.5');

  // 2. Linear Cut & Fill Earthworks
  const [projectTitle, setProjectTitle] = useState('مقطع طريق ولائي — المحور الرئيسي');
  const [roadWidthStr, setRoadWidthStr] = useState('9.0');
  const [sideSlopeStr, setSideSlopeStr] = useState('1.5');
  const [swellFactorStr, setSwellFactorStr] = useState('1.20');
  const [stations, setStations] = useState<RoadStationPoint[]>(DEFAULT_STATIONS);

  const gradientResult = useMemo(() => {
    return calculateRoadGradient({
      startChainageM: Number(startPkStr),
      startElevationM: Number(startZStr),
      endChainageM: Number(endPkStr),
      endElevationM: Number(endZStr),
    });
  }, [startPkStr, startZStr, endPkStr, endZStr]);

  const earthworksResult = useMemo(() => {
    return calculateLinearCutFill({
      roadWidthM: Number(roadWidthStr),
      sideSlopeRatio: Number(sideSlopeStr),
      swellFactor: Number(swellFactorStr) || 1.2,
      stations,
    });
  }, [roadWidthStr, sideSlopeStr, swellFactorStr, stations]);

  const updateStation = (id: string, field: keyof Omit<RoadStationPoint, 'id'>, rawVal: string) => {
    const num = Number(rawVal);
    setStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: Number.isFinite(num) ? num : 0 } : s))
    );
  };

  const addStation = () => {
    setStations((prev) => {
      const last = prev[prev.length - 1];
      const nextPk = last ? last.chainageM + 100 : 0;
      const nextGround = last ? Number((last.groundElevM + 1.5).toFixed(2)) : 420;
      const nextDesign = last ? Number((last.designElevM + 2.0).toFixed(2)) : 420;
      return [
        ...prev,
        {
          id: `st-${Date.now()}`,
          chainageM: nextPk,
          groundElevM: nextGround,
          designElevM: nextDesign,
        },
      ];
    });
  };

  const removeStation = (id: string) => {
    setStations((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));
  };

  const handleSaveEarthworks = () => {
    if (!earthworksResult.valid) return;
    const balanceText =
      earthworksResult.netEarthBalanceM3 >= 0
        ? `فائض حفر +${earthworksResult.netEarthBalanceM3} م³`
        : `عجز ردم ${earthworksResult.netEarthBalanceM3} م³`;

    onSaveToBoq({
      id: `road-${Date.now()}`,
      category: 'roads',
      categoryLabel: 'تصميم الطرقات',
      title: projectTitle.trim() || 'مشروع طريق خطي',
      summary: `طول ${earthworksResult.totalLengthM} م · عرض ${roadWidthStr} م · ميل أقصى ${earthworksResult.maxAbsGradientPercent}%`,
      metrics: [
        { label: 'حجم الحفر (Déblais)', value: `${earthworksResult.totalCutVolumeM3} م³` },
        { label: 'حجم الردم (Remblais)', value: `${earthworksResult.totalFillVolumeM3} م³` },
        { label: 'الميزان الترابي', value: balanceText },
        { label: 'رحلات الشاحنات (15 م³)', value: `${earthworksResult.truckTrips15m3} نقلة` },
      ],
      createdAtIso: new Date().toISOString(),
    });
  };

  // Compute SVG longitudinal profile geometry for the station table
  const profileSvg = useMemo(() => {
    if (stations.length < 2) return null;
    const sorted = [...stations].sort((a, b) => a.chainageM - b.chainageM);
    const minPk = sorted[0].chainageM;
    const maxPk = sorted[sorted.length - 1].chainageM;
    const pkSpan = Math.max(1, maxPk - minPk);

    const allElevs = sorted.flatMap((s) => [s.groundElevM, s.designElevM]);
    const minZ = Math.min(...allElevs) - 1;
    const maxZ = Math.max(...allElevs) + 1;
    const zSpan = Math.max(1, maxZ - minZ);

    const w = 680;
    const h = 190;
    const padX = 28;
    const padY = 22;

    const toX = (pk: number) => padX + ((pk - minPk) / pkSpan) * (w - padX * 2);
    const toY = (z: number) => h - padY - ((z - minZ) / zSpan) * (h - padY * 2);

    const groundPoints = sorted.map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.groundElevM).toFixed(1)}`).join(' ');
    const designPoints = sorted.map((s) => `${toX(s.chainageM).toFixed(1)},${toY(s.designElevM).toFixed(1)}`).join(' ');

    return { sorted, w, h, toX, toY, groundPoints, designPoints };
  }, [stations]);

  const complianceColor =
    gradientResult.compliance === 'OPTIMAL_HIGHWAY'
      ? 'text-[#2ec4b6] border-[#2ec4b6]/40 bg-[#2ec4b6]/10'
      : gradientResult.compliance === 'ACCEPTABLE_REGIONAL'
      ? 'text-[#2ec4b6] border-[#2ec4b6]/30 bg-[#2ec4b6]/10'
      : 'text-[#ff9f1c] border-[#ff9f1c]/40 bg-[#ff9f1c]/10';

  return (
    <div className="space-y-6">
      {/* SECTION 1: Start-to-End Point Gradient Analyzer */}
      <section aria-labelledby="road-gradient-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ec4b6]/15 text-[#2ec4b6]">
              <Route className="h-5 w-5" />
            </span>
            <div>
              <h2 id="road-gradient-heading" className="text-lg font-bold text-white">
                تحليل الميول والانحدار الطولي بين نقطتين (Pente / Rampe)
              </h2>
              <p className="text-xs text-slate-400">
                أدخل إحداثيات نقطتي البداية والنهاية (PK والمنسوب Z) لتحليل الميل وتصنيفه وفق معايير الطرق الجزائرية
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label htmlFor="grad-start-pk" className="mb-1.5 block text-xs font-semibold text-slate-300">
              نقطة البداية PK (م)
            </label>
            <input
              id="grad-start-pk"
              type="number"
              step="1"
              value={startPkStr}
              onChange={(e) => setStartPkStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
            />
          </div>
          <div>
            <label htmlFor="grad-start-z" className="mb-1.5 block text-xs font-semibold text-slate-300">
              منسوب البداية Z1 (م)
            </label>
            <input
              id="grad-start-z"
              type="number"
              step="0.1"
              value={startZStr}
              onChange={(e) => setStartZStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
            />
          </div>
          <div>
            <label htmlFor="grad-end-pk" className="mb-1.5 block text-xs font-semibold text-slate-300">
              نقطة النهاية PK (م)
            </label>
            <input
              id="grad-end-pk"
              type="number"
              step="1"
              value={endPkStr}
              onChange={(e) => setEndPkStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
            />
          </div>
          <div>
            <label htmlFor="grad-end-z" className="mb-1.5 block text-xs font-semibold text-slate-300">
              منسوب النهاية Z2 (م)
            </label>
            <input
              id="grad-end-z"
              type="number"
              step="0.1"
              value={endZStr}
              onChange={(e) => setEndZStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#2ec4b6]"
            />
          </div>
        </div>

        {!gradientResult.valid ? (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#ff9f1c]/40 bg-[#ff9f1c]/10 p-3.5 text-xs text-[#ffbe6b]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#ff9f1c]" />
            <span>{gradientResult.error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              data-testid="road-gradient-results"
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-white/[0.08] pt-4"
            >
              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">نسبة الميل الطولي</div>
                <div className="mt-1 flex items-center gap-1.5 font-mono-tabular text-lg font-bold text-[#ff9f1c]">
                  {gradientResult.direction === 'rampe' ? (
                    <TrendingUp className="h-4 w-4 text-[#2ec4b6]" />
                  ) : gradientResult.direction === 'pente' ? (
                    <TrendingDown className="h-4 w-4 text-[#ff9f1c]" />
                  ) : (
                    <Minus className="h-4 w-4 text-slate-400" />
                  )}
                  <span dir="ltr">{gradientResult.slopePercent}%</span>
                </div>
                <div className="text-[11px] text-slate-400">{gradientResult.directionLabelAr}</div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">زاوية / نسبة الميل</div>
                <div className="mt-1 font-mono-tabular text-base font-bold text-white" dir="ltr">
                  {gradientResult.slopeAngleDeg}°
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-400" dir="ltr">
                  {gradientResult.slopeRatioText}
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">المسافة الأفقية (ΔL)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                  {gradientResult.horizontalDistanceM} <span className="text-xs font-normal text-slate-400">م</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">فرق المنسوب (ΔZ)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-[#2ec4b6]" dir="ltr">
                  {gradientResult.elevationDiffM > 0 ? `+${gradientResult.elevationDiffM}` : gradientResult.elevationDiffM} m
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">المسافة المائلة الحقيقية</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                  {gradientResult.slopeDistanceM} <span className="text-xs font-normal text-slate-400">م</span>
                </div>
              </div>
            </div>

            {/* Engineering Compliance Feedback */}
            <div className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs ${complianceColor}`}>
              {gradientResult.compliance === 'OPTIMAL_HIGHWAY' ||
              gradientResult.compliance === 'ACCEPTABLE_REGIONAL' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold">{gradientResult.complianceLabelAr}</div>
                <div className="text-slate-300">{gradientResult.recommendationAr}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Linear Cut & Fill Earthworks */}
      <section aria-labelledby="road-earthworks-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 id="road-earthworks-heading" className="text-lg font-bold text-white">
              حسابات الحفر والردم للمشاريع الخطية (Déblais / Remblais)
            </h2>
            <p className="text-xs text-slate-400">
              مقاطع عرضية شبه منحرفة مع الكشف التلقائي عن نقاط الانقلاب (Passage Déblai/Remblai) ومعامل الانتفاش
            </p>
          </div>
          <button
            type="button"
            onClick={addStation}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#2ec4b6]/40 bg-[#2ec4b6]/12 px-3.5 py-2 text-xs font-semibold text-[#2ec4b6] hover:bg-[#2ec4b6]/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة محطة (PK)</span>
          </button>
        </div>

        {/* Road Cross-Section Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label htmlFor="road-proj-name" className="mb-1.5 block text-xs font-semibold text-slate-300">
              اسم المحور / المشروع
            </label>
            <input
              id="road-proj-name"
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
            />
          </div>
          <div>
            <label htmlFor="road-width" className="mb-1.5 block text-xs font-semibold text-slate-300">
              عرض القارعة Plateforme (م)
            </label>
            <input
              id="road-width"
              type="number"
              min="1"
              step="0.5"
              value={roadWidthStr}
              onChange={(e) => setRoadWidthStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
            />
          </div>
          <div>
            <label htmlFor="road-batter" className="mb-1.5 block text-xs font-semibold text-slate-300">
              ميل الأكتاف Talus (H:V)
            </label>
            <input
              id="road-batter"
              type="number"
              min="0"
              step="0.25"
              value={sideSlopeStr}
              onChange={(e) => setSideSlopeStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
            />
          </div>
          <div>
            <label htmlFor="road-swell" className="mb-1.5 block text-xs font-semibold text-slate-300">
              معامل الانتفاش (Foisonnement)
            </label>
            <input
              id="road-swell"
              type="number"
              min="1"
              max="1.6"
              step="0.05"
              value={swellFactorStr}
              onChange={(e) => setSwellFactorStr(e.target.value)}
              className="font-mono-tabular w-full min-h-[44px] rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#ff9f1c]"
            />
          </div>
        </div>

        {/* SVG Longitudinal Profile Diagram */}
        {profileSvg && (
          <div className="rounded-xl border border-white/[0.08] bg-[#0f1419] p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-200">المقطع الطولي التقريبي (Profil en Long)</span>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 bg-[#ff9f1c]" />
                  <span>الأرض الطبيعية (TN)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 bg-[#2ec4b6]" />
                  <span>الخط الأحمر للمشروع (Projet)</span>
                </span>
              </div>
            </div>
            <svg
              viewBox={`0 0 ${profileSvg.w} ${profileSvg.h}`}
              className="w-full h-40 sm:h-48 overflow-visible"
              role="img"
              aria-label="رسم بياني للمقطع الطولي للطريق مقارنة بين الأرض الطبيعية وخط المشروع"
            >
              {/* Horizontal baseline grid */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1={20}
                  x2={profileSvg.w - 20}
                  y1={profileSvg.h * ratio}
                  y2={profileSvg.h * ratio}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Natural Ground Polyline */}
              <polyline
                fill="none"
                stroke="#ff9f1c"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                points={profileSvg.groundPoints}
              />

              {/* Design Line Polyline */}
              <polyline
                fill="none"
                stroke="#2ec4b6"
                strokeWidth="3"
                points={profileSvg.designPoints}
              />

              {/* Station Nodes */}
              {profileSvg.sorted.map((s) => {
                const cx = profileSvg.toX(s.chainageM);
                const cyGround = profileSvg.toY(s.groundElevM);
                const cyDesign = profileSvg.toY(s.designElevM);
                return (
                  <g key={s.id}>
                    <line
                      x1={cx}
                      x2={cx}
                      y1={cyGround}
                      y2={cyDesign}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                    />
                    <circle cx={cx} cy={cyGround} r="4" fill="#ff9f1c" />
                    <circle cx={cx} cy={cyDesign} r="4.5" fill="#2ec4b6" />
                    <text
                      x={cx}
                      y={profileSvg.h - 4}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      PK {s.chainageM}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Editable Station Points Table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0f1419] text-slate-400">
              <tr>
                <th className="px-3 py-3 font-semibold">المحطة PK (م)</th>
                <th className="px-3 py-3 font-semibold">الأرض الطبيعية TN (م)</th>
                <th className="px-3 py-3 font-semibold">خط المشروع Projet (م)</th>
                <th className="px-3 py-3 font-semibold">الوضع (حفر / ردم)</th>
                <th className="px-3 py-3 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-[#19222a]/70">
              {stations.map((st, idx) => {
                const diff = Number((st.designElevM - st.groundElevM).toFixed(2));
                const isFill = diff > 0;
                const isCut = diff < 0;
                return (
                  <tr key={st.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        aria-label={`مسافة المحطة ${idx + 1}`}
                        value={st.chainageM}
                        onChange={(e) => updateStation(st.id, 'chainageM', e.target.value)}
                        className="font-mono-tabular w-24 min-h-[38px] rounded-lg border border-white/10 bg-[#0f1419] px-2.5 py-1 text-white outline-none focus:border-[#2ec4b6]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        aria-label={`منسوب الأرض الطبيعية للمحطة ${idx + 1}`}
                        value={st.groundElevM}
                        onChange={(e) => updateStation(st.id, 'groundElevM', e.target.value)}
                        className="font-mono-tabular w-28 min-h-[38px] rounded-lg border border-white/10 bg-[#0f1419] px-2.5 py-1 text-white outline-none focus:border-[#ff9f1c]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        aria-label={`منسوب المشروع للمحطة ${idx + 1}`}
                        value={st.designElevM}
                        onChange={(e) => updateStation(st.id, 'designElevM', e.target.value)}
                        className="font-mono-tabular w-28 min-h-[38px] rounded-lg border border-white/10 bg-[#0f1419] px-2.5 py-1 text-white outline-none focus:border-[#2ec4b6]"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono-tabular font-semibold">
                      {isCut ? (
                        <span className="text-[#ff9f1c]">حفر {Math.abs(diff)} م</span>
                      ) : isFill ? (
                        <span className="text-[#2ec4b6]">ردم +{diff} م</span>
                      ) : (
                        <span className="text-slate-400">تطابق (0.0 م)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeStation(st.id)}
                        disabled={stations.length <= 2}
                        aria-label={`حذف المحطة ${idx + 1}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-[#ff9f1c] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Earthworks Outputs */}
        {!earthworksResult.valid ? (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#ff9f1c]/40 bg-[#ff9f1c]/10 p-3.5 text-xs text-[#ffbe6b]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#ff9f1c]" />
            <span>{earthworksResult.error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              data-testid="road-earthworks-results"
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">الطول الخطي / أقصى ميل</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                  {earthworksResult.totalLengthM} <span className="text-xs font-normal text-slate-400">م</span>
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-400">
                  ميل أقصى {earthworksResult.maxAbsGradientPercent}%
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">إجمالي الحفر (Déblais)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-[#ff9f1c]">
                  {earthworksResult.totalCutVolumeM3} <span className="text-xs font-normal text-slate-400">م³</span>
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-400">
                  بعد الانتفاش: {earthworksResult.swelledCutVolumeM3} م³
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">إجمالي الردم (Remblais)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-[#2ec4b6]">
                  {earthworksResult.totalFillVolumeM3} <span className="text-xs font-normal text-slate-400">م³</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">الميزان الترابي الصافي</div>
                <div
                  className={`mt-1 font-mono-tabular text-lg font-bold ${
                    earthworksResult.netEarthBalanceM3 >= 0 ? 'text-[#ff9f1c]' : 'text-[#2ec4b6]'
                  }`}
                  dir="ltr"
                >
                  {earthworksResult.netEarthBalanceM3 > 0
                    ? `+${earthworksResult.netEarthBalanceM3}`
                    : earthworksResult.netEarthBalanceM3}{' '}
                  m³
                </div>
                <div className="text-[11px] text-slate-400">
                  {earthworksResult.netEarthBalanceM3 >= 0 ? 'فائض حفر للترحيل' : 'عجز ردم للاستجلاب'}
                </div>
              </div>

              <div className="rounded-xl bg-[#0f1419]/90 border border-white/[0.06] p-3.5">
                <div className="text-[11px] text-slate-400">نقلات الشاحنات (15 م³)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                  {earthworksResult.truckTrips15m3} <span className="text-xs font-normal text-slate-400">رحلة</span>
                </div>
              </div>
            </div>

            {/* Segment-by-Segment Details */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f1419] text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">المقطع</th>
                    <th className="px-3 py-2.5 font-semibold">الطول</th>
                    <th className="px-3 py-2.5 font-semibold">ميل المشروع</th>
                    <th className="px-3 py-2.5 font-semibold">حجم الحفر</th>
                    <th className="px-3 py-2.5 font-semibold">حجم الردم</th>
                    <th className="px-3 py-2.5 font-semibold">ملاحظة المقطع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] bg-[#19222a]/60">
                  {earthworksResult.segments.map((seg) => (
                    <tr key={`${seg.fromChainageM}-${seg.toChainageM}`}>
                      <td className="px-3 py-2.5 font-mono-tabular text-white" dir="ltr">
                        PK {seg.fromChainageM} → PK {seg.toChainageM}
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-slate-300">
                        {seg.lengthM} م
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-slate-200" dir="ltr">
                        {seg.designGradient.slopePercent}%
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-[#ff9f1c]">
                        {seg.cutVolumeM3} م³
                      </td>
                      <td className="px-3 py-2.5 font-mono-tabular text-[#2ec4b6]">
                        {seg.fillVolumeM3} م³
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">
                        {seg.hasTransitionPoint
                          ? `نقطة انقلاب عند PK ${seg.transitionChainageM}`
                          : seg.designGradient.directionLabelAr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveEarthworks}
                className="btn-mango inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة إلى كشف الكميات</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
