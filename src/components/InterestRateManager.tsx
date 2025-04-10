
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppVersion } from '@/App';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export interface InterestRateChange {
  id: string;
  date: Date;
  rate: number;
  reduceEMI: boolean;
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
  
  // Only show this component if version is v2.0+
  if (version === "v1.0") {
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
      rate: baseRate + 0.5,
      reduceEMI: true
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
        <div key={change.id} className="grid grid-cols-1 gap-3 items-end border p-3 rounded-md">
          <div className="grid grid-cols-[1fr_1.5fr_auto] gap-3 items-end">
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
            
            <div>
              <Label className="block mb-2">Effective From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(change.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={change.date}
                    onSelect={(date) => date && onUpdateChange(change.id, { date })}
                    disabled={(date) => date < loanStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
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
          
          {version === "v3.0" && (
            <div className="mt-2">
              <Label className="block mb-2">After Rate Change</Label>
              <RadioGroup 
                value={change.reduceEMI ? "reduce-emi" : "reduce-tenure"} 
                onValueChange={(val) => onUpdateChange(change.id, { reduceEMI: val === "reduce-emi" })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reduce-emi" id={`reduce-emi-${change.id}`} />
                  <Label htmlFor={`reduce-emi-${change.id}`}>Reduce EMI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reduce-tenure" id={`reduce-tenure-${change.id}`} />
                  <Label htmlFor={`reduce-tenure-${change.id}`}>Reduce Tenure</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InterestRateManager;
