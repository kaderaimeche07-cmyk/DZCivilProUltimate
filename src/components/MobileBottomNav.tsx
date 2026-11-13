import React from 'react';
import { LayoutGrid, MapPin, Calculator, Route, ClipboardList } from 'lucide-react';
import type { AppTab } from './Header';

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
  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'الرئيسية', icon: <LayoutGrid className="h-5 w-5" /> },
    { id: 'structural', label: 'الحاسبات', icon: <Calculator className="h-5 w-5" /> },
    { id: 'roads', label: 'الطرقات', icon: <Route className="h-5 w-5" /> },
    { id: 'quarries', label: 'المحاجر', icon: <MapPin className="h-5 w-5" /> },
    {
      id: 'boq',
      label: savedCount > 0 ? `الكشف (${savedCount})` : 'الكشف',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <nav
      aria-label="التنقل السريع للجوال"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[#84cc16]/15 bg-[#0b110d]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'text-[#a3e635]' : 'text-[#a3b8a8] hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
