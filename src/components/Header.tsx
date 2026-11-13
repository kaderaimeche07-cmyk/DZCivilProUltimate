import React from 'react';
import { ClipboardList } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab = 'overview' | 'quarries' | 'structural' | 'roads' | 'boq';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'overview', label: 'الرئيسية' },
  { id: 'quarries', label: 'المحاجر والخريطة' },
  { id: 'structural', label: 'الحاسبات والوحدات' },
  { id: 'roads', label: 'تصميم الطرقات' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#84cc16]/15 bg-[#0b110d]/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a261e] border border-[#84cc16]/30">
            <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
              <circle cx="16" cy="16" r="12" fill="#121b15" stroke="#84cc16" strokeWidth="2.4" />
              <circle cx="16" cy="16" r="4.5" fill="#d9f99d" fillOpacity="0.28" stroke="#a3e635" strokeWidth="1.2" />
              <circle cx="16" cy="8.5" r="1.2" fill="#f59e0b" />
              <circle cx="23.5" cy="16" r="1.2" fill="#f59e0b" />
              <circle cx="16" cy="23.5" r="1.2" fill="#f59e0b" />
              <circle cx="8.5" cy="16" r="1.2" fill="#f59e0b" />
            </svg>
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
                  isActive ? 'text-[#a3e635]' : 'text-[#c5d6c9] hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#84cc16]"
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
                ? 'btn-amber'
                : 'btn-kiwi'
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
