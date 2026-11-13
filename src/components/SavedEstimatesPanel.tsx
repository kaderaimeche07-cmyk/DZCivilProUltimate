import React, { useState } from 'react';
import { ClipboardList, Copy, Check, Trash2 } from 'lucide-react';
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

  const handleCopyReport = async () => {
    if (items.length === 0) return;
    const lines = [
      'DZ Civil Pro Ultimate — كشف الكميات الميداني (Métré)',
      '===================================================',
      ...items.map((item, i) => {
        const metricsText = item.metrics.map((m) => `  - ${m.label}: ${m.value}`).join('\n');
        return `${i + 1}. [${item.categoryLabel}] ${item.title}\n   (${item.summary})\n${metricsText}`;
      }),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored silently in restricted environments
    }
  };

  return (
    <section aria-labelledby="boq-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ec4b6]/15 text-[#2ec4b6]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h2 id="boq-heading" className="text-lg font-bold text-white">
              كشف الكميات الميداني المحفوظ محلياً (Métré)
            </h2>
            <p className="text-xs text-slate-400">
              يُحفظ تلقائياً في ذاكرة الجهاز للوصول إليه دون إنترنت في موقع البناء
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2.5">
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
              onClick={onClearAll}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#222d38] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-[#ff9f1c]/50 hover:text-[#ff9f1c] cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>مسح الكل</span>
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#0f1419]/60 p-8 text-center space-y-3">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-500" />
          <div className="text-sm font-semibold text-slate-200">
            لا توجد حسابات محفوظة في كشف الكميات بعد
          </div>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-400">
            استخدم حاسبات الخرسانة أو حديد التسليح أو البناء أو تصميم الطرقات واضغط على
            &quot;إضافة إلى كشف الكميات&quot; لتجميع تقديرات الورشة هنا.
          </p>
          <button
            type="button"
            onClick={onGoToCalculators}
            className="btn-mango inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
          >
            الانتقال إلى الحاسبات الهندسية
          </button>
        </div>
      ) : (
        <div data-testid="boq-items-list" className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/[0.08] bg-[#0f1419]/85 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-[#2ec4b6]">{item.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.summary}</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  aria-label={`حذف ${item.title}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-[#ff9f1c] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-t border-white/[0.06] pt-3">
                {item.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="text-[11px] text-slate-400">{m.label}</div>
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
