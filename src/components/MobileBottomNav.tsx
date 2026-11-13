import React from 'react';
import { Calculator, Route, MapPin, BookOpen, ClipboardList } from 'lucide-react';
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
    { id: 'calculators', label: 'الحاسبات', icon: <Calculator className="h-5 w-5" /> },
    { id: 'roads', label: 'الطرقات', icon: <Route className="h-5 w-5" /> },
    { id: 'quarries', label: 'المحاجر', icon: <MapPin className="h-5 w-5" /> },
    { id: 'reference', label: 'المرجع', icon: <BookOpen className="h-5 w-5" /> },
    {
      id: 'boq',
      label: savedCount > 0 ? `السجل (${savedCount})` : 'السجل',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <nav
      aria-label="التنقل السريع للجوال"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/[0.1] bg-[#080c0a]/96 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
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
                isActive ? 'text-[#84cc16]' : 'text-[#b7c9bc] hover:text-[#f4f7f2]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-4 h-[2px] rounded-b bg-[#84cc16]"
                />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
