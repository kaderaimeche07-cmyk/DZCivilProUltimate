import React from 'react';
import { Calculator, Route, MapPin, BookOpen, ClipboardList } from 'lucide-react';
import type { AppTab } from './Header';
import { useI18n } from '../i18n/I18nContext';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
}) => {
  const { t } = useI18n();

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'calculators', label: t.nav.calculators, icon: <Calculator className="h-5 w-5" /> },
    { id: 'roads', label: t.nav.roads, icon: <Route className="h-5 w-5" /> },
    { id: 'quarries', label: t.nav.quarries, icon: <MapPin className="h-5 w-5" /> },
    { id: 'reference', label: t.nav.referenceShort, icon: <BookOpen className="h-5 w-5" /> },
    {
      id: 'boq',
      label: t.nav.boqCount(savedCount),
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <nav
      aria-label={t.nav.mobileAria}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/[0.1] theme-day:border-slate-200 bg-[#080c0a]/96 theme-day:bg-white/96 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-[62px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'text-[#84cc16] theme-day:text-lime-700'
                  : 'text-[#b7c9bc] theme-day:text-slate-600 hover:text-[#f4f7f2] theme-day:hover:text-slate-900'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-4 h-[2px] rounded-b bg-[#84cc16] theme-day:bg-lime-600"
                />
              )}
              {tab.icon}
              <span className="truncate max-w-full px-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
