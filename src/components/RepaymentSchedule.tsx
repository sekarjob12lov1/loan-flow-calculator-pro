
import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface PaymentScheduleRow {
  date: Date;
  month: number;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
  isPartPayment?: boolean;
  partPaymentAmount?: number;
  currentRate?: number; // Added to track interest rate changes
}

interface RepaymentScheduleProps {
  originalSchedule: PaymentScheduleRow[];
  modifiedSchedule?: PaymentScheduleRow[];
  loanType: 'gold' | 'personal';
  exportToExcel: () => void;
}

const RepaymentSchedule: React.FC<RepaymentScheduleProps> = ({
  originalSchedule,
  modifiedSchedule,
  loanType,
  exportToExcel
}) => {
  const { toast } = useToast();
  const hasModifications = modifiedSchedule && modifiedSchedule.length > 0;
  
  // Calculate interest savings if there are modifications
  const calculateSavings = () => {
    if (!hasModifications) return { totalInterest: 0, savings: 0 };
    
    const originalInterest = originalSchedule.reduce((total, row) => total + row.interest, 0);
    const modifiedInterest = modifiedSchedule!.reduce((total, row) => total + row.interest, 0);
    
    return {
      totalInterest: originalInterest,
      savings: originalInterest - modifiedInterest
    };
  };
  
  const { totalInterest, savings } = calculateSavings();
  
  // Helper function to determine if row has an interest rate change
  const hasInterestRateChange = (index: number, schedule: PaymentScheduleRow[]) => {
    if (index === 0) return false;
    return schedule[index].currentRate !== schedule[index - 1].currentRate;
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {loanType === 'gold' ? 'Gold Loan' : 'Personal Loan'} Repayment Schedule
        </h3>
        <Button 
          onClick={() => {
            exportToExcel();
            toast({
              title: "Exported successfully!",
              description: "Your repayment schedule has been exported to Excel."
            });
          }}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Export to Excel
        </Button>
      </div>

      {hasModifications && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-lg font-semibold text-green-700 mb-2">Interest Savings</h4>
          <p className="mb-2">
            Total interest without modifications: <span className="font-semibold">₹{totalInterest.toFixed(2)}</span>
          </p>
          <p className="text-green-700 font-semibold">
            Savings with modifications: ₹{savings.toFixed(2)} ({((savings / totalInterest) * 100).toFixed(2)}%)
          </p>
        </div>
      )}

      {/* Tabs if we have both schedules */}
      {hasModifications && (
        <div className="flex border-b mb-4">
          <Button variant="ghost" className="border-b-2 border-finance-primary">
            {hasModifications ? 'Modified Schedule' : 'Repayment Schedule'}
          </Button>
          {hasModifications && (
            <Button variant="ghost">
              Original Schedule
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Opening Balance</TableHead>
              <TableHead>EMI</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Closing Balance</TableHead>
              <TableHead>Rate (%)</TableHead>
              {hasModifications && <TableHead>Part Payment</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(hasModifications ? modifiedSchedule : originalSchedule).map((row, index) => (
              <TableRow 
                key={index}
                className={
                  row.isPartPayment 
                    ? "bg-blue-50" 
                    : hasInterestRateChange(index, hasModifications ? modifiedSchedule! : originalSchedule)
                    ? "bg-yellow-50"
                    : ""
                }
              >
                <TableCell>{row.month}</TableCell>
                <TableCell>{format(row.date, 'MMM yyyy')}</TableCell>
                <TableCell>₹{row.openingBalance.toFixed(2)}</TableCell>
                <TableCell>₹{row.emi.toFixed(2)}</TableCell>
                <TableCell>₹{row.principal.toFixed(2)}</TableCell>
                <TableCell>₹{row.interest.toFixed(2)}</TableCell>
                <TableCell>₹{row.closingBalance.toFixed(2)}</TableCell>
                <TableCell>{row.currentRate?.toFixed(2) || "-"}%</TableCell>
                {hasModifications && (
                  <TableCell>
                    {row.isPartPayment && row.partPaymentAmount 
                      ? `₹${row.partPaymentAmount.toFixed(2)}` 
                      : ''}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RepaymentSchedule;
