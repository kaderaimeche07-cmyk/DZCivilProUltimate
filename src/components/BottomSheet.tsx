import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[85dvh] flex flex-col rounded-t-[20px] sm:rounded-[18px] border border-white/[0.12] bg-[#0f1612] shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)] transition-transform duration-200"
      >
        {/* Drag Handle Affordance */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden" aria-hidden="true">
          <span className="h-1.5 w-11 rounded-full bg-white/20" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#f4f7f2] truncate">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#b7c9bc]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.closePanel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:border-[#84cc16]/50 hover:text-[#f4f7f2] transition-colors duration-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
        </div>

        {footer && (
          <div className="border-t border-white/[0.08] bg-[#080c0a] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
