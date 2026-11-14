import type { SavedBoqItem } from '../types/boq';
import type { MaterialCategory } from '../data/quarries';
import type { MasonryUnitType, RoadGradientCompliance } from '../utils/calculators.engine';
import type { AnyUnitId, UnitCategory } from '../utils/units';

export type AppLang = 'ar' | 'fr' | 'en';

export const LANG_STORAGE_KEY = 'dz_civil_lang';

export function isValidAppLang(value: unknown): value is AppLang {
  return value === 'ar' || value === 'fr' || value === 'en';
}

export function getLangDir(lang: AppLang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function getInitialLang(storage?: { getItem: (k: string) => string | null } | null): AppLang {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    const saved = store?.getItem(LANG_STORAGE_KEY);
    return isValidAppLang(saved) ? saved : 'ar';
  } catch {
    return 'ar';
  }
}

export function persistLang(lang: AppLang, storage?: { setItem: (k: string, v: string) => void } | null): void {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    store?.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function formatCurrencyLocale(amount: number, lang: AppLang): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const numStr = safe.toLocaleString('en-US');
  if (lang === 'ar') return `${numStr} دج`;
  if (lang === 'fr') return `${numStr} DA`;
  return `${numStr} DZD`;
}

export function formatDistanceLocale(km: number, lang: AppLang): string {
  if (!Number.isFinite(km) || km < 0) return '—';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return lang === 'ar' ? `${meters} م` : `${meters} m`;
  }
  return lang === 'ar' ? `${km.toFixed(1)} كم` : `${km.toFixed(1)} km`;
}

export function formatDurationLocale(minutes: number, lang: AppLang): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const rounded = Math.round(minutes);
  if (lang === 'ar') {
    if (rounded < 60) return `${rounded} د`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return m > 0 ? `${h} س ${m} د` : `${h} س`;
  }
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export interface UnitDisplaySpec {
  name: string;
  symbol: string;
}

const UNIT_LABELS: Record<AppLang, Record<AnyUnitId, UnitDisplaySpec>> = {
  ar: {
    m: { name: 'متر', symbol: 'م' },
    cm: { name: 'سنتيمتر', symbol: 'سم' },
    mm: { name: 'مليمتر', symbol: 'ملم' },
    dm: { name: 'ديسيمتر', symbol: 'دسم' },
    km: { name: 'كيلومتر', symbol: 'كم' },
    ft: { name: 'قدم (ft)', symbol: 'قدم' },
    in: { name: 'بوصة (in)', symbol: 'بوصة' },
    m2: { name: 'متر مربع', symbol: 'م²' },
    cm2: { name: 'سنتيمتر مربع', symbol: 'سم²' },
    are: { name: 'آر (100 م²)', symbol: 'آر' },
    ha: { name: 'هكتار', symbol: 'هكتار' },
    km2: { name: 'كم مربع', symbol: 'كم²' },
    ft2: { name: 'قدم مربع', symbol: 'قدم²' },
    m3: { name: 'متر مكعب', symbol: 'م³' },
    L: { name: 'لتر (دسم³)', symbol: 'لتر' },
    cm3: { name: 'سنتيمتر مكعب', symbol: 'سم³' },
    ft3: { name: 'قدم مكعب', symbol: 'قدم³' },
    kg: { name: 'كيلوغرام', symbol: 'كغ' },
    g: { name: 'غرام', symbol: 'غ' },
    q: { name: 'قنطار (100 كغ)', symbol: 'قنطار' },
    t: { name: 'طن متري', symbol: 'طن' },
    MPa: { name: 'ميغاباسكال', symbol: 'MPa' },
    bar: { name: 'بار', symbol: 'bar' },
    kg_cm2: { name: 'كغ/سم²', symbol: 'كغ/سم²' },
    kPa: { name: 'كيلوباسكال', symbol: 'kPa' },
    psi: { name: 'رطل/بوصة²', symbol: 'PSI' },
  },
  fr: {
    m: { name: 'Mètre', symbol: 'm' },
    cm: { name: 'Centimètre', symbol: 'cm' },
    mm: { name: 'Millimètre', symbol: 'mm' },
    dm: { name: 'Décimètre', symbol: 'dm' },
    km: { name: 'Kilomètre', symbol: 'km' },
    ft: { name: 'Pied (ft)', symbol: 'ft' },
    in: { name: 'Pouce (in)', symbol: 'in' },
    m2: { name: 'Mètre carré', symbol: 'm²' },
    cm2: { name: 'Centimètre carré', symbol: 'cm²' },
    are: { name: 'Are (100 m²)', symbol: 'a' },
    ha: { name: 'Hectare', symbol: 'ha' },
    km2: { name: 'Kilomètre carré', symbol: 'km²' },
    ft2: { name: 'Pied carré', symbol: 'ft²' },
    m3: { name: 'Mètre cube', symbol: 'm³' },
    L: { name: 'Litre (dm³)', symbol: 'L' },
    cm3: { name: 'Centimètre cube', symbol: 'cm³' },
    ft3: { name: 'Pied cube', symbol: 'ft³' },
    kg: { name: 'Kilogramme', symbol: 'kg' },
    g: { name: 'Gramme', symbol: 'g' },
    q: { name: 'Quintal (100 kg)', symbol: 'q' },
    t: { name: 'Tonne métrique', symbol: 't' },
    MPa: { name: 'Mégapascal', symbol: 'MPa' },
    bar: { name: 'Bar', symbol: 'bar' },
    kg_cm2: { name: 'kg/cm²', symbol: 'kg/cm²' },
    kPa: { name: 'Kilopascal', symbol: 'kPa' },
    psi: { name: 'PSI (lb/in²)', symbol: 'PSI' },
  },
  en: {
    m: { name: 'Meter', symbol: 'm' },
    cm: { name: 'Centimeter', symbol: 'cm' },
    mm: { name: 'Millimeter', symbol: 'mm' },
    dm: { name: 'Decimeter', symbol: 'dm' },
    km: { name: 'Kilometer', symbol: 'km' },
    ft: { name: 'Foot (ft)', symbol: 'ft' },
    in: { name: 'Inch (in)', symbol: 'in' },
    m2: { name: 'Square meter', symbol: 'm²' },
    cm2: { name: 'Square cm', symbol: 'cm²' },
    are: { name: 'Are (100 m²)', symbol: 'are' },
    ha: { name: 'Hectare', symbol: 'ha' },
    km2: { name: 'Square km', symbol: 'km²' },
    ft2: { name: 'Square foot', symbol: 'ft²' },
    m3: { name: 'Cubic meter', symbol: 'm³' },
    L: { name: 'Liter (dm³)', symbol: 'L' },
    cm3: { name: 'Cubic cm', symbol: 'cm³' },
    ft3: { name: 'Cubic foot', symbol: 'ft³' },
    kg: { name: 'Kilogram', symbol: 'kg' },
    g: { name: 'Gram', symbol: 'g' },
    q: { name: 'Quintal (100 kg)', symbol: 'q' },
    t: { name: 'Metric ton', symbol: 't' },
    MPa: { name: 'Megapascal', symbol: 'MPa' },
    bar: { name: 'Bar', symbol: 'bar' },
    kg_cm2: { name: 'kg/cm²', symbol: 'kg/cm²' },
    kPa: { name: 'Kilopascal', symbol: 'kPa' },
    psi: { name: 'PSI (lb/in²)', symbol: 'PSI' },
  },
};

export function getUnitDisplay(lang: AppLang, id: string): UnitDisplaySpec {
  const dict = UNIT_LABELS[lang] as Record<string, UnitDisplaySpec>;
  return dict[id] ?? { name: id, symbol: id };
}

export interface TranslationDict {
  brandTitle: string;
  nav: {
    mainAria: string;
    mobileAria: string;
    calculators: string;
    roads: string;
    quarries: string;
    reference: string;
    referenceShort: string;
    boq: string;
    boqCount: (count: number) => string;
  };
  header: {
    langSwitchAria: string;
    dayModeTitle: string;
    dayModeLabel: string;
    nightModeTitle: string;
    nightModeLabel: string;
    offlineBadgeTitle: string;
    offlineShort: string;
    offlineFull: string;
    pwaInstallBtn: string;
    pwaInstallAria: string;
    pwaShort: string;
    pwaIosAria: string;
    pwaIosTitle: string;
    pwaIosStep1: string;
    pwaIosStep2: string;
    pwaIosStep3: string;
    pwaIosCloseAria: string;
    pwaIosGotIt: string;
  };
  offlineToast: string;
  footer: {
    studioPrefix: string;
    studioSuffix: string;
    localBadge: string;
  };
  common: {
    saveToBoq: string;
    saveShort: string;
    estimatedCost: string;
    copyValueAria: (label: string) => string;
    closePanel: string;
    unitOf: (label: string) => string;
    advancedOptions: string;
    wasteBadge: (pct: string) => string;
    allOfflineNote: string;
    cancel: string;
    confirm: string;
    deleteItemAria: (title: string) => string;
  };
  calcTabs: {
    tablistAria: string;
    concrete: string;
    rebar: string;
    masonry: string;
    converter: string;
  };
  concrete: {
    heading: string;
    subtitlePrefix: string;
    dosageWord: string;
    presetsBtn: string;
    presetsSheetTitle: string;
    presetsSheetSub: string;
    presetsSectionTitle: string;
    unifyUnitsTitle: string;
    lengthLabel: string;
    widthLabel: string;
    thicknessLabel: string;
    elementNameQuickLabel: string;
    elementNameFullLabel: string;
    defaultElementName: string;
    dosageLabel: string;
    dosageUnit: string;
    dosages: Record<250 | 300 | 350 | 400, string>;
    presets: {
      slab: { label: string; name: string };
      column: { label: string; name: string };
      beam: { label: string; name: string };
      footing: { label: string; name: string };
    };
    advSubtitle: string;
    wastePercentLabel: string;
    bagPriceLabel: string;
    sandPriceLabel: string;
    gravelPriceLabel: string;
    warnThickness: string;
    warnDosage: string;
    liveLabel: (name: string) => string;
    liveSecondary: (bags: number) => string;
    copyCostLabel: string;
    resultsHeading: string;
    showInM3: string;
    showInLiters: string;
    metrics: {
      netVol: string;
      grossVol: string;
      cementBags: string;
      bagUnit: string;
      sand: string;
      gravel: string;
      waterTrucks: string;
      trucksSub: (count: number) => string;
    };
    boqCategory: string;
    boqSummaryPrefix: string;
    boqMetrics: {
      totalVol: string;
      cement: string;
      sand: string;
      gravel: string;
    };
    cadTitle: string;
    cadAria: string;
    cadMobileTitle: string;
    cadMobileSub: string;
    mixDistTitle: string;
    mixDistLegend: string;
    mixTitles: { gravel: string; sand: string; cement: string; water: string };
    invalidInputsError: string;
  };
  rebar: {
    heading: string;
    subtitlePrefix: string;
    defaultElementName: string;
    modeTotal: string;
    modeBars: string;
    diameterLabel: string;
    diameterAria: string;
    totalLengthLabel: string;
    wasteQuickLabel: string;
    barCountLabel: string;
    barLengthLabel: string;
    advSubtitle: string;
    elementNameLabel: string;
    wasteLapLabel: string;
    tonnePriceLabel: string;
    warnSmallDiameter: string;
    liveLabel: (dia: number) => string;
    liveSecondary: (bars: number) => string;
    copyCostLabel: string;
    resultsHeading: string;
    metrics: {
      unitWeight: string;
      unitWeightUnit: string;
      netWeight: string;
      grossWeight: string;
      commercialBars: string;
      barUnit: string;
    };
    boqCategory: string;
    boqSummary: (len: string, waste: string) => string;
    boqMetrics: {
      gross: string;
      net: string;
      bars: string;
    };
    cadTitle: string;
    cadAria: (dia: number) => string;
    cadMobileTitle: string;
    cadMobileSub: string;
    cutPlanTitle: string;
    barsCountLabel: (count: number) => string;
    fullBarsLabel: string;
    remainderLabel: string;
    noRemainder: string;
    invalidLengthError: string;
  };
  masonry: {
    heading: string;
    subtitle: string;
    defaultWallName: string;
    openingsBtn: string;
    unitTypeLabel: string;
    unitsPerM2Suffix: string;
    lengthLabel: string;
    heightLabel: string;
    openingsLabel: string;
    openingsUnitAria: string;
    wallNameLabel: string;
    advSubtitle: string;
    wasteLabel: string;
    unitPriceLabel: string;
    warnHeight: string;
    liveLabel: (specLabel: string) => string;
    livePrimary: (count: number) => string;
    liveSecondary: (mortar: number) => string;
    copyCostLabel: string;
    resultsHeading: string;
    metrics: {
      netArea: string;
      grossSub: (area: number) => string;
      unitsCount: string;
      unitWord: string;
      netSub: (count: number) => string;
      mortar: string;
      cement: string;
      sand: string;
    };
    boqCategory: string;
    boqSummary: (netArea: number, openingsArea: string) => string;
    boqMetrics: {
      units: string;
      mortar: string;
      cement: string;
      sand: string;
    };
    cadTitle: string;
    cadAria: string;
    cadMobileTitle: string;
    cadMobileSub: string;
    openingsSheetTitle: string;
    openingsSheetSub: string;
    quickDoor: string;
    quickWindow: string;
    resetOpenings: string;
    units: Record<MasonryUnitType, { label: string; dimensions: string }>;
    errorPositiveDims: string;
    errorOpeningsExceed: string;
  };
  converter: {
    heading: string;
    subtitlePrefix: string;
    tablistAria: string;
    valueLabel: string;
    fromUnitLabel: string;
    copyUnitAria: (name: string) => string;
    categories: Record<UnitCategory, string>;
  };
  roads: {
    tablistAria: string;
    tabGradient: string;
    tabEarthworks: string;
    standardBadgePrefix: string;
    gradient: {
      liveLabel: string;
      heading: string;
      subtitlePrefix: string;
      startPk: string;
      startZ: string;
      endPk: string;
      endZ: string;
      cadMobileTitle: string;
      cadMobileSub: string;
      cadTitle: string;
      cadAria: string;
      metrics: {
        slope: string;
        angleRatio: string;
        horizDist: string;
        elevDiff: string;
        slopeDist: string;
      };
      directions: {
        rampe: string;
        pente: string;
        palier: string;
      };
      ratioFlat: string;
      compliance: Record<RoadGradientCompliance, { label: string; rec: string }>;
      errorNumeric: string;
      errorDistance: string;
    };
    earthworks: {
      liveLabel: (len: number) => string;
      liveCut: (vol: number) => string;
      liveFill: (vol: number) => string;
      copyCostLabel: string;
      heading: string;
      subtitlePrefix: string;
      addStationBtn: string;
      defaultProjectTitle: string;
      roadWidthLabel: string;
      advTitle: string;
      advSub: string;
      advBadge: (slope: string, swell: string) => string;
      projectNameLabel: string;
      talusLabel: string;
      swellLabel: string;
      table: {
        station: string;
        ground: string;
        design: string;
        status: string;
        del: string;
        cutTag: string;
        fillTag: string;
        matchTag: string;
        pkAria: (idx: number) => string;
        groundAria: (idx: number) => string;
        designAria: (idx: number) => string;
        delAria: (idx: number) => string;
      };
      metrics: {
        lengthMaxSlope: string;
        maxSlopeSub: (pct: number) => string;
        totalCut: string;
        swelledSub: (vol: number) => string;
        totalFill: string;
        netBalance: string;
        surplusSub: string;
        deficitSub: string;
        trucks: string;
        tripUnit: string;
      };
      sectionsTitle: string;
      sectionsSub: string;
      longProfileTitle: string;
      longProfileAria: string;
      groundLegend: string;
      designLegend: string;
      crossSectionTitle: string;
      crossSectionAria: string;
      fillSectionBtn: string;
      cutSectionBtn: string;
      segmentsTitle: string;
      segmentsSub: string;
      segmentsBadge: (count: number) => string;
      segTable: {
        segment: string;
        length: string;
        slope: string;
        cutVol: string;
        fillVol: string;
        note: string;
        transitionAt: string;
      };
      boqCategory: string;
      boqSummary: (len: number, width: string, maxSlope: number) => string;
      boqSurplus: (vol: number) => string;
      boqDeficit: (vol: number) => string;
      boqMetrics: {
        cut: string;
        fill: string;
        balance: string;
        trucks: string;
      };
      errors: {
        width: string;
        talus: string;
        minStations: string;
        invalidStation: string;
        increasingPk: string;
      };
    };
  };
  quarries: {
    pageTitle: string;
    pageSubtitlePrefix: string;
    pageSubtitleSuffix: string;
    wilayatCountLabel: string;
    sitesCountLabel: string;
    loadingMap: string;
    nearestSelected: string;
    detailsBtn: string;
    wilayaSelectLabel: string;
    wilayaPrefix: string;
    gpsBtnIdle: string;
    gpsBtnLoading: string;
    gpsSuccessToast: string;
    myLocationGps: string;
    myLocationShort: string;
    searchSr: string;
    searchPlaceholder: string;
    filterSectionTitle: string;
    filterAria: string;
    allCategory: string;
    originLabel: string;
    sitesLabel: string;
    noResults: string;
    resetFilter: string;
    sheetTitleFallback: string;
    openGoogleMaps: string;
    openGoogleMapsAria: string;
    copyCoords: string;
    coordsCopied: string;
    copyCoordsAria: string;
    distanceLabel: string;
    etaLabel: string;
    catGeologyLabel: string;
    materialsLabel: string;
    capacityLabel: string;
    gpsCoordsLabel: string;
    mapModes: {
      google: string;
      osm: string;
      svg: string;
      offlineNotice: string;
      googleUnavailable: string;
      googleUnavailableHint: string;
      leafletAria: string;
      legendQuarry: string;
      legendSelected: string;
      legendOrigin: string;
      svgBanner: string;
      svgAria: string;
      mediterranean: string;
      scaleLegend: string;
      clickDetails: string;
      zoomIn: string;
      zoomOut: string;
      resetView: string;
    };
    categories: Record<MaterialCategory, string>;
    gpsErrors: {
      unsupported: string;
      denied: string;
      unavailable: string;
      timeout: string;
      unknown: string;
    };
  };
  reference: {
    heading: string;
    subtitle: string;
    searchSr: string;
    searchPlaceholder: string;
    filterAria: string;
    filters: {
      all: string;
      concrete: string;
      seismic: string;
      roads: string;
    };
    noResults: string;
    showAllBtn: string;
    approvedValueLabel: string;
    aboutHeading: string;
    legalDisclaimer: string;
    items: {
      id: string;
      category: 'concrete' | 'seismic' | 'roads';
      code: string;
      title: string;
      valueText: string;
      noteText: string;
      checklist: string[];
    }[];
  };
  boq: {
    headingMain: string;
    headingParen: string;
    subtitle: string;
    pdfHeaderTitle: string;
    copyReport: string;
    copiedReport: string;
    copiedToast: string;
    shareWhatsApp: string;
    printPdf: string;
    exportCsv: string;
    backupJson: string;
    restoreJson: string;
    clearAll: string;
    invalidBackupToast: string;
    savedCountLabel: string;
    totalBudgetLabel: string;
    emptyTitle: string;
    emptyHintBefore: string;
    emptyHintStrong: string;
    emptyHintAfter: string;
    goToCalcs: string;
    pdfLegalNote: string;
    pdfGeneratedOffline: string;
    confirmTitle: string;
    confirmSub: string;
    confirmCancel: string;
    confirmAction: string;
    confirmBody: (count: number) => string;
    csvHeader: [string, string, string, string, string];
    report: {
      headerLine1: string;
      headerLine2: string;
      dateLabel: string;
      totalBudgetLabel: string;
      itemCostLabel: string;
      footerNote: string;
    };
    savedToast: (title: string) => string;
  };
  errorBoundary: {
    fallbackMsg: string;
    title: string;
    subtitle: string;
    retry: string;
    resetData: string;
  };
}

export const TRANSLATIONS: Record<AppLang, TranslationDict> = {
  ar: {
    brandTitle: 'DZ Civil Pro Ultimate',
    nav: {
      mainAria: 'التنقل الرئيسي',
      mobileAria: 'التنقل السريع للجوال',
      calculators: 'الحاسبات',
      roads: 'الطرقات',
      quarries: 'المحاجر',
      reference: 'المرجع الهندسي',
      referenceShort: 'المرجع',
      boq: 'السجل',
      boqCount: (count) => (count > 0 ? `السجل (${count})` : 'السجل'),
    },
    header: {
      langSwitchAria: 'تبديل لغة التطبيق',
      dayModeTitle: 'تفعيل وضع الورشة النهاري عالي التباين',
      dayModeLabel: 'وضع الورشة النهاري',
      nightModeTitle: 'تفعيل الوضع الليلي للورشة',
      nightModeLabel: 'الوضع الليلي',
      offlineBadgeTitle: 'التطبيق يعمل 100% دون اتصال بالإنترنت في الورشات والميدان',
      offlineShort: 'Offline',
      offlineFull: 'Offline Ready 100%',
      pwaInstallBtn: 'تثبيت التطبيق',
      pwaInstallAria: 'تثبيت التطبيق للعمل دون إنترنت',
      pwaShort: 'تثبيت',
      pwaIosAria: 'تثبيت التطبيق على آيفون',
      pwaIosTitle: 'تثبيت DZ Civil Pro على iOS',
      pwaIosStep1: '1. اضغط على أيقونة المشاركة (Share) في شريط Safari.',
      pwaIosStep2: '2. مرّر للأسفل واختر إضافة إلى الشاشة الرئيسية (Add to Home Screen).',
      pwaIosStep3: '3. يعمل التطبيق بكامل حاسباته دون إنترنت في الورشات المعزولة.',
      pwaIosCloseAria: 'إغلاق نافذة التثبيت',
      pwaIosGotIt: 'فهمت',
    },
    offlineToast: 'وضع عدم الاتصال — الحاسبات وبيانات المحاجر تعمل محلياً',
    footer: {
      studioPrefix: 'تطوير وتصميم:',
      studioSuffix: '— أنظمة الهندسة المدنية الرقمية',
      localBadge: 'جميع الحسابات تعمل محلياً دون اتصال',
    },
    common: {
      saveToBoq: '+ حفظ في المقايسة',
      saveShort: '+ حفظ',
      estimatedCost: 'التكلفة التقديرية',
      copyValueAria: (label) => `نسخ ${label}`,
      closePanel: 'إغلاق اللوحة',
      unitOf: (label) => `وحدة قياس ${label}`,
      advancedOptions: 'خيارات متقدمة',
      wasteBadge: (pct) => `هدر ${pct}%`,
      allOfflineNote: 'تعمل جميع الحاسبات محلياً دون اتصال',
      cancel: 'إلغاء',
      confirm: 'تأكيد المسح',
      deleteItemAria: (title) => `حذف ${title}`,
    },
    calcTabs: {
      tablistAria: 'اختيار الحاسبة الهندسية',
      concrete: 'الخرسانة',
      rebar: 'حديد التسليح',
      masonry: 'البناء والآجر',
      converter: 'محول الوحدات',
    },
    concrete: {
      heading: 'حاسبة الخرسانة والخلطة',
      subtitlePrefix: 'أدخل الأبعاد بأي وحدة (م، سم، ملم، قدم) — عيار',
      dosageWord: 'Dosage',
      presetsBtn: 'قوالب ووحدات سريعة',
      presetsSheetTitle: 'قوالب جاهزة ووحدات موحدة',
      presetsSheetSub: 'اختر عنصراً قياسياً أو وحّد وحدة الإدخال بضغطة واحدة',
      presetsSectionTitle: 'عناصر إنشائية قياسية',
      unifyUnitsTitle: 'توحيد وحدة جميع الأبعاد',
      lengthLabel: 'الطول (L)',
      widthLabel: 'العرض (W)',
      thicknessLabel: 'السمك / الارتفاع (H)',
      elementNameQuickLabel: 'اسم العنصر',
      elementNameFullLabel: 'اسم العنصر الإنشائي',
      defaultElementName: 'بلاطة أرضية خرسانية',
      dosageLabel: 'عيار الإسمنت',
      dosageUnit: 'كغ/م³',
      dosages: {
        250: 'نظافة',
        300: 'دكة أرضية',
        350: 'مسلحة قياسية',
        400: 'أعمدة ومنشآت',
      },
      presets: {
        slab: { label: 'بلاطة أرضية (10×5م)', name: 'بلاطة أرضية خرسانية' },
        column: { label: 'عمود (Poteau 35×35)', name: 'عمود خرساني 35×35 سم' },
        beam: { label: 'كمرة (Poutre 30×45)', name: 'كمرة رئيسية 30×45 سم' },
        footing: { label: 'أساس (Semelle 1.5×1.5)', name: 'أساس منفرد 1.5×1.5 م' },
      },
      advSubtitle: 'تسمية العنصر، نسبة الهدر، وأسعار المواد بالورشة (دج)',
      wastePercentLabel: 'نسبة الهدر (%)',
      bagPriceLabel: 'كيس إسمنت 50 كغ (دج)',
      sandPriceLabel: 'م³ رمل (دج)',
      gravelPriceLabel: 'م³ حصى (دج)',
      warnThickness: 'تنبيه هندسي (CBA 93): سمك الخرسانة أقل من 5 سم غير مطابق للبلاطات المسلحة الحاملة.',
      warnDosage: 'تنبيه (CBA 93): عيار أقل من 250 كغ/م³ يُعتبر خرسانة نظافة فقط وغير معتمد للمنشآت الحاملة.',
      liveLabel: (name) => `النتيجة الفورية · ${name}`,
      liveSecondary: (bags) => `${bags} كيس إسمنت`,
      copyCostLabel: 'نسخ التكلفة بالدينار',
      resultsHeading: 'تفاصيل الكميات ومواد الخلطة',
      showInM3: 'عرض بـ م³',
      showInLiters: 'عرض باللتر',
      metrics: {
        netVol: 'الحجم الصافي',
        grossVol: 'الحجم مع الهدر',
        cementBags: 'أكياس الإسمنت (50 كغ)',
        bagUnit: 'كيس',
        sand: 'رمل البناء (0/3)',
        gravel: 'حصى (8/15 و 15/25)',
        waterTrucks: 'ماء الخلط / خلاطات',
        trucksSub: (c) => `${c} شاحنة (7م³)`,
      },
      boqCategory: 'الخرسانة',
      boqSummaryPrefix: 'هدر',
      boqMetrics: {
        totalVol: 'الحجم الإجمالي',
        cement: 'الإسمنت (50 كغ)',
        sand: 'الرمل (0/3)',
        gravel: 'الحصى (8/15-15/25)',
      },
      cadTitle: 'المخطط الهندسي للعنصر ونسب الخلطة',
      cadAria: 'رسم هندسي ثلاثي الأبعاد للعنصر الخرساني مع الأبعاد',
      cadMobileTitle: 'المخطط الهندسي التفاعلي (3D)',
      cadMobileSub: 'معاينة الأبعاد ونسب توزيع الخلطة',
      mixDistTitle: 'توزيع حجم المكونات التقريبي',
      mixDistLegend: 'رمل · حصى · إسمنت · ماء',
      mixTitles: { gravel: 'حصى مكسر', sand: 'رمل 0/3', cement: 'إسمنت CPJ', water: 'ماء الخلط' },
      invalidInputsError: 'يرجى إدخال أبعاد موجبة صحيحة (الطول، العرض، والسمك).',
    },
    rebar: {
      heading: 'حاسبة حديد التسليح',
      subtitlePrefix: 'إدخال الأطوال بأي وحدة مع حساب الوزن والقضبان التجارية',
      defaultElementName: 'تسليح الأعمدة والكمرات',
      modeTotal: 'الطول الإجمالي',
      modeBars: 'عدد × طول القضيب',
      diameterLabel: 'قطر الحديد',
      diameterAria: 'اختر قطر حديد التسليح',
      totalLengthLabel: 'الطول الإجمالي للقضبان',
      wasteQuickLabel: 'نسبة الهدر والتوصيل (%)',
      barCountLabel: 'عدد القضبان',
      barLengthLabel: 'طول القضيب الواحد',
      advSubtitle: 'تسمية العنصر، نسبة التوصيل والهدر، وسعر الطن (دج)',
      elementNameLabel: 'العنصر الإنشائي',
      wasteLapLabel: 'الهدر والتوصيل (%)',
      tonnePriceLabel: 'سعر الطن المرجعي (دج/طن)',
      warnSmallDiameter: 'تنبيه هندسي (RPA 2024): أقطار T6 و T8 مخصصة للأساور (Cadres/Épingles) ولا تُستخدم كتسليح طولي رئيسي للأعمدة.',
      liveLabel: (d) => `النتيجة الفورية · T${d}`,
      liveSecondary: (b) => `${b} قضيب (12م)`,
      copyCostLabel: 'نسخ تكلفة الحديد',
      resultsHeading: 'تفاصيل الأوزان والتقطيع التجاري',
      metrics: {
        unitWeight: 'الوزن الخطي / المقطع',
        unitWeightUnit: 'كغ/م',
        netWeight: 'الوزن الصافي',
        grossWeight: 'الوزن الإجمالي مع الهدر',
        commercialBars: 'قضبان تجارية (طول 12م)',
        barUnit: 'قضيب',
      },
      boqCategory: 'حديد التسليح',
      boqSummary: (len, w) => `الطول الإجمالي ${len} م · هدر ${w}%`,
      boqMetrics: {
        gross: 'الوزن الإجمالي',
        net: 'الوزن الصافي',
        bars: 'القضبان التجارية (12م)',
      },
      cadTitle: 'المقطع العرضي وقص القضبان (12م)',
      cadAria: (d) => `مقطع عرضي لقضيب حديد بقطر ${d} ملم`,
      cadMobileTitle: 'مقطع التقطيع الهندسي (CAD)',
      cadMobileSub: 'معاينة المقطع العرضي والقضبان التجارية',
      cutPlanTitle: 'مخطط التقطيع التجاري (طول القضيب 12م)',
      barsCountLabel: (c) => `${c} قضيب`,
      fullBarsLabel: 'قضبان كاملة (12 م)',
      remainderLabel: 'الجزء التكميلي من القضيب الأخير',
      noRemainder: 'بدون فائض (0 m)',
      invalidLengthError: 'يرجى إدخال طول إجمالي موجب للحديد بالمتر.',
    },
    masonry: {
      heading: 'حاسبة الآجر والبلوك والمونة',
      subtitle: 'حساب الكميات مع خصم الأبواب والنوافذ وتقدير الرمل والإسمنت',
      defaultWallName: 'جدار فاصل / واجهة',
      openingsBtn: 'خصم فتحات سريعة',
      unitTypeLabel: 'نوع وحدة البناء المعتمدة',
      unitsPerM2Suffix: '/م²',
      lengthLabel: 'طول الجدار',
      heightLabel: 'ارتفاع الجدار',
      openingsLabel: 'مساحة الفتحات',
      openingsUnitAria: 'وحدة مساحة الفتحات',
      wallNameLabel: 'تسمية الجدار',
      advSubtitle: 'نسبة الهدر، وسعر الوحدة (دج)',
      wasteLabel: 'الهدر (%)',
      unitPriceLabel: 'سعر الآجرة / البلوكة (دج)',
      warnHeight: 'تنبيه هندسي (RPA 2024): الارتفاع الحر للجدار يتجاوز 4.5 م، يلزم وضع أحزمة خرسانية رابطة (Chaînages) لمنع الانقلاب.',
      liveLabel: (s) => `النتيجة الفورية · ${s}`,
      livePrimary: (c) => `${c} وحدة`,
      liveSecondary: (m) => `${m} م³ مونة`,
      copyCostLabel: 'نسخ تكلفة الجدار',
      resultsHeading: 'تفاصيل الآجر ومواد المونة',
      metrics: {
        netArea: 'المساحة الصافية',
        grossSub: (a) => `كلية ${a} م²`,
        unitsCount: 'العدد المطلوب (بالهدر)',
        unitWord: 'وحدة',
        netSub: (c) => `صافي ${c}`,
        mortar: 'حجم المونة (Mortier)',
        cement: 'إسمنت المونة (50 كغ)',
        sand: 'رمل المونة المغسول',
      },
      boqCategory: 'البناء والآجر',
      boqSummary: (netArea, openingsArea) => `${netArea} م² صافية · فتحات ${openingsArea} م²`,
      boqMetrics: {
        units: 'عدد الوحدات المطلوبة',
        mortar: 'مونة البناء',
        cement: 'إسمنت المونة',
        sand: 'رمل المونة',
      },
      cadTitle: 'الواجهة الهندسية للجدار والفتحات',
      cadAria: 'رسم هندسي لواجهة الجدار مع الفتحات والأبعاد',
      cadMobileTitle: 'مخطط واجهة الجدار (CAD)',
      cadMobileSub: 'معاينة المساحة الصافية ومناطق الفتحات',
      openingsSheetTitle: 'خصم الفتحات القياسية',
      openingsSheetSub: 'أضف مساحة الأبواب أو النوافذ لخصمها تلقائياً من الجدار',
      quickDoor: '+ باب قياسي',
      quickWindow: '+ نافذة',
      resetOpenings: 'تصفير الفتحات',
      units: {
        brick_8: { label: 'آجر أحمر 8 ثقوب (Brique 8T)', dimensions: '10 × 20 × 30 سم' },
        brick_12: { label: 'آجر أحمر 12 ثقب (Brique 12T)', dimensions: '15 × 20 × 30 سم' },
        brick_16: { label: 'آجر أحمر 16 ثقب (Brique 16T)', dimensions: '20 × 20 × 30 سم' },
        parpaing_15: { label: 'بلوك إسمنتي 15 (Parpaing 15)', dimensions: '15 × 20 × 40 سم' },
        parpaing_20: { label: 'بلوك إسمنتي 20 (Parpaing 20)', dimensions: '20 × 20 × 40 سم' },
      },
      errorPositiveDims: 'يرجى إدخال طول وارتفاع الجدار بقيم موجبة.',
      errorOpeningsExceed: 'مساحة الفتحات (الأبواب والنوافذ) لا يمكن أن تساوي أو تتجاوز مساحة الجدار الكلية.',
    },
    converter: {
      heading: 'محول الوحدات الهندسية الشامل',
      subtitlePrefix: 'تحويل فوري بين المتر والسنتيمتر والمليمتر، الهكتار، القنطار، ومقاومة الخرسانة',
      tablistAria: 'فئة الوحدات الهندسية',
      valueLabel: 'القيمة المراد تحويلها',
      fromUnitLabel: 'من وحدة القياس',
      copyUnitAria: (name) => `نسخ القيمة بوحدة ${name}`,
      categories: {
        length: 'الأطوال والمسافات',
        area: 'المساحات والأراضي',
        volume: 'الأحجام والخرسانة',
        mass: 'الأوزان (كغ / قنطار / طن)',
        stress: 'الضغط والمقاومة',
      },
    },
    roads: {
      tablistAria: 'أدوات تصميم الطرقات',
      tabGradient: 'الميل والانحدار',
      tabEarthworks: 'الحفر والردم',
      standardBadgePrefix: 'معايير الطرقات الوطنية والولائية',
      gradient: {
        liveLabel: 'تحليل الميل الطولي (B40)',
        heading: 'تحليل الميل بين نقطتين',
        subtitlePrefix: 'أدخل نقطتي البداية والنهاية',
        startPk: 'نقطة البداية (PK1)',
        startZ: 'منسوب البداية (Z1)',
        endPk: 'نقطة النهاية (PK2)',
        endZ: 'منسوب النهاية (Z2)',
        cadMobileTitle: 'مثلث الانحدار ومقياس B40',
        cadMobileSub: 'رسم هندسي توضيحي لنسبة الميل والفرق الرأسي',
        cadTitle: 'مثلث الانحدار الهندسي ومقياس B40',
        cadAria: 'مثلث الميول الطولية للطريق بين نقطة البداية والنهاية',
        metrics: {
          slope: 'نسبة الميل الطولي',
          angleRatio: 'زاوية / نسبة الميل',
          horizDist: 'المسافة الأفقية (ΔL)',
          elevDiff: 'فرق المنسوب (ΔZ)',
          slopeDist: 'المسافة المائلة الحقيقية',
        },
        directions: {
          rampe: 'صعود (Rampe)',
          pente: 'نزول (Pente)',
          palier: 'مستوي (Palier)',
        },
        ratioFlat: 'مستوي (1 : ∞)',
        compliance: {
          DRAINAGE_WARNING: {
            label: 'ميل ضعيف (< 0.5%) — خطر ركود المياه',
            rec: 'المعايير الجزائرية (B40) توصي بميل طولي أدنى 0.5% لضمان تصريف مياه الأمطار.',
          },
          OPTIMAL_HIGHWAY: {
            label: 'مثالي — مطابق للطرق السريعة والوطنية (≤ 5%)',
            rec: 'الميل ضمن الحدود المثالية لحركة الشاحنات الثقيلة والسرعات التصميمية العالية.',
          },
          ACCEPTABLE_REGIONAL: {
            label: 'مقبول — طرق ولائية ومناطق متموجة (5% - 7%)',
            rec: 'مناسب للطرق الولائية والبلدية مع مراعاة طول المنحدر ومسافات الرؤية.',
          },
          STEEP_MOUNTAIN: {
            label: 'منحدر حاد — مسالك جبلية (7% - 10%)',
            rec: 'يتطلب خنادق تصريف مبطنة وإشارات تنبيه، ويُفضل إضافة مسلك للشاحنات البطيئة.',
          },
          EXCEEDS_STANDARD: {
            label: 'يتجاوز الحد المعياري (> 10%)',
            rec: 'يتجاوز الميل المسموح به للطرق المصنفة؛ يُنصح بتعديل المسار أو تنفيذ حفر/ردم لتخفيف الانحدار.',
          },
        },
        errorNumeric: 'يرجى إدخال قيم رقمية صحيحة لنقطتي البداية والنهاية.',
        errorDistance: 'يجب أن يكون البعد الأفقي بين نقطة البداية ونقطة النهاية أكبر من الصفر.',
      },
      earthworks: {
        liveLabel: (l) => `الحفر والردم · طول ${l} م`,
        liveCut: (v) => `حفر ${v} م³`,
        liveFill: (v) => `ردم ${v} م³`,
        copyCostLabel: 'نسخ تكلفة الأشغال الترابية',
        heading: 'حسابات الحفر والردم',
        subtitlePrefix: 'أدخل عرض القارعة ومناسيب المحطات لحساب الحجوم الترابية',
        addStationBtn: 'إضافة محطة',
        defaultProjectTitle: 'مقطع طريق ولائي — المحور الرئيسي',
        roadWidthLabel: 'عرض القارعة (Plateforme)',
        advTitle: 'خيارات متقدمة للمحور',
        advSub: 'اسم المشروع، ميل الأكتاف Talus، ومعامل الانتفاش',
        advBadge: (s, sw) => `Talus ${s}:1 · انتفاش ${sw}`,
        projectNameLabel: 'اسم المحور / المشروع',
        talusLabel: 'ميل الأكتاف',
        swellLabel: 'معامل الانتفاش',
        table: {
          station: 'المحطة',
          ground: 'الأرض',
          design: 'المشروع',
          status: 'الحالة الهندسية',
          del: 'حذف',
          cutTag: 'حفر',
          fillTag: 'ردم',
          matchTag: 'تطابق',
          pkAria: (i) => `مسافة المحطة ${i}`,
          groundAria: (i) => `منسوب الأرض الطبيعية للمحطة ${i}`,
          designAria: (i) => `منسوب المشروع للمحطة ${i}`,
          delAria: (i) => `حذف المحطة ${i}`,
        },
        metrics: {
          lengthMaxSlope: 'الطول الخطي / أقصى ميل',
          maxSlopeSub: (p) => `ميل أقصى ${p}%`,
          totalCut: 'إجمالي الحفر (Déblais)',
          swelledSub: (v) => `بعد الانتفاش: ${v} م³`,
          totalFill: 'إجمالي الردم (Remblais)',
          netBalance: 'الميزان الترابي الصافي',
          surplusSub: 'فائض حفر للترحيل',
          deficitSub: 'عجز ردم للاستجلاب',
          trucks: 'نقلات الشاحنات (15 م³)',
          tripUnit: 'رحلة',
        },
        sectionsTitle: 'المقاطع الهندسية (Profil en Long & Profil en Travers)',
        sectionsSub: 'معاينة المقطع الطولي والجانبي للحفر والردم',
        longProfileTitle: 'المقطع الطولي',
        longProfileAria: 'رسم بياني للمقطع الطولي للطريق',
        groundLegend: 'الأرض',
        designLegend: 'المشروع',
        crossSectionTitle: 'المقطع العرضي النموذجي (Profil en Travers)',
        crossSectionAria: 'المقطع العرضي شبه المنحرف لقارعة الطريق والأكتاف الجانبية',
        fillSectionBtn: 'مقطع ردم',
        cutSectionBtn: 'مقطع حفر',
        segmentsTitle: 'تفاصيل كل مقطع (Segment-by-Segment)',
        segmentsSub: 'جدول الحجوم التفصيلية ونقاط الانقلاب بين المحطات',
        segmentsBadge: (c) => `${c} مقاطع`,
        segTable: {
          segment: 'المقطع',
          length: 'الطول',
          slope: 'ميل المشروع',
          cutVol: 'حجم الحفر',
          fillVol: 'حجم الردم',
          note: 'ملاحظة ميدانية',
          transitionAt: 'نقطة انقلاب عند',
        },
        boqCategory: 'تصميم الطرقات',
        boqSummary: (l, w, m) => `طول ${l} م · عرض ${w} م · ميل أقصى ${m}%`,
        boqSurplus: (v) => `فائض حفر +${v} م³`,
        boqDeficit: (v) => `عجز ردم ${v} م³`,
        boqMetrics: {
          cut: 'حجم الحفر (Déblais)',
          fill: 'حجم الردم (Remblais)',
          balance: 'الميزان الترابي',
          trucks: 'رحلات الشاحنات (15 م³)',
        },
        errors: {
          width: 'يجب أن يكون عرض قارعة الطريق (Plateforme) أكبر من الصفر.',
          talus: 'ميل الأكتاف الجانبية (Talus H:V) يجب أن يكون قيمة موجبة أو صفر.',
          minStations: 'يرجى إدخال نقطتين (محطتين) على الأقل لحساب المقاطع الطولية والأحجام.',
          invalidStation: 'تحتوي إحدى المحطات على قيم غير رقمية أو غير صالحة في المسافة أو المناسيب.',
          increasingPk: 'يجب أن تكون مسافات المحطات (PK) متزايدة ومختلفة عن بعضها.',
        },
      },
    },
    quarries: {
      pageTitle: 'خريطة المحاجر ومصانع الإسمنت',
      pageSubtitlePrefix: 'اختر ولايتك أو فعّل',
      pageSubtitleSuffix: 'ثم اضغط على أي محجرة لعرض تفاصيلها الكاملة',
      wilayatCountLabel: 'ولاية',
      sitesCountLabel: 'موقعاً',
      loadingMap: 'جاري تحميل الخريطة...',
      nearestSelected: 'الأقرب / المحدد:',
      detailsBtn: 'تفاصيل المحجرة',
      wilayaSelectLabel: 'الولاية (58 ولاية)',
      wilayaPrefix: 'ولاية',
      gpsBtnIdle: 'تحديد موقعي (GPS)',
      gpsBtnLoading: 'جاري التقاط GPS...',
      gpsSuccessToast: 'تم تحديد موقعك عبر GPS وتحديث مصفوفة المسافات',
      myLocationGps: 'موقعي الحالي (GPS)',
      myLocationShort: 'موقعي',
      searchSr: 'ابحث عن محجرة أو بلدية أو مادة بناء',
      searchPlaceholder: 'ابحث بالاسم، البلدية، أو المادة (8/15، CPJ 42.5)...',
      filterSectionTitle: 'تصفية حسب المادة',
      filterAria: 'تصفية حسب نوع المادة',
      allCategory: 'الكل',
      originLabel: 'المرجع:',
      sitesLabel: 'المواقع:',
      noResults: 'لم يتم العثور على محاجر مطابقة لبحثك',
      resetFilter: 'إعادة ضبط التصفية',
      sheetTitleFallback: 'تفاصيل المحجرة',
      openGoogleMaps: 'فتح المسار في Google Maps',
      openGoogleMapsAria: 'فتح مسار الشاحنة في خرائط Google',
      copyCoords: 'نسخ إحداثيات GPS',
      coordsCopied: 'تم نسخ الإحداثيات',
      copyCoordsAria: 'نسخ إحداثيات المحجرة',
      distanceLabel: 'المسافة الجغرافية',
      etaLabel: 'زمن النقل التقريبي',
      catGeologyLabel: 'التصنيف والجيولوجيا',
      materialsLabel: 'المواد والأصناف المتوفرة',
      capacityLabel: 'الطاقة والوصف',
      gpsCoordsLabel: 'الإحداثيات الجغرافية (GPS)',
      mapModes: {
        google: 'خريطة Google الرسمية',
        osm: 'OpenStreetMap',
        svg: 'خريطة بدون إنترنت (SVG)',
        offlineNotice: 'تم تفعيل الخريطة المتجهية تلقائياً دون إنترنت',
        googleUnavailable: 'خريطة Google غير مفعّلة محلياً في هذه البيئة',
        googleUnavailableHint: 'يمكنك استخدام خريطة OpenStreetMap أو الخريطة المتجهية بدون إنترنت (SVG) من الأزرار أعلاه.',
        leafletAria: 'خريطة المحاجر الجزائرية التفاعلية',
        legendQuarry: 'محجرة / مصنع',
        legendSelected: 'الموقع المحدد',
        legendOrigin: 'موقعي',
        svgBanner: 'خريطة المتجه المحلية (Vector SVG) · تعمل 100% بدون إنترنت',
        svgAria: 'خريطة الجزائر المتجهية المحلية للمحاجر ومصانع الإسمنت',
        mediterranean: 'البحر الأبيض المتوسط (الساحل الجزائري)',
        scaleLegend: 'مقياس تقريبي ~ 200 كم',
        clickDetails: 'اضغط لعرض التفاصيل',
        zoomIn: 'تكبير الخريطة',
        zoomOut: 'تصغير الخريطة',
        resetView: 'إعادة ضبط الرؤية',
      },
      categories: {
        gravier: 'حصى ومواد التكسير',
        sable: 'رمال البناء',
        ciment: 'إسمنت وكلينكر',
        enrochement: 'صخور وركام ثقيل',
      },
      gpsErrors: {
        unsupported: 'المتصفح الحالي لا يدعم خدمة تحديد الموقع الجغرافي (GPS).',
        denied: 'تم رفض إذن الوصول إلى الموقع. يرجى تفعيل صلاحية الموقع من إعدادات المتصفح أو اختيار الولاية يدوياً.',
        unavailable: 'إشارة GPS غير متاحة حالياً في هذا الموقع. يمكنك الاعتماد على مركز الولاية المختارة.',
        timeout: 'انتهت مهلة التقاط إشارة GPS. يرجى إعادة المحاولة في مكان مفتوح.',
        unknown: 'تعذر تحديد الموقع الجغرافي بدقة. جرب تحديد الولاية من القائمة.',
      },
    },
    reference: {
      heading: 'المرجع الهندسي السريع',
      subtitle: 'مواصفات ومعايير الورشات الجزائرية مرتبة في قوائم قابلة للطي لسرعة المراجعة الميدانية',
      searchSr: 'ابحث في المعايير الهندسية',
      searchPlaceholder: 'ابحث عن: تغطية، تراكب، fc28، ميل...',
      filterAria: 'تصنيف المعايير الهندسية',
      filters: {
        all: 'الكل',
        concrete: 'الخرسانة والمواد',
        seismic: 'الزلازل RPA/CBA93',
        roads: 'الطرقات B40',
      },
      noResults: 'لا توجد معايير مطابقة لبحثك',
      showAllBtn: 'عرض جميع المعايير',
      approvedValueLabel: 'القيمة المعتمدة في المرجع:',
      aboutHeading: 'حول التطبيق والهوية التقنية',
      legalDisclaimer:
        'ملاحظة قانونية مهنية: هذا التطبيق أداة مساعدة ميدانية وحسابية سريعة وفق معايير RPA 99 / 2024 و CBA 93 و B40. يجب الاعتماد على المخططات التنفيذية ودراسات الهندسة المدنية الصادرة عن مكتب دراسات معتمد.',
      items: [
        {
          id: 'cover',
          category: 'seismic',
          code: 'CBA 93 / RPA',
          title: 'التغطية الخرسانية الدنيا (Enrobage)',
          valueText: '2.5 – 5.0 cm',
          noteText: '2.5 سم للعناصر الداخلية، 3 سم للواجهات، و5 سم للأساسات الملامسة للتربة مباشرة.',
          checklist: [
            'استخدم كراسي الفصل (Cales à béton) قبل صب العناصر الإنشائية.',
            'تجنب ملامسة قضبان التسليح للتربة مباشرة في الأساسات (5 سم صافية).',
          ],
        },
        {
          id: 'lap',
          category: 'seismic',
          code: 'RPA 99 / 2024',
          title: 'طول التراكب والتوصيل (Recouvrement)',
          valueText: '40Ø – 50Ø',
          noteText: '40 مرة القطر في المناطق العادية و50Ø في المناطق الزلزالية (Zone IIb & III).',
          checklist: [
            'تجنب تجميع كافة وصلات التراكب في مقطع واحد (توزيع تبادلي).',
            'تحقق من ربط نهايات التوصيل بأسلاك الربط المقاومة قبل الصب.',
          ],
        },
        {
          id: 'fc28',
          category: 'concrete',
          code: 'B25 / CPJ 42.5',
          title: 'مقاومة الخرسانة المسلحة (fc28)',
          valueText: '25 MPa (255 kg/cm²)',
          noteText: 'عيار 350 kg/m³ القياسي يحقق مقاومة 25 MPa عند 28 يوماً مع نسبة ماء/إسمنت E/C ≈ 0.50.',
          checklist: [
            'استخدم إسمنت CPJ 42.5 مع ركام نظيف ومغسول خالٍ من الطين.',
            'الالتزام بمعالجة الخرسانة بالماء (Cure) لمدة لا تقل عن 7 أيام.',
          ],
        },
        {
          id: 'b40',
          category: 'roads',
          code: 'B40 الطرقات',
          title: 'حدود الميول الطولية للطرق (B40)',
          valueText: '0.5% – 7.0%',
          noteText: 'أدنى ميل 0.5% لتصريف المياه، مثالي ≤ 5% للطرق الوطنية، وأقصى 10% للمسالك الجبلية الوعرة.',
          checklist: [
            'تأمين ميل عرضي (Dévers) لا يقل عن 2.5% لتصريف مياه الأمطار.',
            'مراعاة منحنيات الربط الرأسية (Raccordement parabolique) عند تغير الميل.',
          ],
        },
        {
          id: 'mix_ratios',
          category: 'concrete',
          code: 'CPJ 42.5 / DOSAGE',
          title: 'معايرة خلطات الخرسانة الميدانية (1 m³)',
          valueText: '350 kg إسمنت · 400 L رمل · 800 L حصى',
          noteText: 'نسب الخلط الحجمية القياسية في الورشات الجزائرية لتحقيق توازن القوام وسهولة التشغيل (Ouvrabilité).',
          checklist: [
            'خرسانة النظافة (Béton de propreté): عيار 150–250 kg/m³ بسمك 5–10 cm.',
            'الأعمدة والجدران المسلحة: عيار 350 إلى 400 kg/m³ مع هزاز ميكانيكي (Vibreur).',
          ],
        },
        {
          id: 'seismic_zones',
          category: 'seismic',
          code: 'RPA 99 / 2024',
          title: 'المقاطع الدنيا للأعمدة في المناطق الزلزالية',
          valueText: '25×25 cm (Zone I) · 30×30 cm (Zone IIa/IIb/III)',
          noteText: 'الأبعاد الدنيا المطلوبة وفق قواعد التصميم المقاوم للزلازل في الجزائر (RPA) لتجنب الانبعاج.',
          checklist: [
            'أدنى تسليح طولي للأعمدة: 0.7% إلى 0.9% من المقطع حسب المنطقة الزلزالية.',
            'تضييق تباعد الأساور (Cadres) في منطقة العقد بمقدار ≤ 10 cm أو h/4.',
          ],
        },
        {
          id: 'earthworks_swell',
          category: 'roads',
          code: 'CTT / B40',
          title: 'معاملات الانتفاش والدمك للأتربة (Foisonnement)',
          valueText: '1.15 – 1.35',
          noteText: 'تُعتمد لتقدير حجم النقل بالشاحنات (15 m³) بعد الحفر مقارنة بالحجم المدموك بالموقع.',
          checklist: [
            'التربة الرملية والحصوية: انتفاش ~ 1.10 – 1.15.',
            'الطين المتماسك والصخور المفككة: انتفاش من 1.25 إلى 1.35.',
          ],
        },
      ],
    },
    boq: {
      headingMain: 'السجل والمقايسة',
      headingParen: '(Métré & Devis)',
      subtitle: 'يُحفظ تلقائياً في ذاكرة الجهاز المحلية مع تصدير فوري للورشة وتقارير PDF و WhatsApp',
      pdfHeaderTitle: 'كشف المقايسة التقديرية',
      copyReport: 'نسخ التقرير',
      copiedReport: 'تم نسخ التقرير',
      copiedToast: 'تم نسخ التقرير إلى الحافظة',
      shareWhatsApp: 'مشاركة عبر WhatsApp',
      printPdf: 'طباعة / حفظ PDF',
      exportCsv: 'تصدير CSV',
      backupJson: 'نسخ احتياطي JSON',
      restoreJson: 'استعادة JSON',
      clearAll: 'مسح الكل',
      invalidBackupToast: 'ملف النسخ الاحتياطي غير صالح',
      savedCountLabel: 'عدد البنود المحفوظة',
      totalBudgetLabel: 'الميزانية التقديرية الإجمالية',
      emptyTitle: 'لا توجد حسابات محفوظة في السجل بعد',
      emptyHintBefore: 'استخدم أي حاسبة واضغط على ',
      emptyHintStrong: '"+ حفظ في المقايسة"',
      emptyHintAfter: ' لحفظ البنود ومتابعتها وتصديرها.',
      goToCalcs: 'الانتقال إلى الحاسبات',
      pdfLegalNote:
        'ملاحظة قانونية مهنية: هذا التطبيق أداة مساعدة ميدانية وحسابية سريعة. يجب الاعتماد على المخططات التنفيذية ودراسات الهندسة المدنية الصادرة عن مكتب دراسات معتمد.',
      pdfGeneratedOffline: 'Generated Offline',
      confirmTitle: 'تأكيد مسح السجل',
      confirmSub: 'سيتم حذف جميع بنود المقايسة المحفوظة محلياً',
      confirmCancel: 'إلغاء',
      confirmAction: 'تأكيد المسح',
      confirmBody: (count) =>
        `هل أنت متأكد من رغبتك في مسح ${count} بند من سجل المقايسة؟ يُنصح بتصدير نسخة CSV أولاً إذا كنت تحتاجها لاحقاً.`,
      csvHeader: ['التصنيف', 'العنصر', 'التفاصيل', 'المؤشرات', 'التكلفة التقديرية (دج)'],
      report: {
        headerLine1: 'DZ Civil Pro Ultimate | Powered by KAD-TECH Engineering Studio',
        headerLine2: 'كشف المقايسة والكميات الميداني (Métré & Devis)',
        dateLabel: 'التاريخ',
        totalBudgetLabel: 'إجمالي الميزانية التقديرية',
        itemCostLabel: 'التكلفة التقديرية',
        footerNote: 'تم إعداد هذا التقرير عبر DZ Civil Pro Ultimate دون اتصال.',
      },
      savedToast: (title) => `تم حفظ "${title}" في السجل والمقايسة`,
    },
    errorBoundary: {
      fallbackMsg: 'حدث خطأ غير متوقع في واجهة التطبيق.',
      title: 'تم احتواء خطأ غير متوقع للحفاظ على استمرارية التطبيق',
      subtitle: 'يمكنك استئناف العمل فوراً أو مسح بيانات التخزين المؤقت إذا كان هناك إدخال تالف.',
      retry: 'إعادة المحاولة',
      resetData: 'إعادة ضبط البيانات',
    },
  },

  fr: {
    brandTitle: 'DZ Civil Pro Ultimate',
    nav: {
      mainAria: 'Navigation principale',
      mobileAria: 'Navigation mobile',
      calculators: 'Calculatrices',
      roads: 'Routes',
      quarries: 'Carrières',
      reference: 'Normes RPA / B40',
      referenceShort: 'Normes',
      boq: 'Métré',
      boqCount: (count) => (count > 0 ? `Métré (${count})` : 'Métré'),
    },
    header: {
      langSwitchAria: 'Changer la langue de l’application',
      dayModeTitle: 'Activer le Mode Jour Chantier haute visibilité',
      dayModeLabel: 'Mode Jour Chantier',
      nightModeTitle: 'Activer le Mode Nuit',
      nightModeLabel: 'Mode Nuit',
      offlineBadgeTitle: 'Application 100 % fonctionnelle hors ligne sur chantier',
      offlineShort: 'Hors ligne',
      offlineFull: 'Offline Ready 100%',
      pwaInstallBtn: 'Installer l’app',
      pwaInstallAria: 'Installer l’application hors ligne',
      pwaShort: 'Installer',
      pwaIosAria: 'Installer sur iPhone / iPad',
      pwaIosTitle: 'Installer DZ Civil Pro sur iOS',
      pwaIosStep1: '1. Appuyez sur le bouton Partager (Share) dans Safari.',
      pwaIosStep2: '2. Sélectionnez « Sur l’écran d’accueil » (Add to Home Screen).',
      pwaIosStep3: '3. Toutes les calculatrices fonctionnent sans connexion sur chantier.',
      pwaIosCloseAria: 'Fermer la fenêtre d’installation',
      pwaIosGotIt: 'Compris',
    },
    offlineToast: 'Mode hors ligne — Calculatrices et carrières actives localement',
    footer: {
      studioPrefix: 'Conception & Développement :',
      studioSuffix: '— Systèmes numériques de génie civil',
      localBadge: 'Tous les calculs fonctionnent 100 % hors ligne',
    },
    common: {
      saveToBoq: '+ Enregistrer au Métré',
      saveShort: '+ Métré',
      estimatedCost: 'Coût estimatif',
      copyValueAria: (label) => `Copier ${label}`,
      closePanel: 'Fermer le panneau',
      unitOf: (label) => `Unité de ${label}`,
      advancedOptions: 'Options avancées',
      wasteBadge: (pct) => `Pertes ${pct}%`,
      allOfflineNote: 'Toutes les calculatrices fonctionnent hors ligne',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      deleteItemAria: (title) => `Supprimer ${title}`,
    },
    calcTabs: {
      tablistAria: 'Sélection de calculatrice technique',
      concrete: 'Béton Armé',
      rebar: 'Ferraillage',
      masonry: 'Maçonnerie',
      converter: 'Convertisseur',
    },
    concrete: {
      heading: 'Calculatrice Béton Armé & Dosage',
      subtitlePrefix: 'Saisissez les dimensions en m, cm, mm ou ft — Dosage',
      dosageWord: 'Dosage CPJ 42.5',
      presetsBtn: 'Gabarits & Unités rapides',
      presetsSheetTitle: 'Éléments types & Unités unifiées',
      presetsSheetSub: 'Choisissez un élément standard ou uniformisez les unités en un clic',
      presetsSectionTitle: 'Éléments structuraux standards',
      unifyUnitsTitle: 'Unifier l’unité des dimensions',
      lengthLabel: 'Longueur (L)',
      widthLabel: 'Largeur (W)',
      thicknessLabel: 'Épaisseur / Hauteur (H)',
      elementNameQuickLabel: 'Désignation de l’ouvrage',
      elementNameFullLabel: 'Désignation détaillée',
      defaultElementName: 'Dalle pleine en béton armé',
      dosageLabel: 'Dosage en ciment',
      dosageUnit: 'kg/m³',
      dosages: {
        250: 'Propreté',
        300: 'Forme / Dallage',
        350: 'Béton armé courant',
        400: 'Poteaux & Voiles',
      },
      presets: {
        slab: { label: 'Dalle pleine (10×5 m)', name: 'Dalle pleine en béton armé' },
        column: { label: 'Poteau (35×35 cm)', name: 'Poteau béton 35×35 cm' },
        beam: { label: 'Poutre (30×45 cm)', name: 'Poutre principale 30×45 cm' },
        footing: { label: 'Semelle (1,5×1,5 m)', name: 'Semelle isolée 1,5×1,5 m' },
      },
      advSubtitle: 'Désignation, coefficient de perte et prix unitaires chantier (DA)',
      wastePercentLabel: 'Pertes / Majoration (%)',
      bagPriceLabel: 'Sac ciment 50 kg (DA)',
      sandPriceLabel: 'Sable m³ (DA)',
      gravelPriceLabel: 'Gravier m³ (DA)',
      warnThickness: 'Alerte CBA 93 : Une épaisseur < 5 cm est non conforme pour une dalle portante en béton armé.',
      warnDosage: 'Alerte CBA 93 : Un dosage < 250 kg/m³ correspond uniquement à un béton de propreté.',
      liveLabel: (name) => `Résultat instantané · ${name}`,
      liveSecondary: (bags) => `${bags} sacs ciment`,
      copyCostLabel: 'Copier le coût en DA',
      resultsHeading: 'Cubature & Approvisionnement chantier',
      showInM3: 'Afficher en m³',
      showInLiters: 'Afficher en L',
      metrics: {
        netVol: 'Volume net',
        grossVol: 'Volume avec pertes',
        cementBags: 'Sacs de ciment (50 kg)',
        bagUnit: 'sacs',
        sand: 'Sable (0/3)',
        gravel: 'Gravier (8/15 & 15/25)',
        waterTrucks: 'Eau de gâchage / Toupies',
        trucksSub: (c) => `${c} toupies (7 m³)`,
      },
      boqCategory: 'Béton Armé',
      boqSummaryPrefix: 'Pertes',
      boqMetrics: {
        totalVol: 'Volume total',
        cement: 'Ciment (50 kg)',
        sand: 'Sable (0/3)',
        gravel: 'Gravier (8/15-15/25)',
      },
      cadTitle: 'Schéma 3D & Proportions de gâchage',
      cadAria: 'Dessin isométrique 3D de l’élément en béton avec cotes',
      cadMobileTitle: 'Schéma géométrique 3D',
      cadMobileSub: 'Aperçu des cotes et composition du mélange',
      mixDistTitle: 'Répartition volumique approximative',
      mixDistLegend: 'Sable · Gravier · Ciment · Eau',
      mixTitles: { gravel: 'Gravier concassé', sand: 'Sable 0/3', cement: 'Ciment CPJ', water: 'Eau' },
      invalidInputsError: 'Veuillez saisir des dimensions strictement positives (L, W, H).',
    },
    rebar: {
      heading: 'Calculatrice Ferraillage (HA FeE400/500)',
      subtitlePrefix: 'Calcul du poids d’acier et du nombre de barres commerciales',
      defaultElementName: 'Ferraillage Poteaux & Poutres',
      modeTotal: 'Longueur totale',
      modeBars: 'Nombre × Longueur',
      diameterLabel: 'Diamètre nominal',
      diameterAria: 'Choisir le diamètre d’acier HA',
      totalLengthLabel: 'Longueur totale développée',
      wasteQuickLabel: 'Chutes & Recouvrement (%)',
      barCountLabel: 'Nombre de barres',
      barLengthLabel: 'Longueur unitaire',
      advSubtitle: 'Désignation, chutes/recouvrement et prix de la tonne (DA)',
      elementNameLabel: 'Élément structural',
      wasteLapLabel: 'Chutes & Recouvrement (%)',
      tonnePriceLabel: 'Prix de référence (DA / t)',
      warnSmallDiameter: 'Note RPA 2024 : Les diamètres T6 et T8 sont réservés aux cadres et épingles, non aux armatures longitudinales des poteaux.',
      liveLabel: (d) => `Résultat instantané · HA ${d}`,
      liveSecondary: (b) => `${b} barres (12 m)`,
      copyCostLabel: 'Copier le coût d’acier',
      resultsHeading: 'Nomenclature & Débit commercial (12 m)',
      metrics: {
        unitWeight: 'Poids linéaire / Section',
        unitWeightUnit: 'kg/m',
        netWeight: 'Poids net',
        grossWeight: 'Poids brut majoré',
        commercialBars: 'Barres commerciales (12 m)',
        barUnit: 'barres',
      },
      boqCategory: 'Ferraillage',
      boqSummary: (len, w) => `Longueur totale ${len} m · Chutes ${w}%`,
      boqMetrics: {
        gross: 'Poids brut',
        net: 'Poids net',
        bars: 'Barres 12 m',
      },
      cadTitle: 'Section transversale & Plan de coupe (12 m)',
      cadAria: (d) => `Section transversale d’une barre HA diamètre ${d} mm`,
      cadMobileTitle: 'Section & Débit des barres (CAD)',
      cadMobileSub: 'Aperçu de la section et calepinage 12 m',
      cutPlanTitle: 'Calepinage commercial (Longueur standard 12 m)',
      barsCountLabel: (c) => `${c} barres`,
      fullBarsLabel: 'Barres entières (12 m)',
      remainderLabel: 'Appoint sur la dernière barre',
      noRemainder: 'Sans chute (0 m)',
      invalidLengthError: 'Veuillez saisir une longueur totale positive en mètres.',
    },
    masonry: {
      heading: 'Calculatrice Maçonnerie & Mortier',
      subtitle: 'Déduction des baies (portes/fenêtres), briques, parpaings et mortier de pose',
      defaultWallName: 'Mur de remplissage / Cloison',
      openingsBtn: 'Déduire ouvertures',
      unitTypeLabel: 'Type de bloc / brique',
      unitsPerM2Suffix: '/m²',
      lengthLabel: 'Longueur du mur',
      heightLabel: 'Hauteur du mur',
      openingsLabel: 'Surface des ouvertures',
      openingsUnitAria: 'Unité de surface des ouvertures',
      wallNameLabel: 'Repère du mur',
      advSubtitle: 'Pertes et prix unitaire du bloc (DA)',
      wasteLabel: 'Pertes / Casse (%)',
      unitPriceLabel: 'Prix unitaire brique / bloc (DA)',
      warnHeight: 'Alerte RPA 2024 : Hauteur libre > 4,5 m — prévoir des chaînages intermédiaires anti-renversement.',
      liveLabel: (s) => `Résultat instantané · ${s}`,
      livePrimary: (c) => `${c} unités`,
      liveSecondary: (m) => `${m} m³ mortier`,
      copyCostLabel: 'Copier le coût maçonnerie',
      resultsHeading: 'Quantités de maçonnerie & mortier',
      metrics: {
        netArea: 'Surface nette',
        grossSub: (a) => `brute ${a} m²`,
        unitsCount: 'Nombre total (avec casse)',
        unitWord: 'u',
        netSub: (c) => `net ${c}`,
        mortar: 'Volume de mortier',
        cement: 'Ciment mortier (50 kg)',
        sand: 'Sable lavé pour mortier',
      },
      boqCategory: 'Maçonnerie',
      boqSummary: (netArea, openingsArea) => `${netArea} m² nets · Ouvertures ${openingsArea} m²`,
      boqMetrics: {
        units: 'Unités requises',
        mortar: 'Mortier de pose',
        cement: 'Ciment mortier',
        sand: 'Sable mortier',
      },
      cadTitle: 'Élévation géométrique du mur & Baies',
      cadAria: 'Plan d’élévation du mur avec ouvertures déduites',
      cadMobileTitle: 'Schéma d’élévation du mur (CAD)',
      cadMobileSub: 'Aperçu de la surface nette et des ouvertures',
      openingsSheetTitle: 'Déduction rapide des ouvertures',
      openingsSheetSub: 'Ajoutez des portes ou fenêtres standards à déduire automatiquement',
      quickDoor: '+ Porte standard',
      quickWindow: '+ Fenêtre',
      resetOpenings: 'Réinitialiser les ouvertures',
      units: {
        brick_8: { label: 'Brique rouge 8 trous (8T)', dimensions: '10 × 20 × 30 cm' },
        brick_12: { label: 'Brique rouge 12 trous (12T)', dimensions: '15 × 20 × 30 cm' },
        brick_16: { label: 'Brique rouge 16 trous (16T)', dimensions: '20 × 20 × 30 cm' },
        parpaing_15: { label: 'Parpaing creux 15 cm', dimensions: '15 × 20 × 40 cm' },
        parpaing_20: { label: 'Parpaing creux 20 cm', dimensions: '20 × 20 × 40 cm' },
      },
      errorPositiveDims: 'Veuillez saisir une longueur et une hauteur de mur positives.',
      errorOpeningsExceed: 'La surface des ouvertures ne peut pas égaler ou dépasser la surface brute du mur.',
    },
    converter: {
      heading: 'Convertisseur d’Unités de Génie Civil',
      subtitlePrefix: 'Conversion instantanée : longueurs, surfaces, volumes, masses et contrainte',
      tablistAria: 'Catégorie d’unités techniques',
      valueLabel: 'Valeur à convertir',
      fromUnitLabel: 'Unité source',
      copyUnitAria: (name) => `Copier la valeur en ${name}`,
      categories: {
        length: 'Longueurs & Distances',
        area: 'Surfaces & Terrains',
        volume: 'Volumes & Béton',
        mass: 'Masses (kg / q / t)',
        stress: 'Contraintes & Résistances',
      },
    },
    roads: {
      tablistAria: 'Outils de conception routière',
      tabGradient: 'Pente & Rampe',
      tabEarthworks: 'Terrassement Déblais / Remblais',
      standardBadgePrefix: 'Normes routières algériennes',
      gradient: {
        liveLabel: 'Analyse de pente longitudinale (B40)',
        heading: 'Calcul de pente entre deux points',
        subtitlePrefix: 'Saisissez les points origine et extrémité',
        startPk: 'Point initial (PK1)',
        startZ: 'Cote initiale (Z1)',
        endPk: 'Point final (PK2)',
        endZ: 'Cote finale (Z2)',
        cadMobileTitle: 'Triangle de pente & Jauge B40',
        cadMobileSub: 'Schéma géométrique de déclivité et dénivelée',
        cadTitle: 'Triangle de pente & Norme B40',
        cadAria: 'Triangle géométrique de la déclivité longitudinale',
        metrics: {
          slope: 'Déclivité longitudinale',
          angleRatio: 'Angle / Rapport',
          horizDist: 'Distance horizontale (ΔL)',
          elevDiff: 'Dénivelée (ΔZ)',
          slopeDist: 'Distance suivant la pente',
        },
        directions: {
          rampe: 'Rampe (Montée)',
          pente: 'Pente (Descente)',
          palier: 'Palier (Horizontal)',
        },
        ratioFlat: 'Palier (1 : ∞)',
        compliance: {
          DRAINAGE_WARNING: {
            label: 'Pente faible (< 0,5 %) — Risque de stagnation des eaux',
            rec: 'Les normes algériennes (B40) recommandent une pente minimale de 0,5 % pour le drainage.',
          },
          OPTIMAL_HIGHWAY: {
            label: 'Optimal — Conforme autoroutes & routes nationales (≤ 5 %)',
            rec: 'Déclivité idéale pour la circulation poids lourds et vitesses de référence élevées.',
          },
          ACCEPTABLE_REGIONAL: {
            label: 'Acceptable — Chemins de wilaya & relief vallonné (5 % – 7 %)',
            rec: 'Adapté aux axes régionaux sous réserve de vérifier les distances de visibilité.',
          },
          STEEP_MOUNTAIN: {
            label: 'Forte pente — Tracés montagneux (7 % – 10 %)',
            rec: 'Prévoir fossés bétonnés, signalisation et voie véhicules lents si nécessaire.',
          },
          EXCEEDS_STANDARD: {
            label: 'Hors norme (> 10 %)',
            rec: 'Dépasse la limite réglementaire ; envisager un réajustement du profil en long.',
          },
        },
        errorNumeric: 'Veuillez saisir des coordonnées numériques valides pour les deux points.',
        errorDistance: 'La distance horizontale entre PK1 et PK2 doit être strictement positive.',
      },
      earthworks: {
        liveLabel: (l) => `Terrassement · Linéaire ${l} m`,
        liveCut: (v) => `Déblais ${v} m³`,
        liveFill: (v) => `Remblais ${v} m³`,
        copyCostLabel: 'Copier le coût terrassement',
        heading: 'Cubature Déblais / Remblais (Profil en Long)',
        subtitlePrefix: 'Saisissez la plateforme et les cotes TN / Projet pour calculer les volumes',
        addStationBtn: 'Ajouter un profil',
        defaultProjectTitle: 'Axe routier principal — Lot Terrassement',
        roadWidthLabel: 'Largeur plateforme',
        advTitle: 'Paramètres géométriques de l’axe',
        advSub: 'Nom du projet, pente des talus H:V et foisonnement',
        advBadge: (s, sw) => `Talus ${s}:1 · Foisonnement ${sw}`,
        projectNameLabel: 'Intitulé du projet',
        talusLabel: 'Pente des talus',
        swellLabel: 'Coef. de foisonnement',
        table: {
          station: 'Profil',
          ground: 'Cote TN',
          design: 'Cote Projet',
          status: 'État technique',
          del: 'Suppr.',
          cutTag: 'Déblai',
          fillTag: 'Remblai',
          matchTag: 'RAS',
          pkAria: (i) => `Abscisse PK du profil ${i}`,
          groundAria: (i) => `Cote terrain naturel profil ${i}`,
          designAria: (i) => `Cote projet profil ${i}`,
          delAria: (i) => `Supprimer le profil ${i}`,
        },
        metrics: {
          lengthMaxSlope: 'Longueur / Pente max',
          maxSlopeSub: (p) => `Pente max ${p}%`,
          totalCut: 'Total Déblais',
          swelledSub: (v) => `Foisonné : ${v} m³`,
          totalFill: 'Total Remblais',
          netBalance: 'Bilan mouvement des terres',
          surplusSub: 'Excédent déblai (évacuation)',
          deficitSub: 'Déficit remblai (emprunt)',
          trucks: 'Rotations camions (15 m³)',
          tripUnit: 'voyages',
        },
        sectionsTitle: 'Profil en Long & Profil en Travers type',
        sectionsSub: 'Visualisation interactive du tracé et du talus',
        longProfileTitle: 'Profil en Long',
        longProfileAria: 'Graphique du profil en long terrain naturel et ligne rouge projet',
        groundLegend: 'TN',
        designLegend: 'Projet',
        crossSectionTitle: 'Profil en Travers type',
        crossSectionAria: 'Coupe transversale trapézoïdale en déblai ou en remblai',
        fillSectionBtn: 'Profil Remblai',
        cutSectionBtn: 'Profil Déblai',
        segmentsTitle: 'Détail par entre-profil (Segment-by-Segment)',
        segmentsSub: 'Volumes élémentaires et points de passage Déblai/Remblai',
        segmentsBadge: (c) => `${c} tronçons`,
        segTable: {
          segment: 'Tronçon',
          length: 'Longueur',
          slope: 'Pente Projet',
          cutVol: 'Déblais',
          fillVol: 'Remblais',
          note: 'Observation',
          transitionAt: 'Point fictif à',
        },
        boqCategory: 'Terrassement',
        boqSummary: (l, w, m) => `Linéaire ${l} m · Plateforme ${w} m · Pente max ${m}%`,
        boqSurplus: (v) => `Excédent déblai +${v} m³`,
        boqDeficit: (v) => `Déficit remblai ${v} m³`,
        boqMetrics: {
          cut: 'Volume Déblais',
          fill: 'Volume Remblais',
          balance: 'Bilan des terres',
          trucks: 'Camions (15 m³)',
        },
        errors: {
          width: 'La largeur de la plateforme doit être supérieure à zéro.',
          talus: 'La pente des talus (H:V) doit être positive ou nulle.',
          minStations: 'Veuillez saisir au moins 2 profils pour calculer les cubatures.',
          invalidStation: 'Un profil contient des valeurs numériques invalides.',
          increasingPk: 'Les abscisses (PK) doivent être strictement croissantes.',
        },
      },
    },
    quarries: {
      pageTitle: 'Carrières & Cimenteries d’Algérie',
      pageSubtitlePrefix: 'Choisissez votre wilaya ou activez le',
      pageSubtitleSuffix: 'puis cliquez sur un site pour afficher sa fiche technique',
      wilayatCountLabel: 'Wilayas',
      sitesCountLabel: 'sites',
      loadingMap: 'Chargement de la carte...',
      nearestSelected: 'Sélection / Plus proche :',
      detailsBtn: 'Fiche technique',
      wilayaSelectLabel: 'Wilaya (58 Wilayas)',
      wilayaPrefix: 'Wilaya',
      gpsBtnIdle: 'Me localiser (GPS)',
      gpsBtnLoading: 'Acquisition GPS...',
      gpsSuccessToast: 'Position GPS capturée et distances recalculées',
      myLocationGps: 'Ma position (GPS)',
      myLocationShort: 'Ma position',
      searchSr: 'Rechercher une carrière, commune ou granulat',
      searchPlaceholder: 'Rechercher par nom, commune ou matériau (8/15, CPJ 42.5)...',
      filterSectionTitle: 'Filtrer par matériau',
      filterAria: 'Filtrer par catégorie de matériau',
      allCategory: 'Tous',
      originLabel: 'Origine :',
      sitesLabel: 'Sites :',
      noResults: 'Aucune carrière correspondante trouvée',
      resetFilter: 'Réinitialiser le filtre',
      sheetTitleFallback: 'Détails du site',
      openGoogleMaps: 'Itinéraire sur Google Maps',
      openGoogleMapsAria: 'Ouvrir l’itinéraire poids lourd sur Google Maps',
      copyCoords: 'Copier coordonnées GPS',
      coordsCopied: 'Coordonnées copiées',
      copyCoordsAria: 'Copier les coordonnées GPS du site',
      distanceLabel: 'Distance à vol d’oiseau',
      etaLabel: 'Temps de transport estimé',
      catGeologyLabel: 'Catégorie & Géologie',
      materialsLabel: 'Matériaux & Granulats disponibles',
      capacityLabel: 'Capacité & Note technique',
      gpsCoordsLabel: 'Coordonnées GPS',
      mapModes: {
        google: 'Google Maps Officiel',
        osm: 'OpenStreetMap',
        svg: 'Carte Hors Ligne (SVG)',
        offlineNotice: 'Carte vectorielle hors ligne activée automatiquement',
        googleUnavailable: 'Google Maps indisponible localement dans cet environnement',
        googleUnavailableHint: 'Utilisez OpenStreetMap ou la carte vectorielle hors ligne (SVG) ci-dessus.',
        leafletAria: 'Carte interactive des carrières d’Algérie',
        legendQuarry: 'Carrière / Cimenterie',
        legendSelected: 'Site sélectionné',
        legendOrigin: 'Ma position',
        svgBanner: 'Carte vectorielle locale (Vector SVG) · 100 % Hors Ligne',
        svgAria: 'Carte vectorielle locale des carrières et cimenteries d’Algérie',
        mediterranean: 'Mer Méditerranée (Littoral Algérien)',
        scaleLegend: 'Échelle approx. ~ 200 km',
        clickDetails: 'Cliquer pour les détails',
        zoomIn: 'Zoomer',
        zoomOut: 'Dézoomer',
        resetView: 'Réinitialiser la vue',
      },
      categories: {
        gravier: 'Granulats & Concassage',
        sable: 'Sables de construction',
        ciment: 'Cimenteries & Clinker',
        enrochement: 'Enrochement & Ballast',
      },
      gpsErrors: {
        unsupported: 'La géolocalisation GPS n’est pas prise en charge par ce navigateur.',
        denied: 'Accès GPS refusé. Autorisez la localisation ou sélectionnez votre wilaya manuellement.',
        unavailable: 'Signal GPS indisponible ici. Sélectionnez une wilaya de référence.',
        timeout: 'Délai d’acquisition GPS dépassé. Réessayez en zone dégagée.',
        unknown: 'Impossible d’obtenir votre position. Utilisez le sélecteur de wilaya.',
      },
    },
    reference: {
      heading: 'Normes RPA 2024 / CBA 93 / B40',
      subtitle: 'Référentiel technique algérien classé pour consultation rapide sur chantier',
      searchSr: 'Rechercher dans les normes techniques',
      searchPlaceholder: 'Rechercher : enrobage, recouvrement, fc28, pente...',
      filterAria: 'Filtrer les normes par domaine',
      filters: {
        all: 'Tout',
        concrete: 'Béton & Matériaux',
        seismic: 'Parasismique RPA / CBA93',
        roads: 'Routes B40',
      },
      noResults: 'Aucune norme ne correspond à votre recherche',
      showAllBtn: 'Afficher toutes les normes',
      approvedValueLabel: 'Valeur réglementaire de référence :',
      aboutHeading: 'À propos & Identité Technique',
      legalDisclaimer:
        'Avertissement professionnel : Cet outil fournit une assistance rapide sur chantier selon les normes RPA 99 / 2024, CBA 93 et B40. Seuls les plans d’exécution visés par un bureau d’études agréé font foi.',
      items: [
        {
          id: 'cover',
          category: 'seismic',
          code: 'CBA 93 / RPA',
          title: 'Enrobage minimal des armatures',
          valueText: '2,5 – 5,0 cm',
          noteText: '2,5 cm pour les éléments intérieurs, 3 cm en façade exposée et 5 cm pour les fondations au contact du sol.',
          checklist: [
            'Poser des cales à béton normalisées avant le coulage des éléments.',
            'Respecter strictement 5 cm d’enrobage net en fond de fouille.',
          ],
        },
        {
          id: 'lap',
          category: 'seismic',
          code: 'RPA 99 / 2024',
          title: 'Longueur de recouvrement des barres',
          valueText: '40Ø – 50Ø',
          noteText: '40 fois le diamètre en zone courante et 50Ø en zones sismiques élevées (Zones IIb & III).',
          checklist: [
            'Éviter de concentrer tous les recouvrements dans une même section (pose alternée).',
            'Vérifier la ligature des extrémités avec du fil recuit avant coulage.',
          ],
        },
        {
          id: 'fc28',
          category: 'concrete',
          code: 'B25 / CPJ 42.5',
          title: 'Résistance caractéristique du béton (fc28)',
          valueText: '25 MPa (255 kg/cm²)',
          noteText: 'Un dosage courant à 350 kg/m³ vise 25 MPa à 28 jours avec un rapport E/C ≈ 0,50.',
          checklist: [
            'Utiliser un ciment CPJ 42.5 et des granulats propres lavés exempts d’argile.',
            'Assurer la cure du béton pendant au moins 7 jours après coulage.',
          ],
        },
        {
          id: 'b40',
          category: 'roads',
          code: 'Norme B40',
          title: 'Limites de déclivité longitudinale (B40)',
          valueText: '0,5 % – 7,0 %',
          noteText: 'Minimum 0,5 % pour le ruissellement, optimal ≤ 5 % sur routes nationales, max 10 % en montagne.',
          checklist: [
            'Garantir un dévers transversal d’au moins 2,5 % pour évacuer les eaux pluviales.',
            'Soigner les raccordements paraboliques verticaux aux changements de pente.',
          ],
        },
        {
          id: 'mix_ratios',
          category: 'concrete',
          code: 'CPJ 42.5 / DOSAGE',
          title: 'Formulation pratique de béton chantier (1 m³)',
          valueText: '350 kg ciment · 400 L sable · 800 L gravier',
          noteText: 'Dosage volumétrique usuel sur chantiers algériens assurant une bonne ouvrabilité.',
          checklist: [
            'Béton de propreté : dosage 150–250 kg/m³ sur 5 à 10 cm d’épaisseur.',
            'Poteaux et voiles : dosage 350 à 400 kg/m³ avec pervibration mécanique.',
          ],
        },
        {
          id: 'seismic_zones',
          category: 'seismic',
          code: 'RPA 99 / 2024',
          title: 'Sections minimales des poteaux parasismiques',
          valueText: '25×25 cm (Zone I) · 30×30 cm (Zone IIa/IIb/III)',
          noteText: 'Dimensions minimales exigées par le RPA algérien pour prévenir le flambement.',
          checklist: [
            'Pourcentage minimal d’armatures longitudinales : 0,7 % à 0,9 % selon la zone.',
            'Resserrer les cadres en zone nodale avec espacement ≤ 10 cm ou h/4.',
          ],
        },
        {
          id: 'earthworks_swell',
          category: 'roads',
          code: 'CTT / B40',
          title: 'Coefficients de foisonnement des terres',
          valueText: '1,15 – 1,35',
          noteText: 'Utilisé pour estimer le volume réel à transporter en camions (15 m³) après excavation.',
          checklist: [
            'Sols sableux et graveleux : foisonnement ~ 1,10 – 1,15.',
            'Argiles compactes et roches dérochées : foisonnement de 1,25 à 1,35.',
          ],
        },
      ],
    },
    boq: {
      headingMain: 'Historique & Devis',
      headingParen: '(Métré & Devis)',
      subtitle: 'Sauvegarde locale automatique sur l’appareil avec export PDF, CSV, JSON et partage WhatsApp',
      pdfHeaderTitle: 'Devis Estimatif de Chantier',
      copyReport: 'Copier le rapport',
      copiedReport: 'Rapport copié',
      copiedToast: 'Rapport copié dans le presse-papiers',
      shareWhatsApp: 'Partager via WhatsApp',
      printPdf: 'Imprimer / Enregistrer PDF',
      exportCsv: 'Exporter CSV',
      backupJson: 'Sauvegarde JSON',
      restoreJson: 'Restaurer JSON',
      clearAll: 'Tout effacer',
      invalidBackupToast: 'Fichier de sauvegarde JSON invalide',
      savedCountLabel: 'Postes enregistrés',
      totalBudgetLabel: 'Budget estimatif global',
      emptyTitle: 'Aucun poste enregistré dans le métré',
      emptyHintBefore: 'Utilisez une calculatrice puis cliquez sur ',
      emptyHintStrong: '« + Enregistrer au Métré »',
      emptyHintAfter: ' pour constituer votre devis.',
      goToCalcs: 'Aller aux calculatrices',
      pdfLegalNote:
        'Mention technique : Outil d’estimation rapide sur chantier. Seuls les plans d’exécution visés par un bureau d’études agréé sont contractuels.',
      pdfGeneratedOffline: 'Généré hors ligne',
      confirmTitle: 'Confirmer la suppression',
      confirmSub: 'Tous les postes enregistrés localement seront effacés',
      confirmCancel: 'Annuler',
      confirmAction: 'Tout supprimer',
      confirmBody: (count) =>
        `Voulez-vous vraiment supprimer ${count} poste(s) du métré ? Il est conseillé d’exporter un CSV au préalable.`,
      csvHeader: ['Catégorie', 'Ouvrage', 'Détails', 'Indicateurs', 'Coût estimatif (DA)'],
      report: {
        headerLine1: 'DZ Civil Pro Ultimate | Powered by KAD-TECH Engineering Studio',
        headerLine2: 'Métré & Devis Estimatif de Chantier',
        dateLabel: 'Date',
        totalBudgetLabel: 'Budget estimatif total',
        itemCostLabel: 'Coût estimatif',
        footerNote: 'Rapport généré hors ligne via DZ Civil Pro Ultimate.',
      },
      savedToast: (title) => `« ${title} » ajouté au Métré & Devis`,
    },
    errorBoundary: {
      fallbackMsg: 'Une erreur inattendue est survenue dans l’interface.',
      title: 'Une erreur a été interceptée pour préserver vos données',
      subtitle: 'Vous pouvez relancer l’écran immédiatement ou réinitialiser le stockage local.',
      retry: 'Réessayer',
      resetData: 'Réinitialiser les données',
    },
  },

  en: {
    brandTitle: 'DZ Civil Pro Ultimate',
    nav: {
      mainAria: 'Main navigation',
      mobileAria: 'Mobile navigation',
      calculators: 'Calculators',
      roads: 'Roads',
      quarries: 'Quarries',
      reference: 'Standards',
      referenceShort: 'Standards',
      boq: 'BOQ',
      boqCount: (count) => (count > 0 ? `BOQ (${count})` : 'BOQ'),
    },
    header: {
      langSwitchAria: 'Switch application language',
      dayModeTitle: 'Enable high-contrast Daylight Site Mode',
      dayModeLabel: 'Daylight Site Mode',
      nightModeTitle: 'Enable Night Site Mode',
      nightModeLabel: 'Night Mode',
      offlineBadgeTitle: '100% offline-capable for remote field and jobsite work',
      offlineShort: 'Offline',
      offlineFull: 'Offline Ready 100%',
      pwaInstallBtn: 'Install App',
      pwaInstallAria: 'Install app for offline use',
      pwaShort: 'Install',
      pwaIosAria: 'Install on iPhone / iPad',
      pwaIosTitle: 'Install DZ Civil Pro on iOS',
      pwaIosStep1: '1. Tap the Share button in Safari.',
      pwaIosStep2: '2. Scroll down and select "Add to Home Screen".',
      pwaIosStep3: '3. All calculators and quarry data work 100% offline.',
      pwaIosCloseAria: 'Close install dialog',
      pwaIosGotIt: 'Got it',
    },
    offlineToast: 'Offline Mode — Calculators & quarry directory running locally',
    footer: {
      studioPrefix: 'Designed & Developed by:',
      studioSuffix: '— Digital Civil Engineering Systems',
      localBadge: 'All calculations run 100% offline',
    },
    common: {
      saveToBoq: '+ Save to BOQ',
      saveShort: '+ Save',
      estimatedCost: 'Estimated Cost',
      copyValueAria: (label) => `Copy ${label}`,
      closePanel: 'Close panel',
      unitOf: (label) => `Unit for ${label}`,
      advancedOptions: 'Advanced Options',
      wasteBadge: (pct) => `Waste ${pct}%`,
      allOfflineNote: 'All calculators run locally offline',
      cancel: 'Cancel',
      confirm: 'Confirm Clear',
      deleteItemAria: (title) => `Delete ${title}`,
    },
    calcTabs: {
      tablistAria: 'Select engineering calculator',
      concrete: 'Reinforced Concrete',
      rebar: 'Rebar Steel',
      masonry: 'Masonry',
      converter: 'Unit Converter',
    },
    concrete: {
      heading: 'Reinforced Concrete & Mix Calculator',
      subtitlePrefix: 'Enter dimensions in any unit (m, cm, mm, ft) — Grade',
      dosageWord: 'CPJ 42.5 Mix',
      presetsBtn: 'Presets & Quick Units',
      presetsSheetTitle: 'Structural Presets & Unified Units',
      presetsSheetSub: 'Pick a standard element or unify all dimension units in one tap',
      presetsSectionTitle: 'Standard Structural Elements',
      unifyUnitsTitle: 'Set Same Unit for All Dimensions',
      lengthLabel: 'Length (L)',
      widthLabel: 'Width (W)',
      thicknessLabel: 'Thickness / Height (H)',
      elementNameQuickLabel: 'Element Name',
      elementNameFullLabel: 'Structural Element Name',
      defaultElementName: 'Reinforced Concrete Slab',
      dosageLabel: 'Cement Dosage',
      dosageUnit: 'kg/m³',
      dosages: {
        250: 'Blinding concrete',
        300: 'Slab on grade',
        350: 'Standard structural',
        400: 'Columns & frames',
      },
      presets: {
        slab: { label: 'Floor Slab (10×5 m)', name: 'Reinforced Concrete Slab' },
        column: { label: 'Column (35×35 cm)', name: 'RC Column 35×35 cm' },
        beam: { label: 'Main Beam (30×45 cm)', name: 'Main Beam 30×45 cm' },
        footing: { label: 'Pad Footing (1.5×1.5 m)', name: 'Isolated Footing 1.5×1.5 m' },
      },
      advSubtitle: 'Element label, waste factor & site material prices (DZD)',
      wastePercentLabel: 'Waste Factor (%)',
      bagPriceLabel: 'Cement Bag 50 kg (DZD)',
      sandPriceLabel: 'Sand m³ (DZD)',
      gravelPriceLabel: 'Gravel m³ (DZD)',
      warnThickness: 'CBA 93 Notice: Thickness below 5 cm is non-compliant for structural slabs.',
      warnDosage: 'CBA 93 Notice: Dosage below 250 kg/m³ is suitable for blinding concrete only.',
      liveLabel: (name) => `Live Result · ${name}`,
      liveSecondary: (bags) => `${bags} cement bags`,
      copyCostLabel: 'Copy cost in DZD',
      resultsHeading: 'Mix Volumes & Material Quantities',
      showInM3: 'Show in m³',
      showInLiters: 'Show in L',
      metrics: {
        netVol: 'Net Volume',
        grossVol: 'Gross Volume (+Waste)',
        cementBags: 'Cement Bags (50 kg)',
        bagUnit: 'bags',
        sand: 'Concrete Sand (0/3)',
        gravel: 'Aggregate (8/15 & 15/25)',
        waterTrucks: 'Mixing Water / Trucks',
        trucksSub: (c) => `${c} mixer trucks (7 m³)`,
      },
      boqCategory: 'Concrete',
      boqSummaryPrefix: 'Waste',
      boqMetrics: {
        totalVol: 'Gross Volume',
        cement: 'Cement (50 kg)',
        sand: 'Sand (0/3)',
        gravel: 'Gravel (8/15-15/25)',
      },
      cadTitle: '3D Structural Schematic & Mix Proportions',
      cadAria: '3D isometric concrete element diagram with dimensions',
      cadMobileTitle: 'Interactive 3D Schematic',
      cadMobileSub: 'Preview element dimensions & mix ratios',
      mixDistTitle: 'Approximate Volumetric Mix Split',
      mixDistLegend: 'Sand · Gravel · Cement · Water',
      mixTitles: { gravel: 'Crushed Gravel', sand: 'Sand 0/3', cement: 'CPJ Cement', water: 'Water' },
      invalidInputsError: 'Please enter positive dimensions (Length, Width, and Thickness).',
    },
    rebar: {
      heading: 'Rebar Steel Calculator (HA FeE400/500)',
      subtitlePrefix: 'Calculate steel weight & commercial 12m bars from any unit',
      defaultElementName: 'Columns & Beams Reinforcement',
      modeTotal: 'Total Length',
      modeBars: 'Count × Bar Length',
      diameterLabel: 'Bar Diameter',
      diameterAria: 'Select rebar diameter',
      totalLengthLabel: 'Total Rebar Length',
      wasteQuickLabel: 'Waste & Lap Splice (%)',
      barCountLabel: 'Number of Bars',
      barLengthLabel: 'Single Bar Length',
      advSubtitle: 'Element label, lap/waste factor & steel price per ton (DZD)',
      elementNameLabel: 'Structural Element',
      wasteLapLabel: 'Waste & Splice (%)',
      tonnePriceLabel: 'Reference Price (DZD / ton)',
      warnSmallDiameter: 'RPA 2024 Notice: T6 & T8 bars are intended for stirrups/ties, not main longitudinal column bars.',
      liveLabel: (d) => `Live Result · T${d}`,
      liveSecondary: (b) => `${b} bars (12 m)`,
      copyCostLabel: 'Copy steel cost',
      resultsHeading: 'Steel Weight & 12 m Bar Breakdown',
      metrics: {
        unitWeight: 'Unit Weight / Area',
        unitWeightUnit: 'kg/m',
        netWeight: 'Net Weight',
        grossWeight: 'Gross Weight (+Waste)',
        commercialBars: 'Commercial Bars (12 m)',
        barUnit: 'bars',
      },
      boqCategory: 'Rebar Steel',
      boqSummary: (len, w) => `Total length ${len} m · Waste ${w}%`,
      boqMetrics: {
        gross: 'Gross Weight',
        net: 'Net Weight',
        bars: '12 m Bars',
      },
      cadTitle: 'Cross-Section & 12 m Bar Cutting Plan',
      cadAria: (d) => `Cross-section of ${d} mm deformed steel rebar`,
      cadMobileTitle: 'Rebar Cut Schematic (CAD)',
      cadMobileSub: 'Cross-section & 12 m bar breakdown',
      cutPlanTitle: 'Commercial Cutting Schedule (12 m Stock)',
      barsCountLabel: (c) => `${c} bars`,
      fullBarsLabel: 'Full 12 m Bars',
      remainderLabel: 'Final Bar Remainder',
      noRemainder: 'No remainder (0 m)',
      invalidLengthError: 'Please enter a positive total steel length in meters.',
    },
    masonry: {
      heading: 'Masonry Blocks, Bricks & Mortar',
      subtitle: 'Wall takeoff with door/window deductions plus cement & sand estimation',
      defaultWallName: 'Partition / Facade Wall',
      openingsBtn: 'Deduct Openings',
      unitTypeLabel: 'Masonry Unit Type',
      unitsPerM2Suffix: '/m²',
      lengthLabel: 'Wall Length',
      heightLabel: 'Wall Height',
      openingsLabel: 'Openings Area',
      openingsUnitAria: 'Openings area unit',
      wallNameLabel: 'Wall Label',
      advSubtitle: 'Waste factor & unit price (DZD)',
      wasteLabel: 'Waste (%)',
      unitPriceLabel: 'Unit Price per Brick/Block (DZD)',
      warnHeight: 'RPA 2024 Notice: Clear wall height exceeds 4.5 m; intermediate tie beams (chaînages) are required.',
      liveLabel: (s) => `Live Result · ${s}`,
      livePrimary: (c) => `${c} units`,
      liveSecondary: (m) => `${m} m³ mortar`,
      copyCostLabel: 'Copy masonry cost',
      resultsHeading: 'Masonry Units & Mortar Breakdown',
      metrics: {
        netArea: 'Net Wall Area',
        grossSub: (a) => `gross ${a} m²`,
        unitsCount: 'Total Units (+Waste)',
        unitWord: 'pcs',
        netSub: (c) => `net ${c}`,
        mortar: 'Mortar Volume',
        cement: 'Mortar Cement (50 kg)',
        sand: 'Washed Mortar Sand',
      },
      boqCategory: 'Masonry',
      boqSummary: (netArea, openingsArea) => `${netArea} m² net · Openings ${openingsArea} m²`,
      boqMetrics: {
        units: 'Required Units',
        mortar: 'Mortar Volume',
        cement: 'Mortar Cement',
        sand: 'Mortar Sand',
      },
      cadTitle: 'Wall Elevation & Deducted Openings',
      cadAria: 'Engineering wall elevation with opening cutout and dimensions',
      cadMobileTitle: 'Wall Elevation Plan (CAD)',
      cadMobileSub: 'Net area and deducted openings preview',
      openingsSheetTitle: 'Quick Standard Openings',
      openingsSheetSub: 'Add standard door or window areas to deduct automatically',
      quickDoor: '+ Standard Door',
      quickWindow: '+ Window',
      resetOpenings: 'Reset Openings',
      units: {
        brick_8: { label: 'Hollow Red Brick 8H (8T)', dimensions: '10 × 20 × 30 cm' },
        brick_12: { label: 'Hollow Red Brick 12H (12T)', dimensions: '15 × 20 × 30 cm' },
        brick_16: { label: 'Hollow Red Brick 16H (16T)', dimensions: '20 × 20 × 30 cm' },
        parpaing_15: { label: 'Concrete Block 15 cm', dimensions: '15 × 20 × 40 cm' },
        parpaing_20: { label: 'Concrete Block 20 cm', dimensions: '20 × 20 × 40 cm' },
      },
      errorPositiveDims: 'Please enter positive wall length and height values.',
      errorOpeningsExceed: 'Openings area cannot equal or exceed the gross wall area.',
    },
    converter: {
      heading: 'Engineering Unit Converter',
      subtitlePrefix: 'Instant conversion across length, area, volume, mass, and concrete strength',
      tablistAria: 'Unit category',
      valueLabel: 'Value to Convert',
      fromUnitLabel: 'Source Unit',
      copyUnitAria: (name) => `Copy value in ${name}`,
      categories: {
        length: 'Length & Distance',
        area: 'Area & Land',
        volume: 'Volume & Concrete',
        mass: 'Mass (kg / q / t)',
        stress: 'Stress & Strength',
      },
    },
    roads: {
      tablistAria: 'Road design tools',
      tabGradient: 'Slope & Gradient',
      tabEarthworks: 'Earthworks Cut & Fill',
      standardBadgePrefix: 'Highway geometric standards',
      gradient: {
        liveLabel: 'Longitudinal Gradient (B40)',
        heading: 'Two-Point Slope Analyzer',
        subtitlePrefix: 'Enter start and end station coordinates',
        startPk: 'Start Station (PK1)',
        startZ: 'Start Elevation (Z1)',
        endPk: 'End Station (PK2)',
        endZ: 'End Elevation (Z2)',
        cadMobileTitle: 'Slope Triangle & B40 Gauge',
        cadMobileSub: 'Geometric profile of gradient and elevation change',
        cadTitle: 'Geometric Slope Triangle & B40 Scale',
        cadAria: 'Road longitudinal gradient triangle diagram',
        metrics: {
          slope: 'Longitudinal Slope',
          angleRatio: 'Angle / Ratio',
          horizDist: 'Horizontal Run (ΔL)',
          elevDiff: 'Elevation Diff (ΔZ)',
          slopeDist: 'True Slope Distance',
        },
        directions: {
          rampe: 'Upgrade (Rampe)',
          pente: 'Downgrade (Pente)',
          palier: 'Level (Palier)',
        },
        ratioFlat: 'Level (1 : ∞)',
        compliance: {
          DRAINAGE_WARNING: {
            label: 'Flat Grade (< 0.5%) — Drainage Risk',
            rec: 'B40 highway standards require a minimum 0.5% longitudinal slope for surface water runoff.',
          },
          OPTIMAL_HIGHWAY: {
            label: 'Optimal — Highway & National Road Compliant (≤ 5%)',
            rec: 'Ideal gradient for heavy freight trucks and high design speeds.',
          },
          ACCEPTABLE_REGIONAL: {
            label: 'Acceptable — Regional & Rolling Terrain (5% – 7%)',
            rec: 'Suitable for regional roads; verify stopping sight distances and climbing lengths.',
          },
          STEEP_MOUNTAIN: {
            label: 'Steep Grade — Mountain Roads (7% – 10%)',
            rec: 'Requires lined drainage ditches, warning signage, and crawler lanes where warranted.',
          },
          EXCEEDS_STANDARD: {
            label: 'Exceeds Standard Limit (> 10%)',
            rec: 'Exceeds standard road limits; adjust vertical alignment with cut/fill balancing.',
          },
        },
        errorNumeric: 'Please enter valid numeric coordinates for both stations.',
        errorDistance: 'Horizontal distance between start and end chainage must exceed zero.',
      },
      earthworks: {
        liveLabel: (l) => `Earthworks · Length ${l} m`,
        liveCut: (v) => `Cut ${v} m³`,
        liveFill: (v) => `Fill ${v} m³`,
        copyCostLabel: 'Copy earthworks cost',
        heading: 'Linear Earthworks (Cut & Fill)',
        subtitlePrefix: 'Enter carriageway width & station elevations (TN / Design) to compute volumes',
        addStationBtn: 'Add Station',
        defaultProjectTitle: 'Regional Road Alignment — Main Corridor',
        roadWidthLabel: 'Roadbed Width (Plateforme)',
        advTitle: 'Corridor Advanced Parameters',
        advSub: 'Project name, side slope Talus H:V & swell factor',
        advBadge: (s, sw) => `Slope ${s}:1 · Swell ${sw}`,
        projectNameLabel: 'Corridor / Project Name',
        talusLabel: 'Side Slope',
        swellLabel: 'Swell Factor',
        table: {
          station: 'Station',
          ground: 'Ground',
          design: 'Design',
          status: 'Status',
          del: 'Del',
          cutTag: 'Cut',
          fillTag: 'Fill',
          matchTag: 'Grade',
          pkAria: (i) => `Chainage PK for station ${i}`,
          groundAria: (i) => `Existing ground elevation for station ${i}`,
          designAria: (i) => `Design elevation for station ${i}`,
          delAria: (i) => `Delete station ${i}`,
        },
        metrics: {
          lengthMaxSlope: 'Total Length / Max Grade',
          maxSlopeSub: (p) => `Max grade ${p}%`,
          totalCut: 'Total Cut (Déblais)',
          swelledSub: (v) => `Swelled: ${v} m³`,
          totalFill: 'Total Fill (Remblais)',
          netBalance: 'Net Earth Balance',
          surplusSub: 'Surplus cut for haul-off',
          deficitSub: 'Fill deficit (borrow needed)',
          trucks: '15 m³ Dump Truck Trips',
          tripUnit: 'trips',
        },
        sectionsTitle: 'Longitudinal Profile & Typical Cross-Section',
        sectionsSub: 'Interactive ground vs. design profile & batter preview',
        longProfileTitle: 'Longitudinal Profile',
        longProfileAria: 'Road longitudinal profile comparing ground vs design grade',
        groundLegend: 'Ground',
        designLegend: 'Design',
        crossSectionTitle: 'Typical Cross-Section',
        crossSectionAria: 'Trapezoidal cut/fill road cross-section',
        fillSectionBtn: 'Embankment Fill',
        cutSectionBtn: 'Excavation Cut',
        segmentsTitle: 'Segment-by-Segment Breakdown',
        segmentsSub: 'Station intervals, volumes & cut-to-fill transition points',
        segmentsBadge: (c) => `${c} segments`,
        segTable: {
          segment: 'Segment',
          length: 'Length',
          slope: 'Design Grade',
          cutVol: 'Cut Volume',
          fillVol: 'Fill Volume',
          note: 'Field Note',
          transitionAt: 'Transition at',
        },
        boqCategory: 'Road Earthworks',
        boqSummary: (l, w, m) => `Length ${l} m · Width ${w} m · Max grade ${m}%`,
        boqSurplus: (v) => `Cut surplus +${v} m³`,
        boqDeficit: (v) => `Fill deficit ${v} m³`,
        boqMetrics: {
          cut: 'Cut Volume',
          fill: 'Fill Volume',
          balance: 'Net Earth Balance',
          trucks: '15 m³ Truck Trips',
        },
        errors: {
          width: 'Roadbed width must be greater than zero.',
          talus: 'Side slope ratio (H:V) must be zero or positive.',
          minStations: 'Please enter at least 2 stations to compute earthworks.',
          invalidStation: 'One or more stations contain invalid numeric values.',
          increasingPk: 'Station chainages (PK) must be strictly increasing.',
        },
      },
    },
    quarries: {
      pageTitle: 'Quarries & Cement Plants Directory',
      pageSubtitlePrefix: 'Select a Wilaya or enable',
      pageSubtitleSuffix: 'then click any site to inspect materials and haulage ETA',
      wilayatCountLabel: 'Wilayas',
      sitesCountLabel: 'sites',
      loadingMap: 'Loading map...',
      nearestSelected: 'Selected / Nearest:',
      detailsBtn: 'Site Details',
      wilayaSelectLabel: 'Wilaya (58 Provinces)',
      wilayaPrefix: 'Wilaya',
      gpsBtnIdle: 'Use My GPS',
      gpsBtnLoading: 'Acquiring GPS...',
      gpsSuccessToast: 'GPS location captured and haulage matrix updated',
      myLocationGps: 'My Location (GPS)',
      myLocationShort: 'My Location',
      searchSr: 'Search quarry, municipality or material',
      searchPlaceholder: 'Search by name, municipality, or material (8/15, CPJ 42.5)...',
      filterSectionTitle: 'Filter by Material',
      filterAria: 'Filter by material category',
      allCategory: 'All',
      originLabel: 'Origin:',
      sitesLabel: 'Sites:',
      noResults: 'No matching quarries or plants found',
      resetFilter: 'Reset Filter',
      sheetTitleFallback: 'Site Details',
      openGoogleMaps: 'Open Route in Google Maps',
      openGoogleMapsAria: 'Open truck route in Google Maps',
      copyCoords: 'Copy GPS Coordinates',
      coordsCopied: 'Coordinates Copied',
      copyCoordsAria: 'Copy site GPS coordinates',
      distanceLabel: 'Direct Distance',
      etaLabel: 'Estimated Haulage Time',
      catGeologyLabel: 'Category & Geology',
      materialsLabel: 'Available Materials & Grades',
      capacityLabel: 'Capacity & Technical Note',
      gpsCoordsLabel: 'GPS Coordinates',
      mapModes: {
        google: 'Google Maps',
        osm: 'OpenStreetMap',
        svg: 'Offline Vector (SVG)',
        offlineNotice: 'Offline vector map activated automatically',
        googleUnavailable: 'Google Maps is not active in this local environment',
        googleUnavailableHint: 'Switch to OpenStreetMap or the Offline Vector (SVG) map above.',
        leafletAria: 'Interactive Algerian quarries map',
        legendQuarry: 'Quarry / Cement Plant',
        legendSelected: 'Selected Site',
        legendOrigin: 'My Origin',
        svgBanner: 'Local Vector Map (SVG) · Works 100% Offline',
        svgAria: 'Offline vector map of Algerian quarries and cement plants',
        mediterranean: 'Mediterranean Sea (Algerian Coast)',
        scaleLegend: 'Approx. Scale ~ 200 km',
        clickDetails: 'Click for details',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        resetView: 'Reset view',
      },
      categories: {
        gravier: 'Crushed Gravel & Aggregates',
        sable: 'Construction Sand',
        ciment: 'Cement & Clinker',
        enrochement: 'Riprap & Heavy Rock',
      },
      gpsErrors: {
        unsupported: 'Geolocation is not supported by this browser.',
        denied: 'Location permission denied. Enable GPS in browser settings or pick a Wilaya.',
        unavailable: 'GPS signal unavailable here. Using selected Wilaya center.',
        timeout: 'GPS request timed out. Try again in an open area.',
        unknown: 'Unable to determine GPS position. Please choose a Wilaya.',
      },
    },
    reference: {
      heading: 'Engineering Standards (RPA 2024 / CBA 93 / B40)',
      subtitle: 'Algerian structural and highway design codes organized for rapid site reference',
      searchSr: 'Search engineering standards',
      searchPlaceholder: 'Search: cover, lap splice, fc28, slope...',
      filterAria: 'Filter engineering standards by category',
      filters: {
        all: 'All',
        concrete: 'Concrete & Mixes',
        seismic: 'Seismic RPA / CBA93',
        roads: 'Highways B40',
      },
      noResults: 'No standards match your query',
      showAllBtn: 'Show All Standards',
      approvedValueLabel: 'Code Reference Value:',
      aboutHeading: 'About & Technical Identity',
      legalDisclaimer:
        'Professional Disclaimer: This application is a rapid field calculation aid aligned with RPA 99 / 2024, CBA 93, and B40 standards. Always rely on stamped execution drawings from a licensed engineering office.',
      items: [
        {
          id: 'cover',
          category: 'seismic',
          code: 'CBA 93 / RPA',
          title: 'Minimum Concrete Cover (Enrobage)',
          valueText: '2.5 – 5.0 cm',
          noteText: '2.5 cm for interior elements, 3 cm for exposed facades, and 5 cm for soil-contact footings.',
          checklist: [
            'Place certified concrete spacers (Cales à béton) prior to pouring.',
            'Maintain 5 cm clear cover against earth in foundations.',
          ],
        },
        {
          id: 'lap',
          category: 'seismic',
          code: 'RPA 99 / 2024',
          title: 'Rebar Lap Splice Length (Recouvrement)',
          valueText: '40Ø – 50Ø',
          noteText: '40 bar diameters in low/moderate zones and 50Ø in high seismic zones (Zones IIb & III).',
          checklist: [
            'Stagger lap splices instead of clustering all joints at one cross-section.',
            'Verify tie wire fastening at splice ends prior to concrete placement.',
          ],
        },
        {
          id: 'fc28',
          category: 'concrete',
          code: 'B25 / CPJ 42.5',
          title: '28-Day Concrete Compressive Strength (fc28)',
          valueText: '25 MPa (255 kg/cm²)',
          noteText: 'Standard 350 kg/m³ dosage targets 25 MPa at 28 days with W/C ratio ≈ 0.50.',
          checklist: [
            'Use CPJ 42.5 cement with clean washed aggregates free of clay/silt.',
            'Ensure wet curing (Cure) for at least 7 days after pouring.',
          ],
        },
        {
          id: 'b40',
          category: 'roads',
          code: 'B40 Highways',
          title: 'Longitudinal Road Grade Limits (B40)',
          valueText: '0.5% – 7.0%',
          noteText: 'Min 0.5% for drainage, optimal ≤ 5% for national highways, max 10% for mountain roads.',
          checklist: [
            'Maintain a minimum 2.5% crossfall (Dévers) for stormwater drainage.',
            'Provide vertical parabolic curves at grade transitions.',
          ],
        },
        {
          id: 'mix_ratios',
          category: 'concrete',
          code: 'CPJ 42.5 / DOSAGE',
          title: 'Standard Field Concrete Proportions (1 m³)',
          valueText: '350 kg Cement · 400 L Sand · 800 L Gravel',
          noteText: 'Standard volumetric mix ratios balancing workability and strength.',
          checklist: [
            'Blinding concrete: 150–250 kg/m³ at 5–10 cm thickness.',
            'Columns & shear walls: 350–400 kg/m³ with mechanical poker vibration.',
          ],
        },
        {
          id: 'seismic_zones',
          category: 'seismic',
          code: 'RPA 99 / 2024',
          title: 'Minimum Seismic Column Dimensions',
          valueText: '25×25 cm (Zone I) · 30×30 cm (Zone IIa/IIb/III)',
          noteText: 'Minimum column section required by Algerian seismic regulations (RPA) to prevent buckling.',
          checklist: [
            'Minimum longitudinal steel ratio: 0.7% to 0.9% depending on seismic zone.',
            'Tighten hoop spacing in confinement zones to ≤ 10 cm or h/4.',
          ],
        },
        {
          id: 'earthworks_swell',
          category: 'roads',
          code: 'CTT / B40',
          title: 'Soil Swell & Bulking Factors',
          valueText: '1.15 – 1.35',
          noteText: 'Used to estimate loose truck haulage volume (15 m³ dumpers) from bank cut volume.',
          checklist: [
            'Sandy & gravelly soils: swell factor ~ 1.10 – 1.15.',
            'Stiff clay & blasted rock: swell factor 1.25 to 1.35.',
          ],
        },
      ],
    },
    boq: {
      headingMain: 'BOQ & Estimate',
      headingParen: '(Métré & Devis)',
      subtitle: 'Automatically saved in local device storage with instant PDF, CSV, JSON & WhatsApp export',
      pdfHeaderTitle: 'Bill of Quantities & Estimate',
      copyReport: 'Copy Report',
      copiedReport: 'Report Copied',
      copiedToast: 'Report copied to clipboard',
      shareWhatsApp: 'Share via WhatsApp',
      printPdf: 'Print / Save PDF',
      exportCsv: 'Export CSV',
      backupJson: 'Backup JSON',
      restoreJson: 'Restore JSON',
      clearAll: 'Clear All',
      invalidBackupToast: 'Invalid JSON backup file',
      savedCountLabel: 'Saved Line Items',
      totalBudgetLabel: 'Total Estimated Budget',
      emptyTitle: 'No saved items in your BOQ yet',
      emptyHintBefore: 'Run any calculator and tap ',
      emptyHintStrong: '"+ Save to BOQ"',
      emptyHintAfter: ' to store, track, and export quantities.',
      goToCalcs: 'Go to Calculators',
      pdfLegalNote:
        'Professional Disclaimer: Rapid site calculation & estimating aid. Always rely on stamped structural drawings from a licensed engineering firm.',
      pdfGeneratedOffline: 'Generated Offline',
      confirmTitle: 'Confirm Clear BOQ',
      confirmSub: 'All locally saved BOQ line items will be removed',
      confirmCancel: 'Cancel',
      confirmAction: 'Clear All',
      confirmBody: (count) =>
        `Are you sure you want to delete ${count} item(s) from your BOQ? Exporting a CSV backup first is recommended.`,
      csvHeader: ['Category', 'Item', 'Summary', 'Metrics', 'Estimated Cost (DZD)'],
      report: {
        headerLine1: 'DZ Civil Pro Ultimate | Powered by KAD-TECH Engineering Studio',
        headerLine2: 'Field Quantity Takeoff & Cost Estimate (Métré & Devis)',
        dateLabel: 'Date',
        totalBudgetLabel: 'Total Estimated Budget',
        itemCostLabel: 'Estimated Cost',
        footerNote: 'Prepared offline via DZ Civil Pro Ultimate.',
      },
      savedToast: (title) => `Saved "${title}" to BOQ & Estimate`,
    },
    errorBoundary: {
      fallbackMsg: 'An unexpected interface error occurred.',
      title: 'An unexpected error was safely contained',
      subtitle: 'You can resume immediately or reset local cached data if an entry is corrupted.',
      retry: 'Retry',
      resetData: 'Reset Local Data',
    },
  },
};

export function buildBoqReportText(items: SavedBoqItem[], lang: AppLang): string {
  if (items.length === 0) return '';
  const dict = TRANSLATIONS[lang].boq.report;
  const totalCostDzd = items.reduce((acc, item) => acc + (item.estimatedCostDzd ?? 0), 0);
  const dateStr = new Date().toISOString().slice(0, 10);

  return [
    dict.headerLine1,
    dict.headerLine2,
    `${dict.dateLabel}: ${dateStr}`,
    `${dict.totalBudgetLabel}: ${formatCurrencyLocale(totalCostDzd, lang)}`,
    '===================================================',
    ...items.map((item, i) => {
      const metricsText = item.metrics.map((m) => `  - ${m.label}: ${m.value}`).join('\n');
      const costLine = item.estimatedCostDzd
        ? `\n  - ${dict.itemCostLabel}: ${formatCurrencyLocale(item.estimatedCostDzd, lang)}`
        : '';
      return `${i + 1}. [${item.categoryLabel}] ${item.title}\n   (${item.summary})\n${metricsText}${costLine}`;
    }),
    '===================================================',
    dict.footerNote,
  ].join('\n\n');
}

export function getQuarryCategoryLabel(category: MaterialCategory, lang: AppLang): string {
  return TRANSLATIONS[lang].quarries.categories[category];
}
