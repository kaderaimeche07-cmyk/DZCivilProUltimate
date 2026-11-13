import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  icon,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-[#070b09]/90 overflow-hidden transition-colors duration-200">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full min-h-[52px] items-center justify-between gap-3 px-4 py-3 text-right hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#0f1612] text-[#f59e0b]">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#f4f7f2]">{title}</span>
              {badge && (
                <span className="font-mono-tabular text-[11px] font-semibold text-[#84cc16]">
                  · {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#b7c9bc] truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#b7c9bc] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#84cc16]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-white/[0.08] p-4 sm:p-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};
