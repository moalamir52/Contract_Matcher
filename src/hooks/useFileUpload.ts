import { useState } from 'react';
import * as XLSX from 'xlsx';
import { parseExcelDate } from '../utils/dates';

export const useFileUpload = () => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [parkingData, setParkingData] = useState<any[]>([]);
    const [dealerBookings, setDealerBookings] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [invygoPlates, setInvygoPlates] = useState<string[]>([]);
    const [contractFileName, setContractFileName] = useState<string>();
    const [invygoFileName, setInvygoFileName] = useState<string>();
    const [dealerFileName, setDealerFileName] = useState<string>();
    const [parkingFileName, setParkingFileName] = useState<string>();

    const findHeader = (aliases: string[]): string | undefined => {
        const lowerCaseHeaders = headers.map(h => h.toLowerCase());
        for (const alias of aliases) {
          const lowerAlias = alias.toLowerCase();
          const index = lowerCaseHeaders.indexOf(lowerAlias);
          if (index !== -1) {
            return headers[index];
          }
        }
        return undefined;
      };

    const handleFileUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setContractFileName(file.name);
        
        // Clear existing data when new file is uploaded
        setContracts([]);
        setParkingData([]);
        
        const reader = new FileReader();
        reader.onload = (evt: any) => {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
          
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval:'' });
          if (rows.length > 0) {
            const headerRow = rows[0].map(h => h.toString().trim());
            setHeaders(headerRow);
    
            const jsonData = rows.slice(1).map(row => {
              const rowData: any = {};
              headerRow.forEach((header, index) => {
                rowData[header] = row[index];
              });
              return rowData;
            }).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '' && v !== undefined)
            );
            setContracts(jsonData);
          } else {
            setHeaders([]);
            setContracts([]);
          }
        };
        reader.readAsArrayBuffer(file);
      };
    
      const handleInvygoUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setInvygoFileName(file.name);
        
        // Clear existing invygo plates when new file is uploaded
        setInvygoPlates([]);
        
        const reader = new FileReader();
        reader.onload = (evt: any) => {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
          const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
            Object.values(row).some(v => v !== null && v !== '')
          );
          const plates = jsonData.map((row: any) =>
            (row['Plate'] || '').toString().replace(/\s/g, '').trim().toUpperCase()
          );
          setInvygoPlates(plates);
        };
        reader.readAsArrayBuffer(file);
      };

      const handleParkingUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setParkingFileName(file.name);
        
        // Clear existing parking data when new file is uploaded
        setParkingData([]);
        
        const reader = new FileReader();
        
        const processData = (jsonData: any[]) => {
          // Fill Contract and Dealer_Booking_Number columns
          const updatedData = jsonData.map((row: any) => {
            const plateNumber = (row['Plate_Number'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
            const parkingDate = parseExcelDate(row['Date']);
            const timeIn = row['Time_In'] ? row['Time_In'].toString() : '';
            
    
            
            if (plateNumber && parkingDate && contracts.length > 0) {
              const plateNoHeader = findHeader(['Plate No.', 'Plate']);
              const pickupHeader = findHeader(['Pick-up Date', 'Pickup Date']);
              const dropoffHeader = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
              const contractNoHeader = findHeader(['Contract No.']);
              
              if (plateNoHeader && pickupHeader && dropoffHeader && contractNoHeader) {
                // For YELO cars, always search in ALL contracts
                // For Invygo cars, search in filtered contracts if available, otherwise all contracts
                const contractsToSearch = contracts.filter((c: any) => {
                  const contractPlateValue = plateNoHeader ? (c[plateNoHeader] || '') : '';
                  const contractPlate = contractPlateValue.toString().replace(/\s/g, '').trim().toUpperCase();
                  return contractPlate === plateNumber;
                });
                
                const matchingContracts = contractsToSearch.filter((c: any) => {
                  const contractPlate = (c[plateNoHeader] || '').toString().replace(/\s/g, '').trim().toUpperCase();
                  const pickup = parseExcelDate(c[pickupHeader]);
                  const dropoff = parseExcelDate(c[dropoffHeader]);
                  const statusHeader = findHeader(['Status']);
                  const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                  
                  if (contractPlate !== plateNumber || !pickup || !parkingDate) return false;
                  
                  // Create parking datetime by combining date and time_in
                  let parkingDateTime = new Date(parkingDate);
                  if (timeIn) {
                    const timeMatch = timeIn.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                    if (timeMatch) {
                      let [, hours, minutes, period] = timeMatch;
                      let hour24 = parseInt(hours);
                      if (period) {
                        if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
                        if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
                      }
                      parkingDateTime.setHours(hour24, parseInt(minutes), 0, 0);
                    }
                  }
                  
                  const parkingTime = parkingDateTime.getTime();
                  const pickupTime = pickup.getTime();
                  
                  // If contract is open (based on Status column), check if parking time >= pickup time
                  if (status === 'open' || status === 'active') {
                      return parkingTime >= pickupTime;
                  }
                  
                  // Closed contract: check if parking time is within contract period
                  if (!dropoff) return false;
                  const dropoffTime = dropoff.getTime();
                  return parkingTime >= pickupTime && parkingTime <= dropoffTime;
                });
                
    
                
                // If multiple matches, find the best match based on contract status and time
                let matchingContract = null;
                if (matchingContracts.length > 0) {
                  if (matchingContracts.length === 1) {
                    matchingContract = matchingContracts[0];
                  } else {
                    // Multiple contracts found - prefer based on status and time
                    // Create parking datetime by combining date and time_in for comparison
                    let parkingDateTime = new Date(parkingDate);
                    if (timeIn) {
                      const timeMatch = timeIn.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                      if (timeMatch) {
                        let [, hours, minutes, period] = timeMatch;
                        let hour24 = parseInt(hours);
                        if (period) {
                          if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
                          if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
                        }
                        parkingDateTime.setHours(hour24, parseInt(minutes), 0, 0);
                      }
                    }
                    const parkingTime = parkingDateTime.getTime();
                    const statusHeader = findHeader(['Status']);
                    
                    // Separate open and closed contracts
                    const openContracts = matchingContracts.filter(c => {
                      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                      return status === 'open' || status === 'active';
                    });
                    const closedContracts = matchingContracts.filter(c => {
                      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                      return status !== 'open' && status !== 'active';
                    });
                    
                    // If there are open contracts, prefer the most recent one
                    if (openContracts.length > 0) {
                      matchingContract = openContracts.reduce((best, current) => {
                        const bestPickup = parseExcelDate(best[pickupHeader])?.getTime() || 0;
                        const currentPickup = parseExcelDate(current[pickupHeader])?.getTime() || 0;
                        return currentPickup > bestPickup ? current : best;
                      });
                    } else {
                      // Only closed contracts - choose the most recent one
                      matchingContract = closedContracts.reduce((best, current) => {
                        const bestPickup = parseExcelDate(best[pickupHeader])?.getTime() || 0;
                        const currentPickup = parseExcelDate(current[pickupHeader])?.getTime() || 0;
                        return currentPickup > bestPickup ? current : best;
                      });
                    }
                  }
                }
    
                
                
                if (matchingContract) {
                  // Get contract number
                  const contractNo = contractNoHeader ? matchingContract[contractNoHeader] : '';
                  row.Contract = contractNo;
                  
    
                  
                  // Add contract start and end dates for display
                  row.Contract_Start = matchingContract[pickupHeader];
                  const statusHeader = findHeader(['Status']);
                  const status = statusHeader ? matchingContract[statusHeader]?.toString().toLowerCase() : '';
                  
                  if (status === 'open' || status === 'active') {
                    row.Contract_End = 'Open';
                  } else {
                    row.Contract_End = matchingContract[dropoffHeader];
                  }
                  
                  // For Invygo cars, get dealer booking data
                  if (invygoPlates.includes(plateNumber)) {
                    const dealerBooking = dealerBookings.find((booking: any) => 
                      booking['Agreement']?.toString() === contractNo?.toString()
                    );
                    
                    if (dealerBooking) {
                      row.Dealer_Booking_Number = dealerBooking['Booking ID'];
                      row.Customer_Name = dealerBooking['Customer'] || dealerBooking['Customer Name'] || '';
                      
                      // Build Model from Brand Name, Car Name, and Car Year
                      const brandName = dealerBooking['Brand Name'] || '';
                      const carName = dealerBooking['Car Name'] || '';
                      const carYear = dealerBooking['Car Year'] || '';
                      row.Model = [brandName, carName, carYear].filter(part => part).join(' ');
                    }
                  } else { // For YELO cars, get contract data directly
                    const bookingNumberHeader = findHeader(['Booking Number', 'Booking No', 'Booking ID']);
                    const customerHeaderContract = findHeader(['Customer', 'Customer Name']);
                    const pickupBranchHeader = findHeader(['Pick-up Branch', 'Pickup Branch', 'Branch']);
                    const modelHeaderContract = findHeader(['Model', 'Car Model', 'Vehicle Model']);
                    
                    row.Booking_Number = bookingNumberHeader ? (matchingContract[bookingNumberHeader] || '') : '';
                    row.Customer_Contract = customerHeaderContract ? (matchingContract[customerHeaderContract] || '') : '';
                    row.Pickup_Branch = pickupBranchHeader ? (matchingContract[pickupBranchHeader] || '') : '';
                    row.Model_Contract = modelHeaderContract ? (matchingContract[modelHeaderContract] || '') : '';
                  }
                } else { // No matching contract found - set empty values
    
                  row.Contract = '';
                  row.Contract_Start = '';
                  row.Contract_End = '';
                  row.Booking_Number = '';
                  row.Customer_Contract = '';
                  row.Pickup_Branch = '';
                  row.Model_Contract = '';
                  row.Dealer_Booking_Number = '';
                  row.Customer_Name = '';
                  row.Model = '';
                }
              } else { // Headers not found - set empty values
    
                row.Contract = '';
                row.Contract_Start = '';
                row.Contract_End = '';
                row.Booking_Number = '';
                row.Customer_Contract = '';
                row.Pickup_Branch = '';
                row.Model_Contract = '';
                row.Dealer_Booking_Number = '';
                row.Customer_Name = '';
                row.Model = '';
              }
            } else { // No contracts loaded or invalid data - set empty values
    
              row.Contract = '';
              row.Contract_Start = '';
              row.Contract_End = '';
              row.Booking_Number = '';
              row.Customer_Contract = '';
              row.Pickup_Branch = '';
              row.Model_Contract = '';
              row.Dealer_Booking_Number = '';
              row.Customer_Name = '';
              row.Model = '';
            }
            
            return row;
          });
          
          setParkingData(updatedData);
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          reader.onload = (evt: any) => {
            const text = evt.target.result;
            const lines = text.split('\n').filter((line: string) => line.trim());
            if (lines.length === 0) return;
            
            const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
            const jsonData = lines.slice(1).map((line: string) => {
              const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header: string, index: number) => {
                row[header] = values[index] || '';
              });
              return row;
            }).filter((row: any) => Object.values(row).some(v => v !== null && v !== ''));
            
            processData(jsonData);
          };
          reader.readAsText(file);
        } else { // XLSX
          reader.onload = (evt: any) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            
            processData(jsonData);
          };
          reader.readAsArrayBuffer(file);
        }
      };
    
      const handleDealerBookingUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setDealerFileName(file.name);
        
        // Clear existing dealer bookings when new file is uploaded
        setDealerBookings([]);
        
        const reader = new FileReader();
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          reader.onload = (evt: any) => {
            const text = evt.target.result;
            const lines = text.split('\n').filter((line: string) => line.trim());
            if (lines.length === 0) return;
            
            const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
            const jsonData = lines.slice(1).map((line: string) => {
              const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header: string, index: number) => {
                row[header] = values[index] || '';
              });
              return row;
            }).filter((row: any) => Object.values(row).some(v => v !== null && v !== ''));
            
            setDealerBookings(jsonData);
          };
          reader.readAsText(file);
        } else { // XLSX
          reader.onload = (evt: any) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            setDealerBookings(jsonData);
          };
          reader.readAsArrayBuffer(file);
        }
      };

    return {
        contracts,
        parkingData,
        dealerBookings,
        headers,
        invygoPlates,
        contractFileName,
        invygoFileName,
        dealerFileName,
        parkingFileName,
        handleFileUpload,
        handleInvygoUpload,
        handleParkingUpload,
        handleDealerBookingUpload,
        findHeader,
        setContracts,
        setParkingData,
        setInvygoPlates
    }
}
