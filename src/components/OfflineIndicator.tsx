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
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 left-4 z-50 flex items-center gap-2.5 rounded-[14px] border border-[#f59e0b]/45 bg-[#0f1612]/95 px-3.5 py-2.5 text-xs font-semibold text-[#f59e0b] shadow-xl backdrop-blur-md transition-all duration-200"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>وضع عدم الاتصال — الحاسبات وبيانات المحاجر تعمل محلياً</span>
    </div>
  );
};
