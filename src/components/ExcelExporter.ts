
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface ExportRow {
  month: number;
  date: Date;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
  isPartPayment?: boolean;
  partPaymentAmount?: number;
}

export const exportToExcel = (
  data: ExportRow[],
  fileName: string = 'loan-schedule',
  includePartPayment: boolean = false
) => {
  // Transform data for Excel export
  const excelData = data.map(row => ({
    'Month': row.month,
    'Payment Date': format(row.date, 'MMM yyyy'),
    'Opening Balance': row.openingBalance.toFixed(2),
    'EMI': row.emi.toFixed(2),
    'Principal': row.principal.toFixed(2),
    'Interest': row.interest.toFixed(2),
    'Closing Balance': row.closingBalance.toFixed(2),
    ...(includePartPayment && { 'Part Payment': row.isPartPayment && row.partPaymentAmount ? row.partPaymentAmount.toFixed(2) : '' })
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const colWidths = [
    { wch: 6 },  // Month
    { wch: 12 }, // Payment Date
    { wch: 15 }, // Opening Balance
    { wch: 10 }, // EMI
    { wch: 10 }, // Principal
    { wch: 10 }, // Interest
    { wch: 15 }, // Closing Balance
    { wch: 12 }  // Part Payment (if included)
  ];
  
  ws['!cols'] = colWidths;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Loan Schedule');
  
  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data_blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  // Use current date in filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  saveAs(data_blob, `${fileName}-${dateStr}.xlsx`);
};
