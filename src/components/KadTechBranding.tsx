import React from 'react';
import { useI18n } from '../i18n/I18nContext';

interface KadTechLogoSvgProps {
  size?: number;
  className?: string;
}

export const KadTechLogoSvg: React.FC<KadTechLogoSvgProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`.trim()}
    aria-hidden="true"
  >
    <polygon
      points="18,2 32,10 32,26 18,34 4,26 4,10"
      fill="#0F1713"
      stroke="#84CC16"
      strokeWidth="2.2"
    />
    <path
      d="M12 10V26M12 18L23 10M16 15.5L24 26"
      stroke="#F59E0B"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="18" r="2.2" fill="#84CC16" />
  </svg>
);

export const KadTechStudioBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useI18n();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <KadTechLogoSvg size={24} />
      <span>
        {t.footer.studioPrefix}{' '}
        <bdi dir="ltr">KAD-TECH Engineering Studio</bdi>{' '}
        {t.footer.studioSuffix}
      </span>
    </div>
  );
};

export const KadTechPdfStamp: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
    <KadTechLogoSvg size={24} />
    <span className="font-bold tracking-tight">
      <bdi dir="ltr">DZ Civil Pro Ultimate | Powered by KAD-TECH Engineering Studio</bdi>
    </span>
  </div>
);
