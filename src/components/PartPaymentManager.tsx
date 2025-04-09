
import React, { useState } from 'react';
import { format, isAfter, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MonthYearPicker from './MonthYearPicker';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface PartPayment {
  id: string;
  date: Date;
  amount: number;
  isRecurring?: boolean;
  recurringCount?: number;
  recurringFrequency?: number; // in months
}

interface PartPaymentManagerProps {
  partPayments: PartPayment[];
  onAddPartPayment: (partPayment: PartPayment) => void;
  onRemovePartPayment: (id: string) => void;
  onUpdatePartPayment: (id: string, updates: Partial<Omit<PartPayment, 'id'>>) => void;
  loanStartDate: Date;
  maxAmount?: number;
  showRecurringOptions?: boolean;
}

const PartPaymentManager: React.FC<PartPaymentManagerProps> = ({
  partPayments,
  onAddPartPayment,
  onRemovePartPayment,
  onUpdatePartPayment,
  loanStartDate,
  maxAmount = 1000000,
  showRecurringOptions = true
}) => {
  const [paymentMode, setPaymentMode] = useState<"single" | "recurring">("single");

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
      amount: 10000,
      isRecurring: false,
      recurringCount: 1,
      recurringFrequency: 3
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

      {showRecurringOptions && (
        <div className="mb-4">
          <Label className="block mb-2">Payment Mode</Label>
          <ToggleGroup type="single" value={paymentMode} onValueChange={(value) => value && setPaymentMode(value as "single" | "recurring")}>
            <ToggleGroupItem value="single">Single Date</ToggleGroupItem>
            <ToggleGroupItem value="recurring">Recurring</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {partPayments.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No part payments scheduled.</p>
      )}

      {partPayments.map((payment, index) => (
        <div key={payment.id} className="border p-3 rounded-md space-y-3">
          <div className="grid grid-cols-[1fr_1.5fr_auto] gap-3 items-end">
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
            
            {(!showRecurringOptions || paymentMode === "single") ? (
              <MonthYearPicker
                label="Payment Date"
                selectedDate={payment.date}
                onChange={(date) => onUpdatePartPayment(payment.id, { 
                  date,
                  isRecurring: false,
                  recurringCount: 1
                })}
                startDate={loanStartDate}
                allowPastDates={true}
              />
            ) : (
              <div>
                <Label className="block mb-2" htmlFor={`recurring-${payment.id}`}>Number of Payments</Label>
                <div className="flex gap-2">
                  <Input
                    id={`recurring-${payment.id}`}
                    type="number"
                    value={payment.recurringCount || 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        onUpdatePartPayment(payment.id, {
                          isRecurring: true,
                          recurringCount: Math.min(Math.max(value, 1), 24)
                        });
                      }
                    }}
                    min={1}
                    max={24}
                  />
                </div>
              </div>
            )}
            
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

          {showRecurringOptions && paymentMode === "recurring" && (
            <div className="grid grid-cols-2 gap-3">
              <MonthYearPicker
                label="First Payment Date"
                selectedDate={payment.date}
                onChange={(date) => onUpdatePartPayment(payment.id, { date })}
                startDate={loanStartDate}
                allowPastDates={true}
              />
              
              <div>
                <Label className="block mb-2">Frequency (months)</Label>
                <Select
                  value={String(payment.recurringFrequency || 3)}
                  onValueChange={(value) => {
                    onUpdatePartPayment(payment.id, {
                      recurringFrequency: parseInt(value)
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monthly</SelectItem>
                    <SelectItem value="3">Quarterly</SelectItem>
                    <SelectItem value="6">Semi-Annually</SelectItem>
                    <SelectItem value="12">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PartPaymentManager;
