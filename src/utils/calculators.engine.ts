export type ConcreteDosage = 250 | 300 | 350 | 400;

export interface ConcreteInput {
  lengthM: number;
  widthM: number;
  thicknessM: number;
  dosageKgPerM3: ConcreteDosage;
  wastePercent?: number;
}

export interface ConcreteResult {
  valid: boolean;
  error?: string;
  netVolumeM3: number;
  grossVolumeM3: number;
  cementKg: number;
  cementBags50kg: number;
  sandM3: number;
  sandTonnes: number;
  gravelM3: number;
  gravelTonnes: number;
  waterLiters: number;
  mixTrucks7m3: number;
}

/**
 * Algerian standard site concrete formulation (Dreux-Gorisse practical ratios):
 * For 1 m³ at 350 kg/m³ (CPJ 42.5): 350 kg cement, 0.40 m³ sand (0/3), 0.80 m³ gravel (8/15 & 15/25), 175 L water.
 */
export function calculateConcreteMix(input: ConcreteInput): ConcreteResult {
  const { lengthM, widthM, thicknessM, dosageKgPerM3, wastePercent = 5 } = input;

  if (
    !Number.isFinite(lengthM) ||
    !Number.isFinite(widthM) ||
    !Number.isFinite(thicknessM) ||
    lengthM <= 0 ||
    widthM <= 0 ||
    thicknessM <= 0
  ) {
    return {
      valid: false,
      error: 'يرجى إدخال أبعاد موجبة صحيحة (الطول، العرض، والسمك).',
      netVolumeM3: 0,
      grossVolumeM3: 0,
      cementKg: 0,
      cementBags50kg: 0,
      sandM3: 0,
      sandTonnes: 0,
      gravelM3: 0,
      gravelTonnes: 0,
      waterLiters: 0,
      mixTrucks7m3: 0,
    };
  }

  const safeWaste = Math.max(0, Math.min(30, wastePercent));
  const netVolumeM3 = lengthM * widthM * thicknessM;
  const grossVolumeM3 = netVolumeM3 * (1 + safeWaste / 100);

  const ratioTable: Record<ConcreteDosage, { sandPerM3: number; gravelPerM3: number; waterPerM3: number }> = {
    250: { sandPerM3: 0.45, gravelPerM3: 0.82, waterPerM3: 150 },
    300: { sandPerM3: 0.42, gravelPerM3: 0.81, waterPerM3: 165 },
    350: { sandPerM3: 0.40, gravelPerM3: 0.80, waterPerM3: 175 },
    400: { sandPerM3: 0.38, gravelPerM3: 0.78, waterPerM3: 190 },
  };

  const ratios = ratioTable[dosageKgPerM3];
  const cementKg = grossVolumeM3 * dosageKgPerM3;
  const cementBags50kg = Math.ceil(cementKg / 50);
  const sandM3 = grossVolumeM3 * ratios.sandPerM3;
  const gravelM3 = grossVolumeM3 * ratios.gravelPerM3;
  const sandTonnes = sandM3 * 1.55; // Apparent bulk density ~1.55 t/m³
  const gravelTonnes = gravelM3 * 1.45; // Crushed limestone ~1.45 t/m³
  const waterLiters = grossVolumeM3 * ratios.waterPerM3;
  const mixTrucks7m3 = Number((grossVolumeM3 / 7).toFixed(2));

  return {
    valid: true,
    netVolumeM3: Number(netVolumeM3.toFixed(2)),
    grossVolumeM3: Number(grossVolumeM3.toFixed(2)),
    cementKg: Math.round(cementKg),
    cementBags50kg,
    sandM3: Number(sandM3.toFixed(2)),
    sandTonnes: Number(sandTonnes.toFixed(2)),
    gravelM3: Number(gravelM3.toFixed(2)),
    gravelTonnes: Number(gravelTonnes.toFixed(2)),
    waterLiters: Math.round(waterLiters),
    mixTrucks7m3,
  };
}

export type RebarDiameterMm = 6 | 8 | 10 | 12 | 14 | 16 | 20 | 25 | 32;

export const REBAR_DIAMETERS: RebarDiameterMm[] = [6, 8, 10, 12, 14, 16, 20, 25, 32];

export const REBAR_UNIT_WEIGHTS_KG_M: Record<RebarDiameterMm, number> = {
  6: 0.222,
  8: 0.395,
  10: 0.617,
  12: 0.888,
  14: 1.208,
  16: 1.578,
  20: 2.466,
  25: 3.853,
  32: 6.313,
};

export interface RebarInput {
  diameterMm: RebarDiameterMm;
  totalLengthM: number;
  wastePercent?: number;
}

export interface RebarResult {
  valid: boolean;
  error?: string;
  diameterMm: RebarDiameterMm;
  unitWeightKgPerM: number;
  crossSectionMm2: number;
  netWeightKg: number;
  grossWeightKg: number;
  grossWeightTonnes: number;
  commercial12mBars: number;
}

export function calculateRebarWeight(input: RebarInput): RebarResult {
  const { diameterMm, totalLengthM, wastePercent = 3 } = input;
  const unitWeightKgPerM = REBAR_UNIT_WEIGHTS_KG_M[diameterMm];
  const crossSectionMm2 = Number((Math.PI * Math.pow(diameterMm / 2, 2)).toFixed(1));

  if (!Number.isFinite(totalLengthM) || totalLengthM <= 0) {
    return {
      valid: false,
      error: 'يرجى إدخال طول إجمالي موجب للحديد بالمتر.',
      diameterMm,
      unitWeightKgPerM,
      crossSectionMm2,
      netWeightKg: 0,
      grossWeightKg: 0,
      grossWeightTonnes: 0,
      commercial12mBars: 0,
    };
  }

  const safeWaste = Math.max(0, Math.min(25, wastePercent));
  const netWeightKg = totalLengthM * unitWeightKgPerM;
  const grossWeightKg = netWeightKg * (1 + safeWaste / 100);
  const commercial12mBars = Math.ceil((totalLengthM * (1 + safeWaste / 100)) / 12);

  return {
    valid: true,
    diameterMm,
    unitWeightKgPerM,
    crossSectionMm2,
    netWeightKg: Number(netWeightKg.toFixed(2)),
    grossWeightKg: Number(grossWeightKg.toFixed(2)),
    grossWeightTonnes: Number((grossWeightKg / 1000).toFixed(3)),
    commercial12mBars,
  };
}

export type MasonryUnitType = 'brick_8' | 'brick_12' | 'brick_16' | 'parpaing_15' | 'parpaing_20';

export interface MasonrySpec {
  id: MasonryUnitType;
  label: string;
  dimensionsCm: string;
  unitsPerM2: number;
  mortarM3PerM2: number;
}

export const MASONRY_SPECS: Record<MasonryUnitType, MasonrySpec> = {
  brick_8: {
    id: 'brick_8',
    label: 'آجر أحمر 8 ثقوب (Brique 8T)',
    dimensionsCm: '10 × 20 × 30 سم',
    unitsPerM2: 16,
    mortarM3PerM2: 0.015,
  },
  brick_12: {
    id: 'brick_12',
    label: 'آجر أحمر 12 ثقب (Brique 12T)',
    dimensionsCm: '15 × 20 × 30 سم',
    unitsPerM2: 16,
    mortarM3PerM2: 0.022,
  },
  brick_16: {
    id: 'brick_16',
    label: 'آجر أحمر 16 ثقب (Brique 16T)',
    dimensionsCm: '20 × 20 × 30 سم',
    unitsPerM2: 16,
    mortarM3PerM2: 0.028,
  },
  parpaing_15: {
    id: 'parpaing_15',
    label: 'بلوك إسمنتي 15 (Parpaing 15)',
    dimensionsCm: '15 × 20 × 40 سم',
    unitsPerM2: 12.5,
    mortarM3PerM2: 0.018,
  },
  parpaing_20: {
    id: 'parpaing_20',
    label: 'بلوك إسمنتي 20 (Parpaing 20)',
    dimensionsCm: '20 × 20 × 40 سم',
    unitsPerM2: 12.5,
    mortarM3PerM2: 0.024,
  },
};

export interface MasonryInput {
  wallLengthM: number;
  wallHeightM: number;
  openingsAreaM2?: number;
  unitType: MasonryUnitType;
  wastePercent?: number;
}

export interface MasonryResult {
  valid: boolean;
  error?: string;
  grossAreaM2: number;
  netAreaM2: number;
  netUnits: number;
  totalUnitsWithWaste: number;
  mortarVolumeM3: number;
  cementBags50kg: number;
  sandM3: number;
}

export function calculateMasonryWall(input: MasonryInput): MasonryResult {
  const { wallLengthM, wallHeightM, openingsAreaM2 = 0, unitType, wastePercent = 5 } = input;
  const spec = MASONRY_SPECS[unitType];

  if (!Number.isFinite(wallLengthM) || !Number.isFinite(wallHeightM) || wallLengthM <= 0 || wallHeightM <= 0) {
    return {
      valid: false,
      error: 'يرجى إدخال طول وارتفاع الجدار بقيم موجبة.',
      grossAreaM2: 0,
      netAreaM2: 0,
      netUnits: 0,
      totalUnitsWithWaste: 0,
      mortarVolumeM3: 0,
      cementBags50kg: 0,
      sandM3: 0,
    };
  }

  const grossAreaM2 = wallLengthM * wallHeightM;
  const safeOpenings = Math.max(0, openingsAreaM2);
  if (safeOpenings >= grossAreaM2) {
    return {
      valid: false,
      error: 'مساحة الفتحات (الأبواب والنوافذ) لا يمكن أن تساوي أو تتجاوز مساحة الجدار الكلية.',
      grossAreaM2: Number(grossAreaM2.toFixed(2)),
      netAreaM2: 0,
      netUnits: 0,
      totalUnitsWithWaste: 0,
      mortarVolumeM3: 0,
      cementBags50kg: 0,
      sandM3: 0,
    };
  }

  const safeWaste = Math.max(0, Math.min(25, wastePercent));
  const netAreaM2 = grossAreaM2 - safeOpenings;
  const netUnits = Math.ceil(netAreaM2 * spec.unitsPerM2);
  const totalUnitsWithWaste = Math.ceil(netAreaM2 * spec.unitsPerM2 * (1 + safeWaste / 100));

  // Mortar dosed at 300 kg cement / m³ of mortar
  const mortarVolumeM3 = netAreaM2 * spec.mortarM3PerM2 * (1 + safeWaste / 100);
  const cementBags50kg = Math.max(1, Math.ceil((mortarVolumeM3 * 300) / 50));
  const sandM3 = mortarVolumeM3 * 1.05;

  return {
    valid: true,
    grossAreaM2: Number(grossAreaM2.toFixed(2)),
    netAreaM2: Number(netAreaM2.toFixed(2)),
    netUnits,
    totalUnitsWithWaste,
    mortarVolumeM3: Number(mortarVolumeM3.toFixed(3)),
    cementBags50kg,
    sandM3: Number(sandM3.toFixed(2)),
  };
}

// ============================================================================
// ROAD DESIGN & LINEAR EARTHWORKS (تصميم الطرقات وحسابات الحفر والردم)
// ============================================================================

export type RoadGradientCompliance =
  | 'DRAINAGE_WARNING'
  | 'OPTIMAL_HIGHWAY'
  | 'ACCEPTABLE_REGIONAL'
  | 'STEEP_MOUNTAIN'
  | 'EXCEEDS_STANDARD';

export interface RoadGradientInput {
  startChainageM: number;
  startElevationM: number;
  endChainageM: number;
  endElevationM: number;
}

export interface RoadGradientResult {
  valid: boolean;
  error?: string;
  horizontalDistanceM: number;
  elevationDiffM: number;
  slopeDistanceM: number;
  slopePercent: number;
  absSlopePercent: number;
  slopeAngleDeg: number;
  slopeRatioText: string;
  direction: 'rampe' | 'pente' | 'palier';
  directionLabelAr: string;
  compliance: RoadGradientCompliance;
  complianceLabelAr: string;
  recommendationAr: string;
}

export function classifyRoadGradient(absSlopePercent: number): {
  compliance: RoadGradientCompliance;
  complianceLabelAr: string;
  recommendationAr: string;
} {
  if (absSlopePercent < 0.5) {
    return {
      compliance: 'DRAINAGE_WARNING',
      complianceLabelAr: 'ميل ضعيف (< 0.5%) — خطر ركود المياه',
      recommendationAr: 'المعايير الجزائرية (B40) توصي بميل طولي أدنى 0.5% لضمان تصريف مياه الأمطار.',
    };
  }
  if (absSlopePercent <= 5) {
    return {
      compliance: 'OPTIMAL_HIGHWAY',
      complianceLabelAr: 'مثالي — مطابق للطرق السريعة والوطنية (≤ 5%)',
      recommendationAr: 'الميل ضمن الحدود المثالية لحركة الشاحنات الثقيلة والسرعات التصميمية العالية.',
    };
  }
  if (absSlopePercent <= 7) {
    return {
      compliance: 'ACCEPTABLE_REGIONAL',
      complianceLabelAr: 'مقبول — طرق ولائية ومناطق متموجة (5% - 7%)',
      recommendationAr: 'مناسب للطرق الولائية والبلدية مع مراعاة طول المنحدر ومسافات الرؤية.',
    };
  }
  if (absSlopePercent <= 10) {
    return {
      compliance: 'STEEP_MOUNTAIN',
      complianceLabelAr: 'منحدر حاد — مسالك جبلية (7% - 10%)',
      recommendationAr: 'يتطلب خنادق تصريف مبطنة وإشارات تنبيه، ويُفضل إضافة مسلك للشاحنات البطيئة.',
    };
  }
  return {
    compliance: 'EXCEEDS_STANDARD',
    complianceLabelAr: 'يتجاوز الحد المعياري (> 10%)',
    recommendationAr: 'يتجاوز الميل المسموح به للطرق المصنفة؛ يُنصح بتعديل المسار أو تنفيذ حفر/ردم لتخفيف الانحدار.',
  };
}

export function calculateRoadGradient(input: RoadGradientInput): RoadGradientResult {
  const { startChainageM, startElevationM, endChainageM, endElevationM } = input;

  if (
    !Number.isFinite(startChainageM) ||
    !Number.isFinite(startElevationM) ||
    !Number.isFinite(endChainageM) ||
    !Number.isFinite(endElevationM)
  ) {
    return {
      valid: false,
      error: 'يرجى إدخال قيم رقمية صحيحة لنقطتي البداية والنهاية.',
      horizontalDistanceM: 0,
      elevationDiffM: 0,
      slopeDistanceM: 0,
      slopePercent: 0,
      absSlopePercent: 0,
      slopeAngleDeg: 0,
      slopeRatioText: '—',
      direction: 'palier',
      directionLabelAr: 'مستوي',
      compliance: 'DRAINAGE_WARNING',
      complianceLabelAr: 'بيانات غير مكتملة',
      recommendationAr: '',
    };
  }

  const horizontalDistanceM = Math.abs(endChainageM - startChainageM);
  if (horizontalDistanceM <= 0) {
    return {
      valid: false,
      error: 'يجب أن يكون البعد الأفقي بين نقطة البداية ونقطة النهاية أكبر من الصفر.',
      horizontalDistanceM: 0,
      elevationDiffM: 0,
      slopeDistanceM: 0,
      slopePercent: 0,
      absSlopePercent: 0,
      slopeAngleDeg: 0,
      slopeRatioText: '—',
      direction: 'palier',
      directionLabelAr: 'مستوي',
      compliance: 'DRAINAGE_WARNING',
      complianceLabelAr: 'خطأ في المسافة',
      recommendationAr: '',
    };
  }

  const elevationDiffM = endElevationM - startElevationM;
  const slopeDistanceM = Math.hypot(horizontalDistanceM, elevationDiffM);
  const slopePercent = (elevationDiffM / horizontalDistanceM) * 100;
  const absSlopePercent = Math.abs(slopePercent);
  const slopeAngleDeg = (Math.atan(Math.abs(elevationDiffM) / horizontalDistanceM) * 180) / Math.PI;
  const slopeRatioText =
    Math.abs(elevationDiffM) < 0.0001
      ? 'مستوي (1 : ∞)'
      : `1 : ${(horizontalDistanceM / Math.abs(elevationDiffM)).toFixed(1)}`;

  let direction: 'rampe' | 'pente' | 'palier' = 'palier';
  let directionLabelAr = 'مستوي (Palier)';
  if (elevationDiffM > 0.001) {
    direction = 'rampe';
    directionLabelAr = 'صعود (Rampe)';
  } else if (elevationDiffM < -0.001) {
    direction = 'pente';
    directionLabelAr = 'نزول (Pente)';
  }

  const classification = classifyRoadGradient(absSlopePercent);

  return {
    valid: true,
    horizontalDistanceM: Number(horizontalDistanceM.toFixed(2)),
    elevationDiffM: Number(elevationDiffM.toFixed(3)),
    slopeDistanceM: Number(slopeDistanceM.toFixed(2)),
    slopePercent: Number(slopePercent.toFixed(2)),
    absSlopePercent: Number(absSlopePercent.toFixed(2)),
    slopeAngleDeg: Number(slopeAngleDeg.toFixed(2)),
    slopeRatioText,
    direction,
    directionLabelAr,
    ...classification,
  };
}

export interface RoadStationPoint {
  id: string;
  chainageM: number;
  groundElevM: number;
  designElevM: number;
}

export interface LinearCutFillInput {
  roadWidthM: number;
  sideSlopeRatio: number; // H:V batter slope (e.g. 1.5 means 1.5H:1V)
  swellFactor?: number; // Bulk/compaction adjustment factor (default 1.20)
  stations: RoadStationPoint[];
}

export interface RoadSegmentAnalysis {
  fromChainageM: number;
  toChainageM: number;
  lengthM: number;
  designGradient: RoadGradientResult;
  cutVolumeM3: number;
  fillVolumeM3: number;
  hasTransitionPoint: boolean;
  transitionChainageM: number | null;
}

export interface LinearCutFillResult {
  valid: boolean;
  error?: string;
  totalLengthM: number;
  totalCutVolumeM3: number;
  totalFillVolumeM3: number;
  swelledCutVolumeM3: number;
  netEarthBalanceM3: number; // Positive = Surplus Cut (فائض حفر), Negative = Fill Deficit (عجز ردم)
  truckTrips15m3: number;
  maxAbsGradientPercent: number;
  segments: RoadSegmentAnalysis[];
}

/**
 * Trapezoidal cross-section area for cut or fill:
 * A = (roadWidth + sideSlopeRatio * depth) * depth
 */
export function calculateTrapezoidalSectionArea(
  roadWidthM: number,
  sideSlopeRatio: number,
  depthM: number
): number {
  const absDepth = Math.abs(depthM);
  if (absDepth <= 0) return 0;
  return (roadWidthM + sideSlopeRatio * absDepth) * absDepth;
}

/**
 * Computes cut (Déblais) and fill (Remblais) volumes for linear projects across ordered stations.
 * Automatically detects cut-to-fill zero-crossing transitions inside segments and splits volumes accurately.
 */
export function calculateLinearCutFill(input: LinearCutFillInput): LinearCutFillResult {
  const { roadWidthM, sideSlopeRatio, swellFactor = 1.2, stations } = input;

  if (!Number.isFinite(roadWidthM) || roadWidthM <= 0) {
    return {
      valid: false,
      error: 'يجب أن يكون عرض قارعة الطريق (Plateforme) أكبر من الصفر.',
      totalLengthM: 0,
      totalCutVolumeM3: 0,
      totalFillVolumeM3: 0,
      swelledCutVolumeM3: 0,
      netEarthBalanceM3: 0,
      truckTrips15m3: 0,
      maxAbsGradientPercent: 0,
      segments: [],
    };
  }

  if (!Number.isFinite(sideSlopeRatio) || sideSlopeRatio < 0) {
    return {
      valid: false,
      error: 'ميل الأكتاف الجانبية (Talus H:V) يجب أن يكون قيمة موجبة أو صفر.',
      totalLengthM: 0,
      totalCutVolumeM3: 0,
      totalFillVolumeM3: 0,
      swelledCutVolumeM3: 0,
      netEarthBalanceM3: 0,
      truckTrips15m3: 0,
      maxAbsGradientPercent: 0,
      segments: [],
    };
  }

  if (!stations || stations.length < 2) {
    return {
      valid: false,
      error: 'يرجى إدخال نقطتين (محطتين) على الأقل لحساب المقاطع الطولية والأحجام.',
      totalLengthM: 0,
      totalCutVolumeM3: 0,
      totalFillVolumeM3: 0,
      swelledCutVolumeM3: 0,
      netEarthBalanceM3: 0,
      truckTrips15m3: 0,
      maxAbsGradientPercent: 0,
      segments: [],
    };
  }

  const sorted = [...stations].sort((a, b) => a.chainageM - b.chainageM);
  let totalLengthM = 0;
  let totalCutVolumeM3 = 0;
  let totalFillVolumeM3 = 0;
  let maxAbsGradientPercent = 0;
  const segments: RoadSegmentAnalysis[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const s1 = sorted[i];
    const s2 = sorted[i + 1];
    const lengthM = s2.chainageM - s1.chainageM;

    if (lengthM <= 0) {
      return {
        valid: false,
        error: 'يجب أن تكون مسافات المحطات (PK) متزايدة ومختلفة عن بعضها.',
        totalLengthM: 0,
        totalCutVolumeM3: 0,
        totalFillVolumeM3: 0,
        swelledCutVolumeM3: 0,
        netEarthBalanceM3: 0,
        truckTrips15m3: 0,
        maxAbsGradientPercent: 0,
        segments: [],
      };
    }

    const designGradient = calculateRoadGradient({
      startChainageM: s1.chainageM,
      startElevationM: s1.designElevM,
      endChainageM: s2.chainageM,
      endElevationM: s2.designElevM,
    });

    if (designGradient.absSlopePercent > maxAbsGradientPercent) {
      maxAbsGradientPercent = designGradient.absSlopePercent;
    }

    // Positive delta = designElev > groundElev => FILL (ردم / Remblais)
    // Negative delta = designElev < groundElev => CUT (حفر / Déblais)
    const d1 = s1.designElevM - s1.groundElevM;
    const d2 = s2.designElevM - s2.groundElevM;

    let cutVol = 0;
    let fillVol = 0;
    let hasTransitionPoint = false;
    let transitionChainageM: number | null = null;

    if ((d1 >= 0 && d2 >= 0) || (d1 <= 0 && d2 <= 0)) {
      const a1 = calculateTrapezoidalSectionArea(roadWidthM, sideSlopeRatio, d1);
      const a2 = calculateTrapezoidalSectionArea(roadWidthM, sideSlopeRatio, d2);
      const avgVol = ((a1 + a2) / 2) * lengthM;
      if (d1 < 0 || d2 < 0) {
        cutVol = avgVol;
      } else {
        fillVol = avgVol;
      }
    } else {
      // Zero-crossing point (Point de passage Déblai/Remblai)
      hasTransitionPoint = true;
      const absD1 = Math.abs(d1);
      const absD2 = Math.abs(d2);
      const l1 = (absD1 / (absD1 + absD2)) * lengthM;
      const l2 = lengthM - l1;
      transitionChainageM = Number((s1.chainageM + l1).toFixed(2));

      const a1 = calculateTrapezoidalSectionArea(roadWidthM, sideSlopeRatio, d1);
      const a2 = calculateTrapezoidalSectionArea(roadWidthM, sideSlopeRatio, d2);

      const vol1 = (a1 / 2) * l1;
      const vol2 = (a2 / 2) * l2;

      if (d1 < 0) {
        cutVol = vol1;
        fillVol = vol2;
      } else {
        fillVol = vol1;
        cutVol = vol2;
      }
    }

    totalLengthM += lengthM;
    totalCutVolumeM3 += cutVol;
    totalFillVolumeM3 += fillVol;

    segments.push({
      fromChainageM: s1.chainageM,
      toChainageM: s2.chainageM,
      lengthM: Number(lengthM.toFixed(2)),
      designGradient,
      cutVolumeM3: Number(cutVol.toFixed(2)),
      fillVolumeM3: Number(fillVol.toFixed(2)),
      hasTransitionPoint,
      transitionChainageM,
    });
  }

  const safeSwell = Math.max(1, Math.min(1.6, swellFactor));
  const swelledCutVolumeM3 = totalCutVolumeM3 * safeSwell;
  const netEarthBalanceM3 = totalCutVolumeM3 - totalFillVolumeM3;
  const truckTrips15m3 = Math.ceil(Math.max(swelledCutVolumeM3, totalFillVolumeM3) / 15);

  return {
    valid: true,
    totalLengthM: Number(totalLengthM.toFixed(2)),
    totalCutVolumeM3: Number(totalCutVolumeM3.toFixed(2)),
    totalFillVolumeM3: Number(totalFillVolumeM3.toFixed(2)),
    swelledCutVolumeM3: Number(swelledCutVolumeM3.toFixed(2)),
    netEarthBalanceM3: Number(netEarthBalanceM3.toFixed(2)),
    truckTrips15m3,
    maxAbsGradientPercent: Number(maxAbsGradientPercent.toFixed(2)),
    segments,
  };
}

