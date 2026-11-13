import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label="تثبيت التطبيق للعمل دون إنترنت"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#84cc16]/40 bg-[#84cc16]/12 px-3.5 py-2 text-xs font-semibold text-[#84cc16] transition-all duration-200 hover:bg-[#84cc16]/20 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="تثبيت التطبيق على آيفون"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/10 bg-[#0f1612] px-3 py-2 text-xs font-medium text-[#f4f7f2] transition-all duration-200 hover:border-[#84cc16]/40 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#84cc16] shrink-0" />
          <span>تثبيت</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <div className="console-panel w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="topographic-scale" aria-hidden="true" />
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 id="ios-install-title" className="text-base font-bold text-[#f4f7f2]">
                    تثبيت DZ Civil Pro على iOS
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    aria-label="إغلاق نافذة التثبيت"
                    className="flex h-11 w-11 items-center justify-center rounded-[12px] text-[#b7c9bc] hover:bg-white/5 hover:text-[#f4f7f2] transition-colors duration-200 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#b7c9bc]">
                  <li>1. اضغط على أيقونة المشاركة (Share) في شريط Safari.</li>
                  <li>2. مرّر للأسفل واختر إضافة إلى الشاشة الرئيسية (Add to Home Screen).</li>
                  <li>3. يعمل التطبيق بكامل حاسباته دون إنترنت في الورشات المعزولة.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="btn-kiwi mt-5 w-full min-h-[44px] py-2.5 text-sm cursor-pointer"
                >
                  فهمت
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
