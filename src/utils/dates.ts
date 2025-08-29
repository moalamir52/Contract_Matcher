
import * as XLSX from 'xlsx';

export function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'number') {
    // Use XLSX built-in date parsing which handles timezone correctly
    const excelDate = XLSX.SSF.parse_date_code(value);

    return excelDate ? new Date(excelDate.y, excelDate.m - 1, excelDate.d, excelDate.H || 0, excelDate.M || 0, excelDate.S || 0) : null;
  }
  if (typeof value === 'string') {
    // Check if string contains both date and time with AM/PM (DD/MM/YYYY HH:MM AM/PM)
    const dateTimeAmPmMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (dateTimeAmPmMatch) {
      const [, day, month, year, hour, minute, period] = dateTimeAmPmMatch;
      let hour24 = parseInt(hour);
      if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
      if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute));
    }
    
    // Check if string contains both date and time (DD/MM/YYYY HH:MM)
    const dateTimeMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    if (dateTimeMatch) {
      const [, day, month, year, hour, minute] = dateTimeMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    
    // Check if string contains only date (DD/MM/YYYY)
    const dateMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function formatDate(value: any): string {
  const date = parseExcelDate(value);
  if (!date) return value;
  // Format as DD/MM/YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: any): string {
  const date = parseExcelDate(value);
  if (!date) return value;
  // Format date and time
  const dateStr = date.toLocaleDateString('en-GB');
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} ${timeStr}`;
}

export function formatTimeOnly(timeValue: any): string {
  if (!timeValue) return '';
  
  // If it's already in HH:mm format, return as is
  if (typeof timeValue === 'string' && /^\d{1,2}:\d{2}$/.test(timeValue)) {
    const [hours, minutes] = timeValue.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // If it's a time string like "2:30 PM" or "14:30"
  if (typeof timeValue === 'string') {
    const time = timeValue.toLowerCase().trim();
    
    // Handle AM/PM format
    if (time.includes('am') || time.includes('pm')) {
      const [timePart, period] = time.split(/\s+/);
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
    }
    
    // Handle 24-hour format
    const match = time.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const [, hours, minutes] = match;
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
  }
  
  return timeValue.toString();
}

export function isDateInRange(dateValue: any, startDate: string, endDate: string): boolean {
  if (!startDate || !endDate || !dateValue) return true;
  
  const date = parseExcelDate(dateValue);
  if (!date) return true;
  
  const startParts = startDate.split('-');
  const start = new Date(Date.UTC(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2])));
  
  const endParts = endDate.split('-');
  const end = new Date(Date.UTC(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]), 23, 59, 59, 999));
  
  return date >= start && date <= end;
}
