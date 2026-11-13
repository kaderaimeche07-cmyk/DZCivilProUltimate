import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab = 'calculators' | 'roads' | 'quarries' | 'reference' | 'boq';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
  theme = 'night',
  onToggleTheme,
}) => {
  const navItems: { id: AppTab; label: string }[] = [
    { id: 'calculators', label: 'الحاسبات' },
    { id: 'roads', label: 'الطرقات' },
    { id: 'quarries', label: 'المحاجر' },
    { id: 'reference', label: 'المرجع الهندسي' },
    { id: 'boq', label: savedCount > 0 ? `السجل (${savedCount})` : 'السجل' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] theme-day:border-slate-200 bg-[#080c0a]/95 theme-day:bg-white/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('calculators');
          }}
          className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold tracking-tight text-[#f4f7f2] theme-day:text-slate-900 whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0f1612] theme-day:bg-slate-100 border border-[#84cc16]/35 theme-day:border-lime-600/35">
            <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
              <circle cx="16" cy="16" r="11.5" fill="#070b09" stroke="#84cc16" strokeWidth="2.2" />
              <circle cx="16" cy="16" r="4.5" fill="#84cc16" fillOpacity="0.22" stroke="#a3e635" strokeWidth="1.2" />
              <line x1="16" y1="2" x2="16" y2="7" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="16" y1="25" x2="16" y2="30" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="2" y1="16" x2="7" y2="16" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="25" y1="16" x2="30" y2="16" stroke="#f59e0b" strokeWidth="1.5" />
            </svg>
          </span>
          <span>DZ Civil Pro Ultimate</span>
        </a>

        {/* Zone 2: 5 Concise single-line navigation links (Desktop) */}
        <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative min-h-[44px] py-2 text-sm font-semibold transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[#84cc16] theme-day:text-lime-700'
                    : 'text-[#b7c9bc] theme-day:text-slate-600 hover:text-[#f4f7f2] theme-day:hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[11px] h-[2px] bg-[#84cc16] theme-day:bg-lime-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle + Offline 100% Badge + PWA */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Day / Night Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'night' ? 'تفعيل وضع الورشة النهاري عالي التباين' : 'تفعيل الوضع الليلي للورشة'}
              aria-label={theme === 'night' ? 'وضع الورشة النهاري' : 'الوضع الليلي'}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-white/[0.1] theme-day:border-slate-300 bg-[#0f1612] theme-day:bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#f4f7f2] theme-day:text-slate-900 hover:border-[#84cc16]/50 transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <span>{theme === 'night' ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline">
                {theme === 'night' ? 'وضع الورشة النهاري' : 'الوضع الليلي'}
              </span>
            </button>
          )}

          {/* Sleek Offline Ready 100% Status Badge */}
          <div
            role="status"
            title="التطبيق يعمل 100% دون اتصال بالإنترنت في الورشات والميدان"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#84cc16]/30 theme-day:border-lime-600/35 bg-[#070b09] theme-day:bg-lime-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#84cc16] theme-day:text-lime-800 whitespace-nowrap select-none"
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]" />
            </span>
            <span className="font-mono-tabular tracking-wide text-[11px] sm:text-xs">
              <bdi dir="ltr">Offline Ready 100%</bdi>
            </span>
          </div>

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
