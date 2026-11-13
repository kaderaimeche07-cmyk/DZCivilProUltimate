export type UnitCategory = 'length' | 'area' | 'volume' | 'mass' | 'stress';

export type LengthUnit = 'mm' | 'cm' | 'dm' | 'm' | 'km' | 'in' | 'ft';
export type AreaUnit = 'cm2' | 'm2' | 'are' | 'ha' | 'km2' | 'ft2';
export type VolumeUnit = 'cm3' | 'L' | 'm3' | 'ft3';
export type MassUnit = 'g' | 'kg' | 'q' | 't';
export type StressUnit = 'MPa' | 'bar' | 'kg_cm2' | 'kPa' | 'psi';

export type AnyUnitId = LengthUnit | AreaUnit | VolumeUnit | MassUnit | StressUnit;

export interface UnitSpec<T extends string = string> {
  id: T;
  symbol: string;
  arName: string;
  /** Factor to multiply a value in this unit to get the SI base unit (m, m², m³, kg, MPa) */
  toBase: number;
  step: string;
}

export const LENGTH_UNITS: Record<LengthUnit, UnitSpec<LengthUnit>> = {
  m: { id: 'm', symbol: 'م', arName: 'متر', toBase: 1, step: '0.1' },
  cm: { id: 'cm', symbol: 'سم', arName: 'سنتيمتر', toBase: 0.01, step: '1' },
  mm: { id: 'mm', symbol: 'ملم', arName: 'مليمتر', toBase: 0.001, step: '10' },
  dm: { id: 'dm', symbol: 'دسم', arName: 'ديسيمتر', toBase: 0.1, step: '1' },
  km: { id: 'km', symbol: 'كم', arName: 'كيلومتر', toBase: 1000, step: '0.05' },
  ft: { id: 'ft', symbol: 'قدم', arName: 'قدم (ft)', toBase: 0.3048, step: '0.5' },
  in: { id: 'in', symbol: 'بوصة', arName: 'بوصة (in)', toBase: 0.0254, step: '1' },
};

export const AREA_UNITS: Record<AreaUnit, UnitSpec<AreaUnit>> = {
  m2: { id: 'm2', symbol: 'م²', arName: 'متر مربع', toBase: 1, step: '0.5' },
  cm2: { id: 'cm2', symbol: 'سم²', arName: 'سنتيمتر مربع', toBase: 0.0001, step: '100' },
  are: { id: 'are', symbol: 'آر', arName: 'آر (100 م²)', toBase: 100, step: '0.5' },
  ha: { id: 'ha', symbol: 'هكتار', arName: 'هكتار', toBase: 10000, step: '0.1' },
  km2: { id: 'km2', symbol: 'كم²', arName: 'كيلومتر مربع', toBase: 1_000_000, step: '0.01' },
  ft2: { id: 'ft2', symbol: 'قدم²', arName: 'قدم مربع', toBase: 0.09290304, step: '1' },
};

export const VOLUME_UNITS: Record<VolumeUnit, UnitSpec<VolumeUnit>> = {
  m3: { id: 'm3', symbol: 'م³', arName: 'متر مكعب', toBase: 1, step: '0.1' },
  L: { id: 'L', symbol: 'لتر', arName: 'لتر (دسم³)', toBase: 0.001, step: '10' },
  cm3: { id: 'cm3', symbol: 'سم³', arName: 'سنتيمتر مكعب', toBase: 0.000001, step: '100' },
  ft3: { id: 'ft3', symbol: 'قدم³', arName: 'قدم مكعب', toBase: 0.0283168466, step: '1' },
};

export const MASS_UNITS: Record<MassUnit, UnitSpec<MassUnit>> = {
  kg: { id: 'kg', symbol: 'كغ', arName: 'كيلوغرام', toBase: 1, step: '1' },
  g: { id: 'g', symbol: 'غ', arName: 'غرام', toBase: 0.001, step: '100' },
  q: { id: 'q', symbol: 'قنطار', arName: 'قنطار (100 كغ)', toBase: 100, step: '0.5' },
  t: { id: 't', symbol: 'طن', arName: 'طن متري', toBase: 1000, step: '0.1' },
};

export const STRESS_UNITS: Record<StressUnit, UnitSpec<StressUnit>> = {
  MPa: { id: 'MPa', symbol: 'MPa', arName: 'ميغاباسكال', toBase: 1, step: '1' },
  bar: { id: 'bar', symbol: 'bar', arName: 'بار', toBase: 0.1, step: '10' },
  kg_cm2: { id: 'kg_cm2', symbol: 'كغ/سم²', arName: 'كغ/سم²', toBase: 0.0980665, step: '10' },
  kPa: { id: 'kPa', symbol: 'kPa', arName: 'كيلوباسكال', toBase: 0.001, step: '50' },
  psi: { id: 'psi', symbol: 'PSI', arName: 'رطل/بوصة²', toBase: 0.006894757, step: '100' },
};

export const LENGTH_UNIT_LIST: UnitSpec<LengthUnit>[] = [
  LENGTH_UNITS.m,
  LENGTH_UNITS.cm,
  LENGTH_UNITS.mm,
  LENGTH_UNITS.dm,
  LENGTH_UNITS.km,
  LENGTH_UNITS.ft,
  LENGTH_UNITS.in,
];

export const DIMENSION_UNIT_LIST: UnitSpec<LengthUnit>[] = [
  LENGTH_UNITS.m,
  LENGTH_UNITS.cm,
  LENGTH_UNITS.mm,
  LENGTH_UNITS.ft,
  LENGTH_UNITS.in,
];

export function toMeters(value: number, unit: LengthUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return value * LENGTH_UNITS[unit].toBase;
}

export function fromMeters(meters: number, unit: LengthUnit): number {
  if (!Number.isFinite(meters)) return NaN;
  return meters / LENGTH_UNITS[unit].toBase;
}

export function toSquareMeters(value: number, unit: AreaUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return value * AREA_UNITS[unit].toBase;
}

export function fromSquareMeters(sqm: number, unit: AreaUnit): number {
  if (!Number.isFinite(sqm)) return NaN;
  return sqm / AREA_UNITS[unit].toBase;
}

export function toCubicMeters(value: number, unit: VolumeUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return value * VOLUME_UNITS[unit].toBase;
}

export function fromCubicMeters(cbm: number, unit: VolumeUnit): number {
  if (!Number.isFinite(cbm)) return NaN;
  return cbm / VOLUME_UNITS[unit].toBase;
}

export function toKilograms(value: number, unit: MassUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return value * MASS_UNITS[unit].toBase;
}

export function fromKilograms(kg: number, unit: MassUnit): number {
  if (!Number.isFinite(kg)) return NaN;
  return kg / MASS_UNITS[unit].toBase;
}

export function toMPa(value: number, unit: StressUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return value * STRESS_UNITS[unit].toBase;
}

export function fromMPa(mpa: number, unit: StressUnit): number {
  if (!Number.isFinite(mpa)) return NaN;
  return mpa / STRESS_UNITS[unit].toBase;
}

export function getCategoryUnitMap(category: UnitCategory): Record<string, UnitSpec> {
  switch (category) {
    case 'length':
      return LENGTH_UNITS;
    case 'area':
      return AREA_UNITS;
    case 'volume':
      return VOLUME_UNITS;
    case 'mass':
      return MASS_UNITS;
    case 'stress':
      return STRESS_UNITS;
  }
}

export function convertUnitValue(
  category: UnitCategory,
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  if (!Number.isFinite(value)) return NaN;
  const map = getCategoryUnitMap(category);
  const fromSpec = map[fromUnit];
  const toSpec = map[toUnit];
  if (!fromSpec || !toSpec) return NaN;
  const baseValue = value * fromSpec.toBase;
  return baseValue / toSpec.toBase;
}

export function formatEngineeringNumber(val: number, maxDecimals = 4): string {
  if (!Number.isFinite(val)) return '—';
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 1000000 || (abs > 0 && abs < 0.0001)) {
    return val.toExponential(3);
  }
  const decimals = abs >= 100 ? 2 : abs >= 1 ? 3 : maxDecimals;
  return Number(val.toFixed(decimals)).toString();
}
