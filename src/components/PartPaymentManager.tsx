
import React from 'react';
import { format, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MonthYearPicker from './MonthYearPicker';
import { Label } from '@/components/ui/label';

export interface PartPayment {
  id: string;
  date: Date;
  amount: number;
}

interface PartPaymentManagerProps {
  partPayments: PartPayment[];
  onAddPartPayment: (partPayment: PartPayment) => void;
  onRemovePartPayment: (id: string) => void;
  onUpdatePartPayment: (id: string, updates: Partial<Omit<PartPayment, 'id'>>) => void;
  loanStartDate: Date;
  maxAmount?: number;
}

const PartPaymentManager: React.FC<PartPaymentManagerProps> = ({
  partPayments,
  onAddPartPayment,
  onRemovePartPayment,
  onUpdatePartPayment,
  loanStartDate,
  maxAmount = 1000000
}) => {
  const handleAddPartPayment = () => {
    // Calculate a default date 6 months after loan start or after the last payment
    let defaultDate = new Date(loanStartDate);
    defaultDate.setMonth(defaultDate.getMonth() + 6);
    
    if (partPayments.length > 0) {
      const lastPaymentDate = new Date(Math.max(...partPayments.map(p => p.date.getTime())));
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 3);
      
      if (isAfter(lastPaymentDate, defaultDate)) {
        defaultDate = lastPaymentDate;
      }
    }
    
    onAddPartPayment({
      id: `payment-${Date.now()}`,
      date: defaultDate,
      amount: 10000
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Part Payments</h4>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleAddPartPayment}
        >
          Add Part Payment
        </Button>
      </div>

      {partPayments.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No part payments scheduled.</p>
      )}

      {partPayments.map((payment, index) => (
        <div key={payment.id} className="grid grid-cols-[1fr_1.5fr_auto] gap-3 items-end border p-3 rounded-md">
          <div>
            <Label className="block mb-2" htmlFor={`amount-${payment.id}`}>Amount (₹)</Label>
            <Input
              id={`amount-${payment.id}`}
              type="number"
              value={payment.amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  onUpdatePartPayment(payment.id, {
                    amount: Math.min(Math.max(value, 1000), maxAmount)
                  });
                }
              }}
              min={1000}
              max={maxAmount}
            />
          </div>
          
          <MonthYearPicker
            label="Payment Date"
            selectedDate={payment.date}
            onChange={(date) => onUpdatePartPayment(payment.id, { date })}
            startDate={loanStartDate}
            allowPastDates={true}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 mt-1"
            onClick={() => onRemovePartPayment(payment.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PartPaymentManager;
