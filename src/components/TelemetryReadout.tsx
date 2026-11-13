import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyTextSafely } from '../utils/security';

export interface TelemetryMetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  accent?: 'kiwi' | 'amber' | 'neutral';
  dir?: 'ltr' | 'rtl';
  copyText?: string;
  icon?: React.ReactNode;
}

interface TelemetryReadoutStripProps {
  testId?: string;
  items: TelemetryMetricItem[];
  columnsClassName?: string;
}

export const TelemetryReadoutStrip: React.FC<TelemetryReadoutStripProps> = ({
  testId,
  items,
  columnsClassName = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async (item: TelemetryMetricItem) => {
    const text = item.copyText ?? `${item.value}${item.unit ? ` ${item.unit}` : ''}`;
    const ok = await copyTextSafely(String(text));
    if (ok) {
      setCopiedId(item.id);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopiedId(null), 1600);
    }
  };

  return (
    <div className="telemetry-strip">
      <div className="topographic-scale" aria-hidden="true" />
      <div
        data-testid={testId}
        className={`grid ${columnsClassName} gap-px bg-white/[0.08]`}
      >
        {items.map((item) => {
          const isCopied = copiedId === item.id;
          const valueColor =
            item.accent === 'kiwi'
              ? 'text-[#84cc16]'
              : item.accent === 'amber'
                ? 'text-[#f59e0b]'
                : 'text-[#f4f7f2]';

          return (
            <div
              key={item.id}
              className="telemetry-cell relative flex flex-col justify-between p-3.5 sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-[#b7c9bc] leading-snug">
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  aria-label={`نسخ ${item.label}`}
                  title={`نسخ ${item.label}`}
                  className="inline-flex h-11 w-11 -mt-1.5 -ml-1.5 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-[#0f1612] text-[#728879] hover:border-[#84cc16]/50 hover:text-[#a3e635] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-[#84cc16]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="mt-2 space-y-0.5">
                <div
                  className={`flex items-baseline gap-1.5 font-mono-tabular text-lg sm:text-xl font-extrabold tracking-tight ${valueColor}`}
                  dir={item.dir}
                >
                  {item.icon}
                  <span className="whitespace-nowrap"><bdi dir="ltr">{item.value}</bdi></span>
                  {item.unit && (
                    <span className="text-xs font-semibold text-[#b7c9bc] whitespace-nowrap">
                      {item.unit}
                    </span>
                  )}
                </div>
                {item.subtext && (
                  <div className="font-mono-tabular text-[11px] text-[#728879] whitespace-nowrap">
                    <bdi dir="ltr">{item.subtext}</bdi>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
