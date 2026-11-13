import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Copy, Check, Trash2, Download } from 'lucide-react';
import { formatDzd } from '../utils/calculators.engine';
import { copyTextSafely, sanitizeCsvCell } from '../utils/security';
import type { SavedBoqItem } from '../types/boq';

interface SavedEstimatesPanelProps {
  items: SavedBoqItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onGoToCalculators: () => void;
}

export const SavedEstimatesPanel: React.FC<SavedEstimatesPanelProps> = ({
  items,
  onDeleteItem,
  onClearAll,
  onGoToCalculators,
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const totalCostDzd = useMemo(
    () => items.reduce((acc, item) => acc + (item.estimatedCostDzd ?? 0), 0),
    [items]
  );

  const handleCopyReport = async () => {
    if (items.length === 0) return;
    const lines = [
      'DZ Civil Pro Ultimate — كشف الكميات الميداني (Métré)',
      `إجمالي الميزانية التقديرية: ${formatDzd(totalCostDzd)}`,
      '===================================================',
      ...items.map((item, i) => {
        const metricsText = item.metrics.map((m) => `  - ${m.label}: ${m.value}`).join('\n');
        const costLine = item.estimatedCostDzd ? `\n  - التكلفة التقديرية: ${formatDzd(item.estimatedCostDzd)}` : '';
        return `${i + 1}. [${item.categoryLabel}] ${item.title}\n   (${item.summary})\n${metricsText}${costLine}`;
      }),
    ];

    const ok = await copyTextSafely(lines.join('\n\n'));
    if (ok) {
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const header = ['التصنيف', 'العنصر', 'التفاصيل', 'المؤشرات', 'التكلفة التقديرية (دج)'];
    const rows = items.map((item) => [
      item.categoryLabel,
      item.title,
      item.summary,
      item.metrics.map((m) => `${m.label}: ${m.value}`).join(' | '),
      String(item.estimatedCostDzd ?? 0),
    ]);
    const csvContent =
      '\uFEFF' +
      [header, ...rows]
        .map((row) => row.map((cell) => sanitizeCsvCell(cell)).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dz-civil-pro-metre-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section aria-labelledby="boq-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84cc16]/15 text-[#a3e635]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h2 id="boq-heading" className="text-lg font-bold text-white">
              كشف الكميات الميداني والتكلفة (Métré & Devis)
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              يُحفظ تلقائياً في ذاكرة الجهاز للوصول إليه دون إنترنت مع إمكانية التصدير لملف Excel (CSV)
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="btn-kiwi inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'تم نسخ التقرير' : 'نسخ التقرير النصي'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#84cc16]/35 bg-[#1a261e] px-3.5 py-2 text-xs font-bold text-[#d9f99d] hover:border-[#84cc16]/60 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>تصدير CSV</span>
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a261e] px-3.5 py-2 text-xs font-semibold text-[#c5d6c9] hover:border-[#f59e0b]/50 hover:text-[#fbbf24] cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>مسح الكل</span>
            </button>
          </div>
        )}
      </div>

      {/* Total Budget Summary Bar */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#84cc16]/25 bg-[#0b110d]/90 px-4 py-3">
          <div className="text-xs text-[#a3b8a8]">
            عدد البنود المحفوظة: <strong className="font-mono-tabular text-white">{items.length}</strong>
          </div>
          <div className="text-xs sm:text-sm">
            <span className="text-[#a3b8a8]">الميزانية التقديرية الإجمالية: </span>
            <strong className="font-mono-tabular text-base font-extrabold text-[#fbbf24]">
              {formatDzd(totalCostDzd)}
            </strong>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#0b110d]/60 p-8 text-center space-y-3">
          <ClipboardList className="mx-auto h-8 w-8 text-[#6b7f70]" />
          <div className="text-sm font-semibold text-slate-200">
            لا توجد حسابات محفوظة في كشف الكميات بعد
          </div>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-[#a3b8a8]">
            استخدم حاسبات الخرسانة أو حديد التسليح أو البناء أو تصميم الطرقات واضغط على
            &quot;إضافة إلى كشف الكميات&quot; لتجميع تقديرات الورشة هنا.
          </p>
          <button
            type="button"
            onClick={onGoToCalculators}
            className="btn-kiwi inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
          >
            الانتقال إلى الحاسبات الهندسية
          </button>
        </div>
      ) : (
        <div data-testid="boq-items-list" className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/[0.08] bg-[#0b110d]/85 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#a3b8a8]">
                    <span className="font-semibold text-[#a3e635]">{item.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.summary}</span>
                    {item.estimatedCostDzd ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular font-bold text-[#fbbf24]">
                          {formatDzd(item.estimatedCostDzd)}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  aria-label={`حذف ${item.title}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a3b8a8] hover:bg-white/5 hover:text-[#fbbf24] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-t border-white/[0.06] pt-3">
                {item.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="text-[11px] text-[#a3b8a8]">{m.label}</div>
                    <div className="font-mono-tabular text-xs sm:text-sm font-bold text-slate-100">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
