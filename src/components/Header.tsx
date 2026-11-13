import React from 'react';
import { Compass, ClipboardList } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab = 'quarries' | 'structural' | 'roads' | 'boq';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'quarries', label: 'الخريطة والمحاجر' },
  { id: 'structural', label: 'حاسبات البناء' },
  { id: 'roads', label: 'تصميم الطرقات' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0f1419]/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('quarries');
          }}
          className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#19222a] border border-white/10 text-[#ff9f1c]">
            <Compass className="h-4.5 w-4.5" />
          </span>
          <span>DZ Civil Pro Ultimate</span>
        </a>

        {/* Zone 2: Concise single-line navigation links (Desktop) */}
        <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'text-[#2ec4b6]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#2ec4b6]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action (+ optional PWA install when eligible) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => onSelectTab('boq')}
            className={`inline-flex min-h-[40px] sm:min-h-[44px] items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'boq'
                ? 'bg-[#2ec4b6] text-[#0f1419]'
                : 'btn-mango'
            }`}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span>كشف الكميات{savedCount > 0 ? ` (${savedCount})` : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
