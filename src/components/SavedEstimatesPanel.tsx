import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Copy,
  Check,
  Trash2,
  Download,
  AlertTriangle,
  Share2,
  Printer,
  Upload,
} from 'lucide-react';
import { copyTextSafely, sanitizeCsvCell } from '../utils/security';
import { BottomSheet } from './BottomSheet';
import { KadTechPdfStamp } from './KadTechBranding';
import type { SavedBoqItem } from '../types/boq';
import { useI18n } from '../i18n/I18nContext';
import { buildBoqReportText, formatCurrencyLocale } from '../i18n/translations';

interface SavedEstimatesPanelProps {
  items: SavedBoqItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onGoToCalculators: () => void;
  onNotify?: (message: string) => void;
}

export const SavedEstimatesPanel: React.FC<SavedEstimatesPanelProps> = ({
  items,
  onDeleteItem,
  onClearAll,
  onGoToCalculators,
  onNotify,
}) => {
  const { lang, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
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

  const reportText = useMemo(() => buildBoqReportText(items, lang), [items, lang]);

  const handleCopyReport = async () => {
    if (items.length === 0) return;
    const ok = await copyTextSafely(reportText);
    if (ok) {
      setCopied(true);
      onNotify?.(t.boq.copiedToast);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const header = t.boq.csvHeader;
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

  const handlePrintPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const whatsAppShareUrl = useMemo(() => {
    if (items.length === 0) return '#';
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
  }, [items.length, reportText]);

  const reportDateIso = new Date().toISOString().slice(0, 10);

  return (
    <section
      aria-labelledby="boq-heading"
      className="console-panel overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black"
    >
      <div className="topographic-scale print:hidden" aria-hidden="true" />
      <div className="p-4 sm:p-6 space-y-5">
        {/* Official Print-Only Top Header for PDF Devis Estimatif */}
        <div
          data-testid="pdf-print-header"
          className="hidden print:flex items-center justify-between gap-4 border-b-2 border-slate-800 pb-3 mb-2 text-slate-900"
        >
          <KadTechPdfStamp className="text-xs sm:text-sm text-slate-900" />
          <div className="text-end text-[11px] text-slate-600">
            <div>
              {t.boq.pdfHeaderTitle} (<bdi dir="ltr">Devis Estimatif</bdi>)
            </div>
            <div className="font-mono">
              <bdi dir="ltr">{reportDateIso}</bdi>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4 print:border-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16] print:border-slate-300 print:bg-slate-100 print:text-slate-800">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h1 id="boq-heading" className="text-lg sm:text-xl font-bold text-[#f4f7f2] print:text-black">
                {t.boq.headingMain}{' '}
                <bdi dir="ltr">{t.boq.headingParen}</bdi>
              </h1>
              <p className="text-xs text-[#b7c9bc] print:text-slate-600">
                {t.boq.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Equal 2-Column Action Grid (6 Tools) + Full-Width Clear All Button */}
        {items.length > 0 && (
          <div className="space-y-2.5 print:hidden">
            <div data-testid="boq-actions-grid" className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyReport}
                className="btn-kiwi w-full inline-flex min-h-[46px] items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-center cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
                <span>{copied ? t.boq.copiedReport : t.boq.copyReport}</span>
              </button>

              <a
                href={whatsAppShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] border border-[#84cc16]/40 bg-[#070b09] px-3.5 py-2 text-xs font-bold text-[#a3e635] hover:bg-[#84cc16]/15 hover:border-[#84cc16] transition-colors duration-200 text-center no-underline cursor-pointer"
              >
                <Share2 className="h-4 w-4 shrink-0 text-[#84cc16]" />
                <span>{t.boq.shareWhatsApp}</span>
              </a>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-[#070b09] px-3.5 py-2 text-xs font-bold text-[#d4e2d7] hover:border-white/30 transition-colors duration-200 text-center cursor-pointer"
              >
                <Printer className="h-4 w-4 shrink-0 text-[#b7c9bc]" />
                <span>{t.boq.printPdf}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] border border-[#f59e0b]/40 bg-[#070b09] px-3.5 py-2 text-xs font-bold text-[#fde68a] hover:border-[#f59e0b] transition-colors duration-200 text-center cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                <span>{t.boq.exportCsv}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const dataStr =
                    'data:text/json;charset=utf-8,' +
                    encodeURIComponent(JSON.stringify(items, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute(
                    'download',
                    `dz-civil-pro-backup-${new Date().toISOString().slice(0, 10)}.json`
                  );
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-[#070b09] px-3 py-2 text-xs font-semibold text-[#b7c9bc] hover:border-[#84cc16]/50 hover:text-[#84cc16] transition-colors duration-200 text-center cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>{t.boq.backupJson}</span>
              </button>

              <label className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-[#070b09] px-3 py-2 text-xs font-semibold text-[#b7c9bc] hover:border-[#84cc16]/50 hover:text-[#84cc16] transition-colors duration-200 text-center cursor-pointer">
                <Upload className="h-4 w-4 shrink-0" />
                <span>{t.boq.restoreJson}</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target?.result as string);
                        if (Array.isArray(parsed)) {
                          localStorage.setItem('dz_civil_pro_boq_v1', JSON.stringify(parsed));
                          window.location.reload();
                        } else {
                          onNotify?.(t.boq.invalidBackupToast);
                        }
                      } catch {
                        onNotify?.(t.boq.invalidBackupToast);
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>

            <button
              type="button"
              data-testid="boq-clear-all-btn"
              onClick={() => setConfirmClearOpen(true)}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#f59e0b]/35 bg-[#070b09] px-4 py-2 text-xs font-bold text-[#f59e0b] hover:border-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors duration-200 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>{t.boq.clearAll}</span>
            </button>
          </div>
        )}

        {/* Total Budget Telemetry Strip */}
        {items.length > 0 && (
          <div className="telemetry-strip print:border-slate-300 print:bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.08] print:bg-slate-200">
              <div className="telemetry-cell px-4 py-3.5 flex items-center justify-between print:bg-slate-50">
                <span className="text-xs font-medium text-[#b7c9bc] print:text-slate-600">
                  {t.boq.savedCountLabel}
                </span>
                <strong className="font-mono-tabular text-lg font-extrabold text-[#84cc16] print:text-slate-900">
                  <bdi dir="ltr">{items.length}</bdi>
                </strong>
              </div>
              <div className="telemetry-cell px-4 py-3.5 flex items-center justify-between print:bg-slate-50">
                <span className="text-xs font-medium text-[#b7c9bc] print:text-slate-600">
                  {t.boq.totalBudgetLabel}
                </span>
                <strong className="font-mono-tabular text-lg font-extrabold text-[#f59e0b] print:text-slate-900">
                  <bdi dir="ltr">{formatCurrencyLocale(totalCostDzd, lang)}</bdi>
                </strong>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-[#070b09]/70 p-8 text-center space-y-3 print:hidden">
            <ClipboardList className="mx-auto h-8 w-8 text-[#728879]" />
            <div className="text-sm font-semibold text-[#f4f7f2]">
              {t.boq.emptyTitle}
            </div>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-[#b7c9bc]">
              {t.boq.emptyHintBefore}
              <strong className="text-[#84cc16]">{t.boq.emptyHintStrong}</strong>
              {t.boq.emptyHintAfter}
            </p>
            <button
              type="button"
              onClick={onGoToCalculators}
              className="btn-kiwi inline-flex min-h-[44px] items-center px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              {t.boq.goToCalcs}
            </button>
          </div>
        ) : (
          <div data-testid="boq-items-list" className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[14px] border border-white/[0.08] bg-[#070b09]/95 p-4 space-y-3 print:border-slate-300 print:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#b7c9bc] print:text-slate-600">
                      <span className="font-semibold text-[#84cc16] print:text-slate-800">
                        {item.categoryLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{item.summary}</span>
                      {item.estimatedCostDzd ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular font-bold text-[#f59e0b] print:text-slate-900">
                            <bdi dir="ltr">{formatCurrencyLocale(item.estimatedCostDzd, lang)}</bdi>
                          </span>
                        </>
                      ) : null}
                    </div>
                    <h2 className="mt-1 text-base font-bold text-[#f4f7f2] print:text-black">
                      {item.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={t.common.deleteItemAria(item.title)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-[#0f1612] text-[#b7c9bc] hover:border-[#f59e0b]/45 hover:text-[#f59e0b] transition-colors duration-200 cursor-pointer print:hidden"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] overflow-hidden rounded-[12px] border border-white/[0.06] print:border-slate-200 print:bg-slate-200">
                  {item.metrics.map((m) => (
                    <div key={m.label} className="bg-[#0f1612] p-2.5 sm:p-3 print:bg-slate-50">
                      <div className="text-[11px] text-[#b7c9bc] print:text-slate-600">{m.label}</div>
                      <div className="mt-0.5 font-mono-tabular text-xs sm:text-sm font-bold text-[#f4f7f2] print:text-black whitespace-nowrap">
                        <bdi dir="ltr">{m.value}</bdi>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Official Print Footer & Legal Engineering Disclaimer (Visible on screen & in PDF export) */}
        <div
          data-testid="pdf-print-footer"
          className="mt-6 pt-4 border-t border-white/[0.08] print:border-slate-300 space-y-2.5 text-[11px] text-[#b7c9bc] print:text-slate-700"
        >
          <p className="leading-relaxed text-center">{t.boq.pdfLegalNote}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 pt-2 border-t border-white/[0.06] print:border-slate-300">
            <KadTechPdfStamp className="text-xs text-[#f4f7f2] print:text-slate-900" />
            <span className="hidden print:inline font-mono text-[10px] text-slate-500">
              <bdi dir="ltr">
                {t.boq.pdfGeneratedOffline} · {reportDateIso}
              </bdi>
            </span>
          </div>
        </div>
      </div>

      <BottomSheet
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title={t.boq.confirmTitle}
        subtitle={t.boq.confirmSub}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              className="min-h-[46px] rounded-[12px] border border-white/[0.1] bg-[#0f1612] text-xs font-bold text-[#f4f7f2] cursor-pointer"
            >
              {t.boq.confirmCancel}
            </button>
            <button
              type="button"
              onClick={() => {
                onClearAll();
                setConfirmClearOpen(false);
              }}
              className="btn-amber min-h-[46px] text-xs font-bold cursor-pointer"
            >
              {t.boq.confirmAction}
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-[14px] border border-[#f59e0b]/35 bg-[#f59e0b]/10 p-4 text-xs text-[#fde68a]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#f59e0b]" />
          <p className="leading-relaxed">{t.boq.confirmBody(items.length)}</p>
        </div>
      </BottomSheet>
    </section>
  );
};

