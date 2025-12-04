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
    const [salikData, setSalikData] = useState<any[]>([]);
    const [salikFileName, setSalikFileName] = useState<string>();

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
        
        const processContractData = (workbook: XLSX.WorkBook) => {
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
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          reader.onload = (evt: any) => {
            const text = evt.target.result;
            const workbook = XLSX.read(text, { type: 'string', codepage: 65001 });
            processContractData(workbook);
          };
          reader.readAsText(file);
        } else {
          reader.onload = (evt: any) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            processContractData(workbook);
          };
          reader.readAsArrayBuffer(file);
        }
      };
    
      const handleInvygoUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setInvygoFileName(file.name);
        
        // Clear existing invygo plates when new file is uploaded
        setInvygoPlates([]);
        
        const reader = new FileReader();
        
        const processInvygoData = (jsonData: any[]) => {
          const plates = jsonData.map((row: any) =>
            (row['Plate'] || '').toString().replace(/\s/g, '').trim().toUpperCase()
          );
          setInvygoPlates(plates);
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          reader.onload = (evt: any) => {
            const text = evt.target.result;
            const workbook = XLSX.read(text, { type: 'string', codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            processInvygoData(jsonData);
          };
          reader.readAsText(file);
        } else {
          reader.onload = (evt: any) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            processInvygoData(jsonData);
          };
          reader.readAsArrayBuffer(file);
        }
      };

      const handleParkingUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setParkingFileName(file.name);
        
        // Clear existing parking data when new file is uploaded
        setParkingData([]);
        
        const reader = new FileReader();
        
        const processData = (jsonData: any[]) => {
          console.log('🚀 Processing parking data...');
          console.log('📊 Dealer bookings loaded:', dealerBookings.length);
          console.log('📋 Contracts loaded:', contracts.length);
          console.log('🎯 All parking plates:', jsonData.map(p => p.Plate_Number).slice(0, 20));
          
          // Check for C2508000D03591309 in dealer bookings
          const targetBooking = dealerBookings.find(b => b['Agreement'] === 'C2508000D03591309');
          if (targetBooking) {
            console.log('🎯 Found C2508000D03591309 in dealer bookings:', targetBooking);
            console.log('🔍 Plate field value:', targetBooking['Plate']);
            console.log('🔍 All fields:', Object.keys(targetBooking));
          } else {
            console.log('❌ C2508000D03591309 NOT found in dealer bookings');
            console.log('Available agreements:', dealerBookings.map(b => b['Agreement']).slice(0, 10));
          }
          
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
              
              // Debug logging for C2508000D03591309
              if (plateNumber && contractNoHeader) {
                const dealerBooking = dealerBookings.find((booking: any) => {
                  const bookingPlate = (booking['Plate'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
                  return bookingPlate === plateNumber;
                });
                
                // Log only plates with dealer bookings
                if (dealerBooking) {
                  console.log(`🚗 Plate ${plateNumber} -> Agreement: ${dealerBooking['Agreement']}`);
                }
                
                if (dealerBooking && dealerBooking['Agreement'] === 'C2508000D03591309') {
                  console.log(`🎯 FOUND TARGET CONTRACT C2508000D03591309!`);
                  console.log(`📋 Dealer booking:`, {
                    plate: plateNumber,
                    agreement: dealerBooking['Agreement'],
                    bookingId: dealerBooking['Booking ID'],
                    customer: dealerBooking['Customer']
                  });
                  
                  const contractByAgreement = contracts.find((c: any) => {
                    const contractNo = (c[contractNoHeader] || '').toString().trim();
                    return contractNo === 'C2508000D03591309';
                  });
                  
                  if (contractByAgreement) {
                    const customerHeader = findHeader(['Customer']);
                    console.log(`✅ Found matching contract:`, {
                      contractNo: contractByAgreement[contractNoHeader],
                      originalPlate: plateNoHeader ? contractByAgreement[plateNoHeader] : 'N/A',
                      customer: customerHeader ? contractByAgreement[customerHeader] : 'N/A'
                    });
                    console.log(`🎆 SUCCESS! Contract C2508000D03591309 matched with replacement car ${plateNumber}`);
                  } else {
                    console.log(`🚨 ERROR! Contract C2508000D03591309 not found in contracts file!`);
                    console.log('Available contracts:', contracts.map(c => contractNoHeader ? c[contractNoHeader] : 'N/A').slice(0, 10));
                  }
                }
              }
              
              if (plateNoHeader && pickupHeader && dropoffHeader && contractNoHeader) {
                // First try: Match by plate number (original logic)
                let contractsToSearch = contracts.filter((c: any) => {
                  const contractPlateValue = plateNoHeader ? (c[plateNoHeader] || '') : '';
                  const contractPlate = contractPlateValue.toString().replace(/\s/g, '').trim().toUpperCase();
                  return contractPlate === plateNumber;
                });
                
                // Second try: If no match by plate, try matching by Agreement/Contract No. for replacement cars
                if (contractsToSearch.length === 0) {
                  const dealerBooking = dealerBookings.find((booking: any) => {
                    const bookingPlate = (booking['Plate'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    return bookingPlate === plateNumber;
                  });
                  
                  if (dealerBooking && dealerBooking['Agreement']) {
                    const contractByAgreement = contracts.find((c: any) => {
                      const contractNo = (c[contractNoHeader] || '').toString().trim();
                      const agreement = dealerBooking['Agreement'].toString().trim();
                      return contractNo === agreement;
                    });
                    
                    if (contractByAgreement) {
                      contractsToSearch = [contractByAgreement];
                      
                      if (dealerBooking['Agreement'] === 'C2508000D03591309') {
                        console.log(`🎉 REPLACEMENT CAR MATCH! Plate ${plateNumber} matched to Contract C2508000D03591309`);
                      }
                    }
                  }
                }
                
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
                  
                  // Check if this is an Invygo car (either in invygo plates OR has dealer booking)
                  const dealerBooking = dealerBookings.find((booking: any) => 
                    booking['Agreement']?.toString() === contractNo?.toString()
                  );
                  
                  const isInvygoCar = invygoPlates.includes(plateNumber) || dealerBooking;
                  
                  if (isInvygoCar && dealerBooking) {
                    // For Invygo cars, get dealer booking data
                    row.Dealer_Booking_Number = dealerBooking['Booking ID'];
                    row.Customer_Name = dealerBooking['Customer'] || dealerBooking['Customer Name'] || '';
                    
                    // Build Model from Brand Name, Car Name, and Car Year
                    const brandName = dealerBooking['Brand Name'] || '';
                    const carName = dealerBooking['Car Name'] || '';
                    const carYear = dealerBooking['Car Year'] || '';
                    row.Model = [brandName, carName, carYear].filter(part => part).join(' ');
                    
                    if (contractNo === 'C2508000D03591309') {
                      console.log(`🎉 SUCCESS! Contract C2508000D03591309 matched as Invygo with replacement car ${plateNumber}`);
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
            const workbook = XLSX.read(text, { type: 'string', codepage: 65001 }); // codepage 65001 for UTF-8
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            
            processData(jsonData);
          };
          reader.readAsText(file); // Read as text, default UTF-8
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
            const workbook = XLSX.read(text, { type: 'string', codepage: 65001 }); // codepage 65001 for UTF-8
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            
            setDealerBookings(jsonData);
          };
          reader.readAsText(file); // Read as text, default UTF-8
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

    const handleSalikUpload = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setSalikFileName(file.name);
        
        setSalikData([]);
        
        const reader = new FileReader();
        
        const processData = (jsonData: any[]) => {
          const updatedData = jsonData.map((row: any) => {
            const plateNumber = (row['Plate_Number'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
            const salikDate = parseExcelDate(row['Trip_Date']);
            
            // Map the original column names to standard names for display
            row.Date = row['Trip_Date'];
            row.Time = row['Trip_Time'];
            row.Gate = row['Toll_Gate'];
            
            if (plateNumber && salikDate && contracts.length > 0) {
              const plateNoHeader = findHeader(['Plate No.', 'Plate']);
              const pickupHeader = findHeader(['Pick-up Date', 'Pickup Date']);
              const dropoffHeader = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
              const contractNoHeader = findHeader(['Contract No.']);
              
              if (plateNoHeader && pickupHeader && dropoffHeader && contractNoHeader) {
                let contractsToSearch = contracts.filter((c: any) => {
                  const contractPlateValue = plateNoHeader ? (c[plateNoHeader] || '') : '';
                  const contractPlate = contractPlateValue.toString().replace(/\s/g, '').trim().toUpperCase();
                  return contractPlate === plateNumber;
                });
                
                if (contractsToSearch.length === 0) {
                  const dealerBooking = dealerBookings.find((booking: any) => {
                    const bookingPlate = (booking['Plate'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    return bookingPlate === plateNumber;
                  });
                  
                  if (dealerBooking && dealerBooking['Agreement']) {
                    const contractByAgreement = contracts.find((c: any) => {
                      const contractNo = (c[contractNoHeader] || '').toString().trim();
                      const agreement = dealerBooking['Agreement'].toString().trim();
                      return contractNo === agreement;
                    });
                    
                    if (contractByAgreement) {
                      contractsToSearch = [contractByAgreement];
                    }
                  }
                }
                
                const matchingContracts = contractsToSearch.filter((c: any) => {
                  const pickup = parseExcelDate(c[pickupHeader]);
                  const dropoff = parseExcelDate(c[dropoffHeader]);
                  const statusHeader = findHeader(['Status']);
                  const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                  
                  if (!pickup || !salikDate) return false;
                  
                  const salikTime = salikDate.getTime();
                  const pickupTime = pickup.getTime();
                  
                  if (status === 'open' || status === 'active') {
                      return salikTime >= pickupTime;
                  }
                  
                  if (!dropoff) return false;
                  const dropoffTime = dropoff.getTime();
                  return salikTime >= pickupTime && salikTime <= dropoffTime;
                });
                
                let matchingContract = null;
                if (matchingContracts.length > 0) {
                  matchingContract = matchingContracts[0];
                }
                
                if (matchingContract) {
                  const contractNo = contractNoHeader ? matchingContract[contractNoHeader] : '';
                  row.Contract = contractNo;
                  row.Contract_Start = matchingContract[pickupHeader];
                  
                  const statusHeader = findHeader(['Status']);
                  const status = statusHeader ? matchingContract[statusHeader]?.toString().toLowerCase() : '';
                  
                  if (status === 'open' || status === 'active') {
                    row.Contract_End = 'Open';
                  } else {
                    row.Contract_End = matchingContract[dropoffHeader];
                  }
                  
                  const dealerBooking = dealerBookings.find((booking: any) => 
                    booking['Agreement']?.toString() === contractNo?.toString()
                  );
                  
                  if (dealerBooking) {
                    row.CustomerName = dealerBooking['Customer'] || dealerBooking['Customer Name'] || '';
                  } else {
                    const customerHeaderContract = findHeader(['Customer', 'Customer Name']);
                    row.CustomerName = customerHeaderContract ? (matchingContract[customerHeaderContract] || '') : '';
                  }
                } else {
                  row.Contract = '';
                  row.Contract_Start = '';
                  row.Contract_End = '';
                  row.CustomerName = '';
                }
              }
            }
            
            return row;
          });
          
          setSalikData(updatedData);
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          reader.onload = (evt: any) => {
            const text = evt.target.result;
            const workbook = XLSX.read(text, { type: 'string', codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet;
            const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
              Object.values(row).some(v => v !== null && v !== '')
            );
            
            processData(jsonData);
          };
          reader.readAsText(file);
        } else {
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

    return {
        contracts,
        parkingData,
        dealerBookings,
        salikData,
        headers,
        invygoPlates,
        contractFileName,
        invygoFileName,
        dealerFileName,
        parkingFileName,
        salikFileName,
        handleFileUpload,
        handleInvygoUpload,
        handleParkingUpload,
        handleDealerBookingUpload,
        handleSalikUpload,
        findHeader,
        setContracts,
        setParkingData,
        setSalikData,
        setInvygoPlates
    }
}
