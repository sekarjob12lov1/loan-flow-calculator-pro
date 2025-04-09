
import React from 'react';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MonthYearPicker from './MonthYearPicker';
import { Label } from '@/components/ui/label';
import { useAppVersion } from '@/App';

export interface InterestRateChange {
  id: string;
  date: Date;
  rate: number;
}

interface InterestRateManagerProps {
  interestChanges: InterestRateChange[];
  onAddChange: (change: InterestRateChange) => void;
  onRemoveChange: (id: string) => void;
  onUpdateChange: (id: string, updates: Partial<Omit<InterestRateChange, 'id'>>) => void;
  loanStartDate: Date;
  baseRate: number;
}

const InterestRateManager: React.FC<InterestRateManagerProps> = ({
  interestChanges,
  onAddChange,
  onRemoveChange,
  onUpdateChange,
  loanStartDate,
  baseRate
}) => {
  const { version } = useAppVersion();
  
  // Only show this component if version is v2.0
  if (version !== "v2.0") {
    return null;
  }

  const handleAddChange = () => {
    // Calculate a default date 1 year after loan start or after the last change
    let defaultDate = new Date(loanStartDate);
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    
    if (interestChanges.length > 0) {
      const lastChangeDate = new Date(Math.max(...interestChanges.map(c => c.date.getTime())));
      lastChangeDate.setFullYear(lastChangeDate.getFullYear() + 1);
      defaultDate = lastChangeDate;
    }
    
    onAddChange({
      id: `rate-change-${Date.now()}`,
      date: defaultDate,
      rate: baseRate + 0.5
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Interest Rate Changes</h4>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleAddChange}
        >
          Add Rate Change
        </Button>
      </div>

      {interestChanges.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No interest rate changes scheduled.</p>
      )}

      {interestChanges.map((change) => (
        <div key={change.id} className="grid grid-cols-[1fr_1.5fr_auto] gap-3 items-end border p-3 rounded-md">
          <div>
            <Label className="block mb-2" htmlFor={`rate-${change.id}`}>New Rate (%)</Label>
            <Input
              id={`rate-${change.id}`}
              type="number"
              value={change.rate}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  onUpdateChange(change.id, {
                    rate: Math.min(Math.max(value, 1), 30)
                  });
                }
              }}
              min={1}
              max={30}
              step={0.1}
            />
          </div>
          
          <MonthYearPicker
            label="Effective From"
            selectedDate={change.date}
            onChange={(date) => onUpdateChange(change.id, { date })}
            startDate={addMonths(loanStartDate, 1)}
            allowPastDates={false}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 mt-1"
            onClick={() => onRemoveChange(change.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default InterestRateManager;
