
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RangeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  className?: string;
}

const RangeInput = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  unit = '', 
  className = '' 
}: RangeInputProps) => {
  return (
    <div className={`mb-4 ${className}`}>
      <Label className="block mb-2">
        {label}
      </Label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Slider
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(vals) => onChange(vals[0])}
            className="my-2"
          />
        </div>
        <div className="w-32 flex items-center">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                onChange(Math.min(Math.max(newValue, min), max));
              }
            }}
            min={min}
            max={max}
            step={step}
            className="text-right"
          />
          {unit && <span className="ml-2">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default RangeInput;
