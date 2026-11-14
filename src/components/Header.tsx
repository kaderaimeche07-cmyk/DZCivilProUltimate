import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { useI18n } from '../i18n/I18nContext';
import type { AppLang } from '../i18n/translations';

export type AppTab = 'calculators' | 'roads' | 'quarries' | 'reference' | 'boq';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
}

const LANG_OPTIONS: AppLang[] = ['ar', 'fr', 'en'];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
  theme = 'night',
  onToggleTheme,
}) => {
  const { lang, setLang, t } = useI18n();

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'calculators', label: t.nav.calculators },
    { id: 'roads', label: t.nav.roads },
    { id: 'quarries', label: t.nav.quarries },
    { id: 'reference', label: t.nav.reference },
    { id: 'boq', label: t.nav.boqCount(savedCount) },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] theme-day:border-slate-200 bg-[#080c0a]/95 theme-day:bg-white/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('calculators');
          }}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base lg:text-lg font-extrabold tracking-tight text-[#f4f7f2] theme-day:text-slate-900 whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-[10px] bg-[#0f1612] theme-day:bg-slate-100 border border-[#84cc16]/35 theme-day:border-lime-600/35 shrink-0">
            <svg viewBox="0 0 32 32" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
              <circle cx="16" cy="16" r="11.5" fill="#070b09" stroke="#84cc16" strokeWidth="2.2" />
              <circle cx="16" cy="16" r="4.5" fill="#84cc16" fillOpacity="0.22" stroke="#a3e635" strokeWidth="1.2" />
              <line x1="16" y1="2" x2="16" y2="7" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="16" y1="25" x2="16" y2="30" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="2" y1="16" x2="7" y2="16" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="25" y1="16" x2="30" y2="16" stroke="#f59e0b" strokeWidth="1.5" />
            </svg>
          </span>
          <span>
            <bdi dir="ltr">{t.brandTitle}</bdi>
          </span>
        </a>

        {/* Zone 2: 5 Concise single-line navigation links (Desktop) */}
        <nav aria-label={t.nav.mainAria} className="hidden md:flex items-center gap-3.5 lg:gap-5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative min-h-[44px] py-2 text-xs lg:text-sm font-semibold transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
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

        {/* Zone 3: Language Switcher (AR | FR | EN) + Theme Toggle + Offline Badge + PWA */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Sleek AR | FR | EN Segmented Switcher */}
          <div
            role="group"
            aria-label={t.header.langSwitchAria}
            dir="ltr"
            data-testid="lang-switcher"
            className="inline-flex items-center rounded-[10px] border border-white/[0.1] theme-day:border-slate-300 bg-[#0f1612] theme-day:bg-slate-100 p-0.5 shrink-0"
          >
            {LANG_OPTIONS.map((code) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={active}
                  data-testid={`lang-btn-${code}`}
                  className={`min-h-[34px] sm:min-h-[38px] rounded-[8px] px-1.5 sm:px-2.5 text-[10px] sm:text-xs font-extrabold tracking-wide transition-colors duration-150 cursor-pointer ${
                    active
                      ? 'bg-[#84cc16] text-[#060a05] theme-day:bg-lime-700 theme-day:text-white'
                      : 'text-[#b7c9bc] theme-day:text-slate-600 hover:text-[#f4f7f2] theme-day:hover:text-slate-900'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Day / Night Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'night' ? t.header.dayModeTitle : t.header.nightModeTitle}
              aria-label={theme === 'night' ? t.header.dayModeLabel : t.header.nightModeLabel}
              className="inline-flex min-h-[38px] sm:min-h-[42px] items-center gap-1.5 rounded-[12px] border border-white/[0.1] theme-day:border-slate-300 bg-[#0f1612] theme-day:bg-slate-100 px-2 sm:px-3 py-1.5 text-xs font-bold text-[#f4f7f2] theme-day:text-slate-900 hover:border-[#84cc16]/50 transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <span>{theme === 'night' ? '☀️' : '🌙'}</span>
              <span className="hidden xl:inline whitespace-nowrap">
                {theme === 'night' ? t.header.dayModeLabel : t.header.nightModeLabel}
              </span>
            </button>
          )}

          {/* Sleek Offline Ready 100% Status Badge */}
          <div
            role="status"
            title={t.header.offlineBadgeTitle}
            className="inline-flex min-h-[38px] sm:min-h-[42px] items-center gap-1.5 rounded-[12px] border border-[#84cc16]/30 theme-day:border-lime-600/35 bg-[#070b09] theme-day:bg-lime-50 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold text-[#84cc16] theme-day:text-lime-800 whitespace-nowrap select-none"
          >
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]" />
            </span>
            <span className="font-mono-tabular tracking-wide">
              <bdi dir="ltr">
                <span className="xl:hidden">{t.header.offlineShort}</span>
                <span className="hidden xl:inline">{t.header.offlineFull}</span>
              </bdi>
            </span>
          </div>

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
