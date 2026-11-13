import React from 'react';
import {
  DIMENSION_UNIT_LIST,
  LENGTH_UNITS,
  formatEngineeringNumber,
  toMeters,
  type LengthUnit,
  type UnitSpec,
} from '../utils/units';

interface UnitInputFieldProps {
  id: string;
  label: string;
  valueStr: string;
  onValueChange: (val: string) => void;
  unit: LengthUnit;
  onUnitChange: (unit: LengthUnit) => void;
  units?: UnitSpec<LengthUnit>[];
  min?: string;
  focusAccent?: 'kiwi' | 'amber';
  showMetricHint?: boolean;
}

export const UnitInputField: React.FC<UnitInputFieldProps> = ({
  id,
  label,
  valueStr,
  onValueChange,
  unit,
  onUnitChange,
  units = DIMENSION_UNIT_LIST,
  min = '0',
  focusAccent = 'kiwi',
  showMetricHint = true,
}) => {
  const unitSpec = LENGTH_UNITS[unit];
  const numericVal = Number(valueStr);
  const metersVal = Number.isFinite(numericVal) ? toMeters(numericVal, unit) : NaN;
  const focusClass =
    focusAccent === 'amber'
      ? 'focus-within:border-[#f59e0b] focus-within:ring-1 focus-within:ring-[#f59e0b]/40'
      : 'focus-within:border-[#84cc16] focus-within:ring-1 focus-within:ring-[#84cc16]/40';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onValueChange('');
      return;
    }
    const val = Number(raw);
    if (Number.isFinite(val) && val < 0) {
      onValueChange('0');
      return;
    }
    onValueChange(raw);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-[#b7c9bc]">
        <span>{label}</span>
        {showMetricHint && unit !== 'm' && Number.isFinite(metersVal) && numericVal > 0 && (
          <span className="font-mono-tabular text-[11px] font-semibold text-[#84cc16]" dir="ltr">
            = <bdi dir="ltr">{formatEngineeringNumber(metersVal, 3)} m</bdi>
          </span>
        )}
      </label>
      <div
        className={`dz-input-control flex min-h-[46px] items-stretch overflow-hidden rounded-[14px] border border-[#24352b] bg-[#070b09] transition-all duration-200 ${focusClass}`}
      >
        <input
          id={id}
          type="number"
          min={min}
          step={unitSpec.step}
          value={valueStr}
          onChange={handleInputChange}
          className="font-mono-tabular w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-[#f4f7f2] outline-none"
        />
        <label htmlFor={`${id}-unit`} className="sr-only">
          وحدة قياس {label}
        </label>
        <select
          id={`${id}-unit`}
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as LengthUnit)}
          className="border-s border-[#24352b] bg-[#141d18] px-3.5 text-xs font-bold text-[#f59e0b] outline-none cursor-pointer transition-colors duration-200 hover:bg-[#1a261f] shrink-0"
        >
          {units.map((u) => (
            <option key={u.id} value={u.id} className="bg-[#0f1612] text-[#f4f7f2]">
              {u.symbol}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
