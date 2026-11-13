import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-[#f59e0b]/40 bg-[#121b15]/95 px-3.5 py-2 text-xs font-semibold text-[#fbbf24] shadow-xl backdrop-blur-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>وضع عدم الاتصال — الحاسبات وبيانات المحاجر تعمل محلياً</span>
    </div>
  );
};
