
import React, { useState, useEffect } from 'react';
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
  allowDecimal?: boolean;
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
  allowEmpty = true,
  allowDecimal = true
}: RangeInputProps) => {
  const [inputValue, setInputValue] = useState<string>(value ? value.toString() : '');

  useEffect(() => {
    setInputValue(value ? value.toString() : '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (newValue === '' && allowEmpty) {
      setInputValue('');
      onChange(0);
      return;
    }

    // Allow decimal input or restrict to integers based on allowDecimal prop
    // This regex checks if the input is a valid number pattern (allows decimal points if allowDecimal is true)
    const validNumberPattern = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    
    if (validNumberPattern.test(newValue) || newValue === '') {
      setInputValue(newValue);
      
      const parsedValue = parseFloat(newValue);
      if (!isNaN(parsedValue)) {
        onChange(parsedValue);
      }
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
        setInputValue(value ? value.toString() : '');
      } else {
        // Only clamp values on blur
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
          <div className="flex items-center">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="text-right"
              inputMode={allowDecimal ? "decimal" : "numeric"}
              step={step}
            />
            {unit && <span className="ml-2">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeInput;
