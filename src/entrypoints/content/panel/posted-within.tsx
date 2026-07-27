import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActions, useAppStore } from '@/store';

type Unit = 'minutes' | 'hours' | 'days';

interface UnitOption {
  value: Unit;
  label: string;
}

interface Preset {
  label: string;
  value: number;
  unit: Unit;
}

const UNIT_TO_MINUTES: Record<Unit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

const UNITS: UnitOption[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const PRESETS: Preset[] = [
  { label: '30m', value: 30, unit: 'minutes' },
  { label: '1h', value: 1, unit: 'hours' },
  { label: '3h', value: 3, unit: 'hours' },
  { label: '6h', value: 6, unit: 'hours' },
  { label: '12h', value: 12, unit: 'hours' },
];

function deriveUnit(minutes: number | null): Unit {
  if (!minutes) return 'minutes';
  if (minutes % 1440 === 0) return 'days';
  if (minutes % 60 === 0) return 'hours';
  return 'minutes';
}

function deriveInputValue(minutes: number | null, unit: Unit): string {
  if (!minutes) return '';
  return String(minutes / UNIT_TO_MINUTES[unit]);
}

export function PostedWithin() {
  const postedWithin = useAppStore((state) => state.settings.postedWithin);
  const { setPostedWithin } = useActions();

  const [unit, setUnit] = useState<Unit>(() => deriveUnit(postedWithin));
  const [inputValue, setInputValue] = useState<string>(() => {
    const initialUnit = deriveUnit(postedWithin);
    return deriveInputValue(postedWithin, initialUnit);
  });

  useEffect(() => {
    const nextUnit = deriveUnit(postedWithin);

    // Sync local draft with external Zustand state (postedWithin is the source of truth)
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setUnit(nextUnit);
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setInputValue(deriveInputValue(postedWithin, nextUnit));
  }, [postedWithin]);

  function handleApply() {
    const parsed = Number(inputValue);
    if (!inputValue || !Number.isFinite(parsed) || parsed <= 0) return;

    setPostedWithin(Math.round(parsed * UNIT_TO_MINUTES[unit]));
  }

  function handleClear() {
    setPostedWithin(null);
  }

  function handleUnitChange(value: Unit | null) {
    if (value === null) return;
    setUnit(value);
  }

  function handlePresetClick(value: number, presetUnit: Unit) {
    setPostedWithin(value * UNIT_TO_MINUTES[presetUnit]);
  }

  return (
    <Field>
      <FieldLabel className="font-normal">Posted within</FieldLabel>

      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          placeholder="e.g. 10"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />

        <Select value={unit} items={UNITS} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {UNITS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="secondary" onClick={handleApply}>
          Apply
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(({ label, value, unit }) => (
          <Button
            key={label}
            size="xs"
            variant="outline"
            pill
            onClick={() => handlePresetClick(value, unit)}
          >
            {label}
          </Button>
        ))}

        {postedWithin !== null && (
          <Button size="xs" variant="outline" pill onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </Field>
  );
}
