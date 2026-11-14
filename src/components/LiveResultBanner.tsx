import React, { useState } from 'react';
import { Plus, Copy, Check } from 'lucide-react';
import { copyTextSafely } from '../utils/security';
import { useI18n } from '../i18n/I18nContext';

interface LiveResultBannerProps {
  label: string;
  primaryValue: string;
  secondaryDetail?: string;
  costText?: string;
  copyCostLabel?: string;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  extraAction?: React.ReactNode;
}

export const LiveResultBanner: React.FC<LiveResultBannerProps> = ({
  label,
  primaryValue,
  secondaryDetail,
  costText,
  copyCostLabel,
  onSave,
  saveLabel,
  saveDisabled = false,
  extraAction,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const effectiveSaveLabel = saveLabel ?? t.common.saveToBoq;
  const effectiveCopyLabel = copyCostLabel ?? t.common.estimatedCost;

  const handleCopy = async () => {
    if (!costText) return;
    const ok = await copyTextSafely(costText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="sticky top-[3.65rem] md:top-[4.25rem] z-20 rounded-[14px] border border-[#84cc16]/30 theme-day:border-lime-600/35 bg-[#0c130f]/96 theme-day:bg-white/95 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xl theme-day:shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Live Primary Result & Cost */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 min-w-0">
          <div className="min-w-0">
            <div className="hidden sm:block text-[11px] font-medium text-[#b7c9bc] truncate">{label}</div>
            <div className="flex items-baseline gap-1.5">
              <strong className="font-mono-tabular text-base sm:text-xl font-extrabold text-[#84cc16] whitespace-nowrap">
                <bdi dir="ltr">{primaryValue}</bdi>
              </strong>
              {secondaryDetail && (
                <span className="hidden md:inline font-mono-tabular text-xs font-semibold text-[#d9f99d] theme-day:text-lime-800 whitespace-nowrap">
                  · <bdi dir="ltr">{secondaryDetail}</bdi>
                </span>
              )}
            </div>
          </div>

          {costText && (
            <div className="flex items-center gap-1.5 sm:border-s sm:border-white/[0.08] sm:ps-4">
              <div>
                <div className="hidden sm:block text-[11px] font-medium text-[#b7c9bc]">{t.common.estimatedCost}</div>
                <strong className="font-mono-tabular text-sm sm:text-lg font-extrabold text-[#f59e0b] whitespace-nowrap">
                  <bdi dir="ltr">{costText}</bdi>
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={effectiveCopyLabel}
                className="hidden sm:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] theme-day:border-slate-300 bg-[#070b09] theme-day:bg-slate-50 text-[#728879] theme-day:text-slate-600 hover:border-[#f59e0b]/50 hover:text-[#f59e0b] transition-colors duration-200 cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-[#84cc16]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {extraAction}
          {costText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={effectiveCopyLabel}
              className="inline-flex sm:hidden h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] theme-day:border-slate-300 bg-[#070b09] theme-day:bg-white text-[#728879] hover:border-[#f59e0b]/50 hover:text-[#f59e0b] active:scale-[0.97] transition-all duration-150 cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-[#84cc16]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              aria-label={effectiveSaveLabel}
              className="btn-kiwi inline-flex min-h-[46px] items-center gap-1.5 px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer disabled:opacity-45 shadow-md active:scale-[0.97] transition-transform duration-150"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">{t.common.saveShort}</span>
              <span className="hidden sm:inline">{effectiveSaveLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
