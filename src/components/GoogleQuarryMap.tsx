import React, { useMemo, useState } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { GeoCoordinates, QuarryWithDistance } from '../utils/gps.locator';
import { findWilayaByCode } from '../data/wilayat';
import { useI18n } from '../i18n/I18nContext';
import {
  formatDistanceLocale,
  formatDurationLocale,
  getQuarryCategoryLabel,
} from '../i18n/translations';

interface GoogleQuarryMapProps {
  quarries: QuarryWithDistance[];
  origin: GeoCoordinates;
  selectedQuarryId: string | null;
  onSelectQuarry: (quarryId: string) => void;
  focusCoords?: { lat: number; lng: number; zoom?: number } | null;
}

export const GoogleQuarryMap: React.FC<GoogleQuarryMapProps> = ({
  quarries,
  origin,
  selectedQuarryId,
  onSelectQuarry,
  focusCoords,
}) => {
  const { lang, dir, t } = useI18n();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [infoWindowQuarry, setInfoWindowQuarry] = useState<QuarryWithDistance | null>(null);

  const center = useMemo(() => {
    if (focusCoords && Number.isFinite(focusCoords.lat) && Number.isFinite(focusCoords.lng)) {
      return { lat: focusCoords.lat, lng: focusCoords.lng };
    }
    if (Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
      return { lat: origin.lat, lng: origin.lng };
    }
    return { lat: 36.7538, lng: 3.0588 };
  }, [focusCoords, origin.lat, origin.lng]);

  const validQuarries = useMemo(
    () => quarries.filter((q) => Number.isFinite(q.lat) && Number.isFinite(q.lng)),
    [quarries]
  );

  if (!apiKey) {
    return (
      <div className="relative h-[360px] sm:h-[420px] lg:h-[520px] w-full overflow-hidden rounded-[14px] border border-[#f59e0b]/35 bg-[#070b09] flex flex-col items-center justify-center p-6 text-center space-y-2">
        <p className="text-sm font-bold text-[#f4f7f2]">{t.quarries.mapModes.googleUnavailable}</p>
        <p className="text-xs text-[#b7c9bc] max-w-md">
          {t.quarries.mapModes.googleUnavailableHint}
        </p>
      </div>
    );
  }

  const infoWilayaObj = infoWindowQuarry ? findWilayaByCode(infoWindowQuarry.wilayaCode) : undefined;
  const infoWilayaName = infoWindowQuarry
    ? lang === 'ar'
      ? infoWindowQuarry.wilayaName
      : (infoWilayaObj?.frName ?? infoWindowQuarry.wilayaName)
    : '';

  return (
    <div className="relative h-[360px] sm:h-[420px] lg:h-[520px] w-full overflow-hidden rounded-[14px] border border-[#84cc16]/25 bg-[#070b09]">
      <APIProvider apiKey={apiKey} language={lang} region="DZ">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={center}
          defaultZoom={7}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-full w-full"
        >
          {/* Origin Marker */}
          {Number.isFinite(origin.lat) && Number.isFinite(origin.lng) && (
            <AdvancedMarker position={{ lat: origin.lat, lng: origin.lng }}>
              <div className="flex items-center justify-center h-8 px-2.5 rounded-full bg-[#f59e0b] border-2 border-white shadow-lg text-[10px] font-bold text-black whitespace-nowrap">
                {t.quarries.myLocationShort}
              </div>
            </AdvancedMarker>
          )}

          {/* Quarry Markers */}
          {validQuarries.map((q) => {
            const isSelected = q.id === selectedQuarryId;
            return (
              <AdvancedMarker
                key={q.id}
                position={{ lat: q.lat, lng: q.lng }}
                onClick={() => {
                  onSelectQuarry(q.id);
                  setInfoWindowQuarry(q);
                }}
              >
                <div
                  className={`flex items-center justify-center rounded-full font-bold shadow-lg transition-transform ${
                    isSelected
                      ? 'h-9 w-9 bg-[#f59e0b] text-[#080c0a] ring-2 ring-white scale-110'
                      : 'h-7 w-7 bg-[#84cc16] text-[#080c0a] hover:scale-105'
                  }`}
                  title={q.name}
                >
                  <bdi dir="ltr">{q.wilayaCode}</bdi>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow for selected quarry */}
          {infoWindowQuarry && (
            <InfoWindow
              position={{ lat: infoWindowQuarry.lat, lng: infoWindowQuarry.lng }}
              onCloseClick={() => setInfoWindowQuarry(null)}
            >
              <div className="p-2 text-start space-y-1.5 max-w-[240px]" dir={dir}>
                <div className="font-bold text-slate-900 text-sm">{infoWindowQuarry.name}</div>
                <div className="text-xs text-slate-600">
                  <bdi dir="ltr">{infoWindowQuarry.wilayaCode}</bdi> {infoWilayaName} · {infoWindowQuarry.municipality}
                </div>
                <div className="text-xs font-semibold text-amber-700">
                  {getQuarryCategoryLabel(infoWindowQuarry.category, lang)}
                </div>
                <div className="text-xs text-slate-500">{infoWindowQuarry.materials.slice(0, 3).join(' · ')}</div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono font-bold text-lime-700">
                  <span>
                    <bdi dir="ltr">{formatDistanceLocale(infoWindowQuarry.distanceKm, lang)}</bdi>
                  </span>
                  <span>~ {formatDurationLocale(infoWindowQuarry.estimatedMinutes, lang)}</span>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${infoWindowQuarry.lat},${infoWindowQuarry.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block w-full rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1 text-center text-xs no-underline"
                >
                  {t.quarries.openGoogleMaps}
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </APIProvider>
    </div>
  );
};

