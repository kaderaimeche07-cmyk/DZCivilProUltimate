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
    focusAccent === 'amber' ? 'focus-within:border-[#f59e0b]' : 'focus-within:border-[#84cc16]';

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-[#c5d6c9]">
        <span>{label}</span>
        {showMetricHint && unit !== 'm' && Number.isFinite(metersVal) && numericVal > 0 && (
          <span className="font-mono-tabular text-[11px] font-medium text-[#a3e635]" dir="ltr">
            = {formatEngineeringNumber(metersVal, 3)} m
          </span>
        )}
      </label>
      <div
        className={`flex min-h-[44px] items-stretch overflow-hidden rounded-xl border border-white/10 bg-[#0b110d] transition-colors ${focusClass}`}
      >
        <input
          id={id}
          type="number"
          min={min}
          step={unitSpec.step}
          value={valueStr}
          onChange={(e) => onValueChange(e.target.value)}
          className="font-mono-tabular w-full min-w-0 bg-transparent px-3 py-2 text-sm text-white outline-none"
        />
        <label htmlFor={`${id}-unit`} className="sr-only">
          وحدة قياس {label}
        </label>
        <select
          id={`${id}-unit`}
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as LengthUnit)}
          className="border-s border-white/10 bg-[#1a261e] px-3 text-xs font-bold text-[#d9f99d] outline-none cursor-pointer hover:bg-[#233328] shrink-0"
        >
          {units.map((u) => (
            <option key={u.id} value={u.id} className="bg-[#121b15] text-white">
              {u.symbol}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
