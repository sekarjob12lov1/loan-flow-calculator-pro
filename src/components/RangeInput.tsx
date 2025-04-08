import React, { useState } from 'react';
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
  allowEmpty?: boolean;
}

const RangeInput = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  unit = '', 
  className = '',
  allowEmpty = true
}: RangeInputProps) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (newValue === '' && allowEmpty) {
      setInputValue('');
      onChange(0);
      return;
    }

    setInputValue(newValue);
    
    const parsedValue = parseFloat(newValue);
    if (!isNaN(parsedValue)) {
      onChange(Math.min(Math.max(parsedValue, min), max));
    }
  };

  const handleBlur = () => {
    if (inputValue === '') {
      if (allowEmpty) return;
      
      setInputValue(min.toString());
      onChange(min);
    } else {
      const parsedValue = parseFloat(inputValue);
      if (isNaN(parsedValue)) {
        setInputValue(value.toString());
      } else {
        const clampedValue = Math.min(Math.max(parsedValue, min), max);
        setInputValue(clampedValue.toString());
        onChange(clampedValue);
      }
    }
  };

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
            disabled={inputValue === ''}
          />
        </div>
        <div className="w-32 flex items-center">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="text-right"
          />
          {unit && <span className="ml-2">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default RangeInput;
