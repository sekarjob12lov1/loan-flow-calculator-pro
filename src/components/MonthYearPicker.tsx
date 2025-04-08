
import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MonthYearPickerProps {
  label: string;
  selectedDate: Date;
  onChange: (date: Date) => void;
  startDate?: Date;
  endDate?: Date;
  className?: string;
  allowPastDates?: boolean;
}

const MonthYearPicker = ({ 
  label, 
  selectedDate, 
  onChange, 
  startDate = new Date(), 
  endDate,
  className = '',
  allowPastDates = false
}: MonthYearPickerProps) => {
  // If no end date specified, default to 30 years from start date
  const actualEndDate = endDate || addMonths(startDate, 360);
  
  // Generate array of months between start and end date
  const generateMonthOptions = () => {
    const options = [];
    // If past dates are allowed, go back 10 years from today
    const actualStartDate = allowPastDates ? subMonths(new Date(), 120) : startDate;
    let currentDate = new Date(actualStartDate);
    
    while (currentDate <= actualEndDate) {
      options.push({
        value: format(currentDate, 'yyyy-MM'),
        label: format(currentDate, 'MMM yyyy')
      });
      currentDate = addMonths(currentDate, 1);
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();
  const selectedValue = format(selectedDate, 'yyyy-MM');

  return (
    <div className={`mb-4 ${className}`}>
      <Label className="block mb-2">
        {label}
      </Label>
      <Select 
        value={selectedValue} 
        onValueChange={(value) => {
          const [year, month] = value.split('-').map(Number);
          const newDate = new Date(year, month - 1, 1);
          onChange(newDate);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select month and year" />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthYearPicker;
