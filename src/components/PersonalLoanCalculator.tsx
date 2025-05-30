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

const PersonalLoanCalculator: React.FC = () => {
  const { version } = useAppVersion();
  
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
  const [reduceEMI, setReduceEMI] = useState(false);
  
  // Calculated Values
  const [emi, setEmi] = useState(0);
  const [originalSchedule, setOriginalSchedule] = useState<PaymentScheduleRow[]>([]);
  const [modifiedSchedule, setModifiedSchedule] = useState<PaymentScheduleRow[]>([]);
  
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
  
  // Calculate EMI and loan schedules whenever relevant parameters change
  useEffect(() => {
    // Skip calculation if inputs are missing in v3.0+
    if ((version === "v3.0" || version === "v3.1") && (!loanAmount || !interestRate || !tenure)) {
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
    
    // Prepare formatted part payments including recurring ones
    const formattedPartPayments: {date: Date, amount: number}[] = [];
    
    if (enablePartPayment && partPayments.length > 0) {
      partPayments.forEach(pp => {
        if (pp.isRecurring && pp.recurringCount && pp.recurringCount > 1 && pp.recurringFrequency) {
          // Add recurring payments
          for (let i = 0; i < pp.recurringCount; i++) {
            const paymentDate = addMonths(pp.date, i * pp.recurringFrequency);
            formattedPartPayments.push({
              date: paymentDate,
              amount: pp.amount
            });
          }
        } else {
          // Add single payment
          formattedPartPayments.push({
            date: pp.date,
            amount: pp.amount
          });
        }
      });
    }
    
    // Format interest rate changes
    const formattedRateChanges: {date: Date, rate: number, reduceEMI: boolean}[] = [];
    
    if (enableInterestRateChanges && interestRateChanges.length > 0) {
      interestRateChanges.forEach(rc => {
        formattedRateChanges.push({
          date: rc.date,
          rate: rc.rate,
          reduceEMI: version === "v3.0" ? rc.reduceEMI : reduceEMI
        });
      });
      
      // Sort by date
      formattedRateChanges.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    
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
        (enableInterestRateChanges && formattedRateChanges.length > 0)) {
      
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
    partPayments,
    reduceEMI,
    enableInterestRateChanges,
    interestRateChanges,
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
    
    // Validate start date
    if (!start || !isValid(start)) {
      console.error("Invalid start date provided:", start);
      return [];
    }
    
    const schedule: PaymentScheduleRow[] = [];
    let remainingPrincipal = principal;
    let currentEmi = monthlyEmi;
    let remainingMonths = tenureMonths;
    let currentRate = rate;
    let monthlyRate = currentRate / (12 * 100);
    
    // Filter out invalid dates from part payments and rate changes
    const validPartPayments = partPayments.filter(pp => pp && pp.date && isValid(pp.date));
    const validRateChanges = rateChanges.filter(rc => rc && rc.date && isValid(rc.date));
    
    // Sort part payments by date
    const sortedPartPayments = [...validPartPayments].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    // Sort rate changes by date
    const sortedRateChanges = [...validRateChanges].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    try {
      for (let month = 1; remainingPrincipal > 0; month++) {
        const currentDate = addMonths(start, month - 1);
        if (!isValid(currentDate)) {
          console.error("Generated invalid date for month:", month);
          continue;
        }
        
        // Format current date for comparison - wrapped in try/catch
        let currentDateFormatted;
        try {
          currentDateFormatted = format(currentDate, 'yyyy-MM');
        } catch (error) {
          console.error("Error formatting date:", error);
          continue;
        }
        
        // Check if there's an interest rate change for this month
        // For v3.0, we check exact date, not just month/year
        let rateChange = null;
        
        if (version === "v3.0") {
          for (const rc of sortedRateChanges) {
            if (!rc.date || !isValid(rc.date)) continue;
            
            // Check if this is the most recent rate change before or on currentDate
            if (rc.date.getTime() <= currentDate.getTime()) {
              // See if there's another rate change that's more recent but still before currentDate
              const moreRecentExists = sortedRateChanges.some(other => 
                other !== rc && 
                other.date && 
                isValid(other.date) &&
                other.date.getTime() <= currentDate.getTime() && 
                other.date.getTime() > rc.date.getTime()
              );
              
              if (!moreRecentExists) {
                rateChange = rc;
                break;
              }
            }
          }
        } else {
          // For other versions, match by month-year
          rateChange = sortedRateChanges.find(rc => {
            if (!rc.date || !isValid(rc.date)) return false;
            
            try {
              const rcFormatted = format(rc.date, 'yyyy-MM');
              return rcFormatted === currentDateFormatted;
            } catch (error) {
              console.error("Error comparing dates:", error);
              return false;
            }
          });
        }
        
        if (rateChange) {
          currentRate = rateChange.rate;
          monthlyRate = currentRate / (12 * 100);
          
          // Use per-rate change reduceEMI preference in v3.0
          const useReduceEMI = version === "v3.0" ? rateChange.reduceEMI : globalReduceEmi;
          
          // Recalculate EMI if reducing EMI and there's remaining principal
          if (useReduceEMI && remainingPrincipal > 0) {
            currentEmi = remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) / 
              (Math.pow(1 + monthlyRate, remainingMonths) - 1);
          }
        }
        
        // Calculate interest for current month based on current rate
        const monthInterest = remainingPrincipal * monthlyRate;
        
        // Check if there's a part payment for this month
        let partPayment = null;
        
        try {
          partPayment = sortedPartPayments.find(pp => {
            if (!pp.date || !isValid(pp.date)) return false;
            
            try {
              const ppFormatted = format(pp.date, 'yyyy-MM');
              return ppFormatted === currentDateFormatted;
            } catch (error) {
              console.error("Error comparing part payment dates:", error);
              return false;
            }
          });
        } catch (error) {
          console.error("Error finding part payment:", error);
        }
        
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
        
        // Safety check: prevent infinite loops
        if (month > 1000) {
          console.error("Schedule calculation exceeded 1000 months, stopping");
          break;
        }
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
    }
    
    return schedule;
  };
  
  // Function to handle Excel export
  const handleExportExcel = () => {
    const dataToExport = (enablePartPayment || enableInterestRateChanges) ? modifiedSchedule : originalSchedule;
    exportToExcel(dataToExport, 'personal-loan-schedule', enablePartPayment);
  };
  
  // Calculate savings for performance optimization
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
            <CardTitle>Personal Loan Calculator</CardTitle>
            <CardDescription>
              Calculate your personal loan EMI and payment schedule
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
              min={50000}
              max={(version === "v3.0" || version === "v3.1") ? 1000000000 : 5000000}
              step={10000}
              unit="₹"
              allowEmpty={(version === "v3.0" || version === "v3.1")}
            />
            
            <RangeInput
              label="Interest Rate (%)"
              value={interestRate}
              onChange={setInterestRate}
              min={5}
              max={30}
              step={0.1}
              unit="%"
              allowEmpty={(version === "v3.0" || version === "v3.1")}
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
                    allowEmpty={(version === "v3.0" || version === "v3.1")}
                  />
                </div>
                <div>
                  <RadioGroup 
                    value={tenureType} 
                    onValueChange={(val) => setTenureType(val as 'months' | 'years')}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="months" id="p-months" />
                      <Label htmlFor="p-months">Months</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="years" id="p-years" />
                      <Label htmlFor="p-years">Years</Label>
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
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Interest Rate Changes</h3>
              
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="p-enableInterestRateChanges"
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
                <Label htmlFor="p-enableInterestRateChanges">Enable Interest Rate Changes</Label>
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
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Part Payment Options</h3>
              
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="p-enablePartPayment"
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
                        isRecurring: false,
                        recurringCount: 1,
                        recurringFrequency: 3
                      });
                    }
                  }}
                  className="mr-2"
                />
                <Label htmlFor="p-enablePartPayment">Enable Part Payment</Label>
              </div>
              
              {enablePartPayment && (
                <>
                  <PartPaymentManager
                    partPayments={partPayments}
                    onAddPartPayment={handleAddPartPayment}
                    onRemovePartPayment={handleRemovePartPayment}
                    onUpdatePartPayment={handleUpdatePartPayment}
                    loanStartDate={startDate}
                    maxAmount={(version === "v3.0" || version === "v3.1") ? loanAmount : loanAmount / 2}
                  />
                  
                  <div className="mb-4 mt-4">
                    <Label className="block mb-2">After Part Payment</Label>
                    <RadioGroup 
                      value={reduceEMI ? "reduce-emi" : "reduce-tenure"} 
                      onValueChange={(val) => setReduceEMI(val === "reduce-emi")}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reduce-emi" id="p-reduce-emi" />
                        <Label htmlFor="p-reduce-emi">Reduce EMI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reduce-tenure" id="p-reduce-tenure" />
                        <Label htmlFor="p-reduce-tenure">Reduce Tenure</Label>
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
                    loanType="personal"
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
                        {(version === "v3.0" || version === "v3.1") && (!loanAmount || !interestRate || !tenure) 
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

export default PersonalLoanCalculator;
