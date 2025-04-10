import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addMonths, format, isEqual, isBefore, isValid } from 'date-fns';
import RangeInput from './RangeInput';
import MonthYearPicker from './MonthYearPicker';
import RepaymentSchedule, { PaymentScheduleRow } from './RepaymentSchedule';
import { exportToExcel } from './ExcelExporter';
import PartPaymentManager, { PartPayment } from './PartPaymentManager';
import InterestRateManager, { InterestRateChange } from './InterestRateManager';
import { useAppVersion } from '@/App';
import { useTheme } from '@/hooks/use-theme';

const GoldLoanCalculator: React.FC = () => {
  const { version } = useAppVersion();
  const { theme } = useTheme();
  
  // Loan Parameters
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [tenure, setTenure] = useState<number>(0);
  const [tenureType, setTenureType] = useState<'months' | 'years'>('months');
  const [startDate, setStartDate] = useState(new Date());
  
  // Interest Rate Changes
  const [enableInterestRateChanges, setEnableInterestRateChanges] = useState(false);
  const [interestRateChanges, setInterestRateChanges] = useState<InterestRateChange[]>([]);
  
  // Part Payment Parameters
  const [enablePartPayment, setEnablePartPayment] = useState(false);
  const [partPayments, setPartPayments] = useState<PartPayment[]>([]);
  const [reduceEMI, setReduceEMI] = useState(true);
  
  // Calculated Values
  const [emi, setEmi] = useState(0);
  const [originalSchedule, setOriginalSchedule] = useState<PaymentScheduleRow[]>([]);
  const [modifiedSchedule, setModifiedSchedule] = useState<PaymentScheduleRow[]>([]);

  // Reset interest rate changes feature when switching to v1.0
  useEffect(() => {
    if (version === "v1.0" && enableInterestRateChanges) {
      setEnableInterestRateChanges(false);
      setInterestRateChanges([]);
    }
  }, [version, enableInterestRateChanges]);

  // Handle interest rate change actions
  const handleAddInterestChange = (change: InterestRateChange) => {
    setInterestRateChanges([...interestRateChanges, change]);
  };

  const handleRemoveInterestChange = (id: string) => {
    setInterestRateChanges(interestRateChanges.filter(c => c.id !== id));
  };

  const handleUpdateInterestChange = (id: string, updates: Partial<Omit<InterestRateChange, 'id'>>) => {
    setInterestRateChanges(interestRateChanges.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  // Handle part payment actions
  const handleAddPartPayment = (partPayment: PartPayment) => {
    setPartPayments([...partPayments, partPayment]);
  };

  const handleRemovePartPayment = (id: string) => {
    setPartPayments(partPayments.filter(p => p.id !== id));
  };

  const handleUpdatePartPayment = (id: string, updates: Partial<Omit<PartPayment, 'id'>>) => {
    setPartPayments(partPayments.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };
  
  // Memoize interest rate changes formatting for performance
  const formattedRateChanges = React.useMemo(() => {
    const changes: {date: Date, rate: number, reduceEMI: boolean}[] = [];
    
    if (version !== "v1.0" && enableInterestRateChanges && interestRateChanges.length > 0) {
      interestRateChanges.forEach(rc => {
        changes.push({
          date: rc.date,
          rate: rc.rate,
          reduceEMI: (version === "v3.0" || version === "v3.1" || version === "v3.2") ? rc.reduceEMI : reduceEMI
        });
      });
      
      // Sort by date
      changes.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    
    return changes;
  }, [version, enableInterestRateChanges, interestRateChanges, reduceEMI]);
  
  // Memoize part payments formatting for performance
  const formattedPartPayments = React.useMemo(() => {
    const payments: {date: Date, amount: number}[] = [];
    
    if (enablePartPayment && partPayments.length > 0) {
      partPayments.forEach(pp => {
        if (pp.isRecurring && pp.recurringCount && pp.recurringCount > 1 && pp.recurringFrequency) {
          // Add recurring payments
          for (let i = 0; i < pp.recurringCount; i++) {
            const paymentDate = addMonths(pp.date, i * pp.recurringFrequency);
            payments.push({
              date: paymentDate,
              amount: pp.amount
            });
          }
        } else {
          // Add single payment
          payments.push({
            date: pp.date,
            amount: pp.amount
          });
        }
      });
    }
    
    return payments;
  }, [enablePartPayment, partPayments]);
  
  // Calculate EMI and loan schedules whenever relevant parameters change
  useEffect(() => {
    // Skip calculation if inputs are missing in v3.0+
    if ((version === "v3.0" || version === "v3.1" || version === "v3.2") && (!loanAmount || !interestRate || !tenure)) {
      setEmi(0);
      setOriginalSchedule([]);
      setModifiedSchedule([]);
      return;
    }
    
    const actualTenure = tenureType === 'years' ? tenure * 12 : tenure;
    
    // Calculate monthly EMI
    const monthlyRate = interestRate / (12 * 100);
    const emiValue = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, actualTenure) / 
      (Math.pow(1 + monthlyRate, actualTenure) - 1);
    
    setEmi(emiValue);
    
    // Generate original repayment schedule
    const originalScheduleData = generateSchedule(
      loanAmount, 
      interestRate, 
      actualTenure, 
      emiValue, 
      startDate, 
      [], 
      []
    );
    
    setOriginalSchedule(originalScheduleData);
    
    // If part payment or interest rate changes are enabled, calculate the modified schedule
    if ((enablePartPayment && formattedPartPayments.length > 0) || 
        (version !== "v1.0" && enableInterestRateChanges && formattedRateChanges.length > 0)) {
      
      const modifiedScheduleData = generateSchedule(
        loanAmount, 
        interestRate, 
        actualTenure, 
        emiValue, 
        startDate, 
        formattedPartPayments,
        formattedRateChanges,
        reduceEMI
      );
      
      setModifiedSchedule(modifiedScheduleData);
    } else {
      setModifiedSchedule([]);
    }
  }, [
    loanAmount, 
    interestRate, 
    tenure, 
    tenureType, 
    startDate, 
    enablePartPayment, 
    formattedPartPayments,
    reduceEMI,
    enableInterestRateChanges,
    formattedRateChanges,
    version
  ]);

  // Function to generate repayment schedule
  const generateSchedule = (
    principal: number,
    rate: number,
    tenureMonths: number,
    monthlyEmi: number,
    start: Date,
    partPayments: { date: Date, amount: number }[] = [],
    rateChanges: { date: Date, rate: number, reduceEMI: boolean }[] = [],
    globalReduceEmi: boolean = true
  ): PaymentScheduleRow[] => {
    // Skip calculation if inputs are missing in v3.0+
    if (version === "v3.0" && (!principal || !rate || !tenureMonths)) {
      return [];
    }
    
    const schedule: PaymentScheduleRow[] = [];
    let remainingPrincipal = principal;
    let currentEmi = monthlyEmi;
    let remainingMonths = tenureMonths;
    let currentRate = rate;
    let monthlyRate = currentRate / (12 * 100);
    
    // Sort part payments by date
    const sortedPartPayments = [...partPayments].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    // Sort rate changes by date
    const sortedRateChanges = [...rateChanges].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    for (let month = 1; remainingPrincipal > 0; month++) {
      const currentDate = addMonths(start, month - 1);
      
      // Check if there's an interest rate change for this month
      // For v3.0, we check exact date, not just month/year
      const rateChange = version === "v3.0" 
        ? sortedRateChanges.find(rc => 
            rc.date && isValid(rc.date) &&
            rc.date.getTime() <= currentDate.getTime() && 
            !sortedRateChanges.some(other => 
              other !== rc && 
              other.date && isValid(other.date) &&
              other.date.getTime() <= currentDate.getTime() && 
              other.date.getTime() > rc.date.getTime()
            )
          )
        : sortedRateChanges.find(rc => 
            rc.date && isValid(rc.date) &&
            format(rc.date, 'yyyy-MM') === format(currentDate, 'yyyy-MM')
          );
      
      if (rateChange) {
        currentRate = rateChange.rate;
        monthlyRate = currentRate / (12 * 100);
        
        // Use per-rate change reduceEMI preference in v3.0
        const useReduceEMI = version === "v3.0" ? rateChange.reduceEMI : globalReduceEmi;
        
        // Recalculate EMI if reducing EMI or if it's the first rate change
        if (useReduceEMI && remainingPrincipal > 0) {
          currentEmi = remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) / 
            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        }
      }
      
      // Calculate interest for current month based on current rate
      const monthInterest = remainingPrincipal * monthlyRate;
      
      // Check if there's a part payment for this month
      const partPayment = sortedPartPayments.find(pp => 
        pp.date && isValid(pp.date) &&
        format(pp.date, 'yyyy-MM') === format(currentDate, 'yyyy-MM')
      );
      
      let partPaymentAmount = 0;
      if (partPayment) {
        partPaymentAmount = Math.min(partPayment.amount, remainingPrincipal);
      }
      
      // Calculate principal and interest components of EMI
      let principalPart = Math.min(currentEmi - monthInterest, remainingPrincipal);
      
      // Create a schedule entry
      const entry: PaymentScheduleRow = {
        month,
        date: currentDate,
        openingBalance: remainingPrincipal,
        emi: currentEmi,
        principal: principalPart,
        interest: monthInterest,
        closingBalance: remainingPrincipal - principalPart,
        currentRate: currentRate // Add current interest rate to the schedule
      };
      
      // Update remaining principal
      remainingPrincipal -= principalPart;
      
      // Apply part payment if any
      if (partPayment && partPaymentAmount > 0) {
        // Add part payment entry
        schedule.push({
          ...entry,
          isPartPayment: true,
          partPaymentAmount: partPaymentAmount
        });
        
        // Reduce principal by part payment amount
        remainingPrincipal -= partPaymentAmount;
        
        // Recalculate EMI or tenure based on user preference
        if (globalReduceEmi && remainingPrincipal > 0) {
          // Reduce EMI keeping the same tenure
          remainingMonths = tenureMonths - month + 1;
          currentEmi = remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) / 
            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        }
        // If not reducing EMI, we keep the same EMI but tenure will naturally reduce
      } else {
        schedule.push(entry);
      }
      
      remainingMonths--;
      if (remainingPrincipal <= 0) break;
    }
    
    return schedule;
  };
  
  // Function to handle Excel export
  const handleExportExcel = () => {
    const dataToExport = (enablePartPayment || enableInterestRateChanges) ? modifiedSchedule : originalSchedule;
    exportToExcel(dataToExport, 'gold-loan-schedule', enablePartPayment);
  };
  
  // Calculate savings for display - optimized for performance
  const savings = React.useMemo(() => {
    if (!originalSchedule.length || !modifiedSchedule.length) return 0;
    
    const originalInterest = originalSchedule.reduce((sum, row) => sum + row.interest, 0);
    const modifiedInterest = modifiedSchedule.reduce((sum, row) => sum + row.interest, 0);
    
    return originalInterest - modifiedInterest;
  }, [originalSchedule, modifiedSchedule]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gold Loan Calculator</CardTitle>
            <CardDescription>
              Calculate your gold loan interest and payment schedule
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">{version}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Loan Details</h3>
            
            <RangeInput
              label="Loan Amount (₹)"
              value={loanAmount}
              onChange={setLoanAmount}
              min={10000}
              max={(version === "v3.0" || version === "v3.1" || version === "v3.2") ? 1000000000 : 10000000}
              step={10000}
              unit="₹"
              allowEmpty={(version === "v3.0" || version === "v3.1" || version === "v3.2")}
            />
            
            <RangeInput
              label="Interest Rate (%)"
              value={interestRate}
              onChange={setInterestRate}
              min={1}
              max={30}
              step={0.1}
              unit="%"
              allowEmpty={(version === "v3.0" || version === "v3.1" || version === "v3.2")}
            />
            
            <div className="mb-4">
              <Label className="block mb-2">Tenure</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <RangeInput
                    label=""
                    value={tenure}
                    onChange={setTenure}
                    min={1}
                    max={tenureType === 'years' ? 30 : 360}
                    step={1}
                    allowEmpty={(version === "v3.0" || version === "v3.1" || version === "v3.2")}
                  />
                </div>
                <div>
                  <RadioGroup 
                    value={tenureType} 
                    onValueChange={(val) => setTenureType(val as 'months' | 'years')}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="months" id="months" />
                      <Label htmlFor="months">Months</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="years" id="years" />
                      <Label htmlFor="years">Years</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
            
            <MonthYearPicker
              label="Loan Start Date"
              selectedDate={startDate}
              onChange={setStartDate}
              allowPastDates={true}
            />
            
            {version !== "v1.0" && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Interest Rate Changes</h3>
                
                <div className="flex items-center mb-4">
                  <input 
                    type="checkbox" 
                    id="enableInterestRateChanges"
                    checked={enableInterestRateChanges}
                    onChange={(e) => {
                      setEnableInterestRateChanges(e.target.checked);
                      if (e.target.checked && interestRateChanges.length === 0) {
                        // Add a default interest rate change when enabling
                        const defaultDate = new Date(startDate);
                        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
                        handleAddInterestChange({
                          id: `rate-change-${Date.now()}`,
                          date: defaultDate,
                          rate: 0,
                          reduceEMI: true
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  <Label htmlFor="enableInterestRateChanges">Enable Interest Rate Changes</Label>
                </div>
                
                {enableInterestRateChanges && (
                  <InterestRateManager
                    interestChanges={interestRateChanges}
                    onAddChange={handleAddInterestChange}
                    onRemoveChange={handleRemoveInterestChange}
                    onUpdateChange={handleUpdateInterestChange}
                    loanStartDate={startDate}
                    baseRate={interestRate}
                  />
                )}
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Part Payment Options</h3>
              
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="enablePartPayment"
                  checked={enablePartPayment}
                  onChange={(e) => {
                    setEnablePartPayment(e.target.checked);
                    if (e.target.checked && partPayments.length === 0) {
                      // Add a default part payment when enabling
                      const defaultDate = new Date(startDate);
                      defaultDate.setMonth(defaultDate.getMonth() + 6);
                      handleAddPartPayment({
                        id: `payment-${Date.now()}`,
                        date: defaultDate,
                        amount: 0,
                        isRecurring: version !== "v1.0" ? false : false,
                        recurringCount: 1,
                        recurringFrequency: 3
                      });
                    }
                  }}
                  className="mr-2"
                />
                <Label htmlFor="enablePartPayment">Enable Part Payment</Label>
              </div>
              
              {enablePartPayment && (
                <>
                  <PartPaymentManager
                    partPayments={partPayments}
                    onAddPartPayment={handleAddPartPayment}
                    onRemovePartPayment={handleRemovePartPayment}
                    onUpdatePartPayment={handleUpdatePartPayment}
                    loanStartDate={startDate}
                    maxAmount={(version === "v3.0" || version === "v3.1" || version === "v3.2") ? loanAmount : loanAmount}
                    showRecurringOptions={version !== "v1.0"}
                  />
                  
                  <div className="mb-4 mt-4">
                    <Label className="block mb-2">After Part Payment</Label>
                    <RadioGroup 
                      value={reduceEMI ? "reduce-emi" : "reduce-tenure"} 
                      onValueChange={(val) => setReduceEMI(val === "reduce-emi")}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reduce-emi" id="reduce-emi" />
                        <Label htmlFor="reduce-emi">Reduce EMI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reduce-tenure" id="reduce-tenure" />
                        <Label htmlFor="reduce-tenure">Reduce Tenure</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-finance-light p-4 rounded-lg mb-6 border">
              <h3 className="text-lg font-medium mb-4">Loan Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-300">Loan Amount</p>
                  <p className="text-lg font-semibold">₹{loanAmount ? loanAmount.toLocaleString() : '-'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-300">Interest Rate</p>
                  <p className="text-lg font-semibold">{interestRate ? `${interestRate}% p.a.` : '-'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-300">Loan Tenure</p>
                  <p className="text-lg font-semibold">
                    {tenure ? `${tenure} ${tenureType === 'years' ? 'Years' : 'Months'}` : '-'}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-300">Monthly EMI</p>
                  <p className="text-lg font-semibold">₹{emi ? emi.toFixed(2) : '-'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-300">Start Date</p>
                  <p className="text-lg font-semibold">{format(startDate, 'MMM yyyy')}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-300">Total Interest</p>
                  <p className="text-lg font-semibold">
                    {emi && tenure ? `₹${(emi * (tenureType === 'years' ? tenure * 12 : tenure) - loanAmount).toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Tabs defaultValue="repayment">
                <TabsList className="mb-4">
                  <TabsTrigger value="repayment">Repayment Schedule</TabsTrigger>
                  <TabsTrigger value="partpayment">Savings Comparison</TabsTrigger>
                </TabsList>
                
                <TabsContent value="repayment">
                  <RepaymentSchedule
                    originalSchedule={originalSchedule}
                    modifiedSchedule={(enablePartPayment || enableInterestRateChanges) ? modifiedSchedule : undefined}
                    loanType="gold"
                    exportToExcel={handleExportExcel}
                  />
                </TabsContent>
                
                <TabsContent value="partpayment">
                  {(enablePartPayment || enableInterestRateChanges) && modifiedSchedule.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Savings Analysis</h3>
                      
                      <div className="savings-comparison-tile mb-4 animate-fade-in">
                        <div className="text-center py-2">
                          <h4 className="savings-tile-heading mb-1">TOTAL SAVINGS</h4>
                          <p className="text-2xl font-bold">₹{savings.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-finance-light p-4 rounded-lg border">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-500 dark:text-gray-300">Original EMI</p>
                            <p className="text-lg font-semibold">₹{originalSchedule[0]?.emi.toFixed(2) || '-'}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 dark:text-gray-300">Modified EMI</p>
                            <p className="text-lg font-semibold">
                              ₹{modifiedSchedule[modifiedSchedule.length - 1]?.emi.toFixed(2) || '-'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 dark:text-gray-300">Original Tenure</p>
                            <p className="text-lg font-semibold">{originalSchedule.length || '-'} months</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 dark:text-gray-300">Modified Tenure</p>
                            <p className="text-lg font-semibold">{modifiedSchedule.length || '-'} months</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 dark:text-gray-300">Total Interest (Original)</p>
                            <p className="text-lg font-semibold">
                              ₹{originalSchedule.reduce((sum, row) => sum + row.interest, 0).toFixed(2) || '-'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 dark:text-gray-300">Total Interest (Modified)</p>
                            <p className="text-lg font-semibold text-green-savings">
                              ₹{modifiedSchedule.reduce((sum, row) => sum + row.interest, 0).toFixed(2) || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        {(version === "v3.0" || version === "v3.1" || version === "v3.2") && (!loanAmount || !interestRate || !tenure) 
                          ? "Please enter loan details to see potential savings" 
                          : "Enable part payment or interest rate changes to see potential savings"}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoldLoanCalculator;
