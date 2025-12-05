import React, { useState, useEffect, useRef } from 'react';
import { useFileUpload } from './hooks/useFileUpload';
import { parseExcelDate, formatDate, formatDateTime } from './utils/dates';
import FileUploadButton from './components/FileUploadButton';
import ContractsTable from './components/ContractsTable';
import UnrentedTable from './components/UnrentedTable';
import RepeatedTable from './components/RepeatedTable';
import ParkingTable from './components/ParkingTable';
import SalikTable from './components/SalikTable';
import SalikSummaryTable from './components/SalikSummaryTable';
import TemplateDialog from './components/TemplateDialog';
import ParkingDialog from './components/ParkingDialog';
import SalikDialog from './components/SalikDialog';
import ExportDialog from './components/ExportDialog';
import CopyDialog from './components/CopyDialog';
import ContractDetailsModal from './components/ContractDetailsModal';

export default function App() {
  const { 
    contracts,
    parkingData,
    dealerBookings,
    salikData,
    invygoPlates,
    revenueData,
    contractFileName,
    invygoFileName,
    dealerFileName,
    parkingFileName,
    salikFileName,
    revenueFileName,
    handleFileUpload,
    handleInvygoUpload,
    handleParkingUpload,
    handleDealerBookingUpload,
    handleSalikUpload,
    handleRevenueUpload,
    findHeader,
    setContracts,
    setParkingData,
    setSalikData,
    setInvygoPlates
  } = useFileUpload();

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const templateHeaders = {
    contracts: [
      'Contract No.', 'Customer', 'Plate No.', 'Pick-up Date', 'Drop-off Date', 'Status'
    ],
    invygo: [
      'Plate'
    ],
    dealer: [
      'Agreement', 'Booking ID', 'Customer', 'Brand Name', 'Car Name', 'Car Year', 'Plate'
    ],
    parking: [
      'Date', 'Time', 'Plate_Number', 'Description', 'Amount', 'Time_In', 'Time_Out'
    ],
    salik: [
      'Trip_Date', 'Trip_Time', 'Dealer_Booking_Number', 'Plate_Number', 'Toll_Gate', 'Direction', 'Amount', 'Tax_Invoice_No'
    ],
    revenue: [
      'Contract No.', 'Revenue Date', 'Plate Number'
    ]
  };
  const downloadTemplate = (type: keyof typeof templateHeaders) => {
    const headers = templateHeaders[type];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowTemplateDialog(false);
  };
  const [view, setView] = useState<'contracts' | 'unrented' | 'repeated' | 'parking' | 'salik'>('contracts');
  const [invygoFilter, setInvygoFilter] = useState<'all' | 'invygo' | 'other' | 'invygo-open' | 'invygo-closed' | 'other-open' | 'other-closed'>('all');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [unrentedPlates, setUnrentedPlates] = useState<string[]>([]);
  const [repeatedContracts, setRepeatedContracts] = useState<any[]>([]);
  const modalRef = useRef(null);
  const [invygoSummary, setInvygoSummary] = useState({ invygoCount: 0, nonInvygoCount: 0, openCount: 0, closedCount: 0, invygoOpenCount: 0, invygoClosedCount: 0, otherOpenCount: 0, otherClosedCount: 0 });
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<'invygo' | 'yelo'>('invygo');
  const [showParkingDialog, setShowParkingDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [parkingFilter, setParkingFilter] = useState<'all' | 'matched' | 'unmatched' | 'edited'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [salikFilter, setSalikFilter] = useState<'all' | 'matched' | 'unmatched' | 'edited'>('all');
  const [showSalikDialog, setShowSalikDialog] = useState(false);
  const [salikType, setSalikType] = useState<'invygo' | 'yelo'>('invygo');
  const [showSalikSummary, setShowSalikSummary] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'open' | 'closed'>('all');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Show a brief visual feedback
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  const copySelectedColumns = () => {
    let data: any[] = [];
    let columnMap: { [key: string]: string } = {};
    
    if (view === 'contracts') {
      data = contractsToShow;
      columnMap = {
        'Contract No.': contractNoHeader || '',
        'Customer': customerHeader || '',
        'Plate No.': plateNoHeader || '',
        'Pick-up': pickupHeader || '',
        'Drop-off': dropoffHeader || ''
      };
    } else if (view === 'parking') {
      data = parkingData.filter((p: any) => {
        const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
        const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
        return plateMatch || contractMatch || !search;
      });
      if (parkingType === 'invygo') {
        columnMap = {
          'Plate Number': 'Plate_Number',
          'Date': 'Date',
          'Time': 'Time',
          'Amount': 'Amount',
          'Description': 'Description',
          'Dealer Booking': 'Dealer_Booking_Number',
          'Customer Name': 'CustomerName',
          'Tax Invoice': 'Tax_Invoice_No',
          'Contract': 'Contract',
          'Contract Start': 'Contract_Start',
          'Contract End': 'Contract_End'
        };
      } else {
        columnMap = {
          'Plate Number': 'Plate_Number',
          'Date': 'Date',
          'Time': 'Time',
          'Amount': 'Amount',
          'Description': 'Description',
          'Booking Number': 'Booking_Number',
          'Customer': 'Customer_Contract',
          'Pick-up Branch': 'Pickup_Branch',
          'Model': 'Model_Contract',
          'Tax Invoice': 'Tax_Invoice_No',
          'Contract': 'Contract',
          'Contract Start': 'Contract_Start',
          'Contract End': 'Contract_End'
        };
      }
    } else if (view === 'unrented') {
      data = unrentedToShow.map(plate => ({ plate }));
      columnMap = { 'Plate No.': 'plate' };
    } else if (view === 'repeated') {
      data = repeatedToShow.map(([plate, rows]) => ({ plate, count: rows.length }));
      columnMap = { 'Plate No.': 'plate', 'Contracts Count': 'count' };
    } else if (view === 'salik') {
      data = salikData.filter((s: any) => {
        const plateMatch = s.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
        const contractMatch = s.Contract?.toString().toLowerCase().includes(search.toLowerCase());
        return plateMatch || contractMatch || !search;
      });
      columnMap = {
        'Plate Number': 'Plate_Number',
        'Date': 'Date',
        'Time': 'Time',
        'Gate': 'Gate',
        'Amount': 'Amount',
        'Direction': 'Direction',
        'Contract': 'Contract',
        'Contract Start': 'Contract_Start',
        'Contract End': 'Contract_End',
        'Customer Name': 'CustomerName'
      };
    }

    const result = selectedColumns.map(columnName => {
      const fieldName = columnMap[columnName];
      const columnData = data.map(item => {
        let value = item[fieldName] || '';
        if (columnName.includes('Date') && value) {
          value = formatDate(value);
        }
        return value;
      });
      return `${columnName}:\n${columnData.join('\n')}`;
    }).join('\n\n');

    copyToClipboard(result);
    setShowCopyDialog(false);
    setSelectedColumns([]);
  };

  const getAvailableColumns = () => {
    if (view === 'contracts') {
      return ['Contract No.', 'Customer', 'Plate No.', 'Pick-up', 'Drop-off'];
    } else if (view === 'parking') {
      if (parkingType === 'invygo') {
        return ['Plate Number', 'Date', 'Time', 'Amount', 'Description', 'Dealer Booking', 'Customer Name', 'Tax Invoice', 'Contract', 'Contract Start', 'Contract End'];
      } else {
        return ['Plate Number', 'Date', 'Time', 'Amount', 'Description', 'Booking Number', 'Customer', 'Pick-up Branch', 'Model', 'Tax Invoice', 'Contract', 'Contract Start', 'Contract End'];
      }
    } else if (view === 'unrented') {
      return ['Plate No.'];
    } else if (view === 'repeated') {
      return ['Plate No.', 'Contracts Count'];
    } else if (view === 'salik') {
      return ['Plate Number', 'Date', 'Time', 'Gate', 'Amount', 'Direction', 'Contract', 'Contract Start', 'Contract End', 'Customer Name'];
    }
    return [];
  };

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (modalRef.current && !(modalRef.current as any).contains(e.target)) {
        setSelectedContract(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterContracts = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    if (startDate.length !== 10 || endDate.length !== 10) {
      alert('Please complete the date selection.');
      return;
    }

    if (!contracts.length) {
      alert('Please upload a contracts file first.');
      return;
    }

    const startParts = startDate.split('-');
    const start = new Date(Date.UTC(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2])));

    const endParts = endDate.split('-');
    const end = new Date(Date.UTC(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]), 23, 59, 59, 999));

    const pickupHeader = findHeader(['Pick-up Date', 'Pickup Date']);
    const dropoffHeader = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
    const plateNoHeader = findHeader(['Plate No.', 'Plate']);

    if (!pickupHeader || !dropoffHeader) {
        alert("The contract file must contain 'Pick-up Date' and 'Drop-off Date' columns.");
        return;
    }

    const statusHeader = findHeader(['Status']);
    
    const result = contracts.filter((c: any) => {
        const pickup = parseExcelDate(c[pickupHeader!]);
        const dropoff = parseExcelDate(c[dropoffHeader!]);
        const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
        
        // Include contract if pickup is valid and within range
        if (!pickup) return false;
        
        // If contract is open (based on Status column), include if pickup <= end
        if (status === 'open' || status === 'active') {
            return pickup <= end;
        }
        
        // Closed contract: check if it overlaps with the selected period
        if (!dropoff) return false;
        return pickup <= end && dropoff >= start;
    });

    result.forEach((c: any) => {
        const plateValue = plateNoHeader ? (c[plateNoHeader] || '') : '';
        const plate = plateValue.toString().replace(/\s/g, '').trim().toUpperCase();
        c.invygoListed = invygoPlates.includes(plate);
    });

    const invygoCount = result.filter(c => c.invygoListed).length;
    const nonInvygoCount = result.length - invygoCount;
    
    // حساب العقود المفتوحة والمغلقة
    const openCount = result.filter(c => {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return status === 'open' || status === 'active';
    }).length;
    const closedCount = result.length - openCount;
    
    // حساب العقود المفتوحة والمغلقة للإنفيجو
    const invygoOpenCount = result.filter(c => {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return c.invygoListed && (status === 'open' || status === 'active');
    }).length;
    const invygoClosedCount = invygoCount - invygoOpenCount;
    
    // حساب العقود المفتوحة والمغلقة للأخرى
    const otherOpenCount = result.filter(c => {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return !c.invygoListed && (status === 'open' || status === 'active');
    }).length;
    const otherClosedCount = nonInvygoCount - otherOpenCount;
    
    setInvygoSummary({ invygoCount, nonInvygoCount, openCount, closedCount, invygoOpenCount, invygoClosedCount, otherOpenCount, otherClosedCount });

    const rentedPlates = new Set(result.map((c: any) => {
        const plateValue = plateNoHeader ? (c[plateNoHeader] || '') : '';
        return plateValue.toString().replace(/\s/g, '').trim().toUpperCase()
    }).filter(p => p));

    const notRented = invygoPlates.filter(plate => !rentedPlates.has(plate)).sort();

    const grouped: Record<string, any[]> = {};
    result.forEach((c: any) => {
        const plateValue = plateNoHeader ? (c[plateNoHeader] || 'Unknown') : 'Unknown';
        const plate = plateValue.toString().trim().toUpperCase();
        if (!grouped[plate]) grouped[plate] = [];
        grouped[plate].push(c);
    });

    const repeated = Object.entries(grouped)
      .filter(([_, arr]) => arr.length > 1)
      .sort((a, b) => a[0].localeCompare(b[0]));

    setRepeatedContracts(repeated);
    setFiltered(result);
    setUnrentedPlates(notRented);
  };

  const plateNoHeader = findHeader(['Plate No.', 'Plate']);
  const contractNoHeader = findHeader(['Contract No.']);
  const customerHeader = findHeader(['Customer']);
  const pickupHeader = findHeader(['Pick-up Date', 'Pickup Date']);
  const dropoffHeader = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
  const statusHeader = findHeader(['Status']);

  const searched = filtered.filter((c: any) => {
    const plateMatch = plateNoHeader && c[plateNoHeader]?.toString().toLowerCase().includes(search.toLowerCase());
    const contractMatch = contractNoHeader && c[contractNoHeader]?.toString().toLowerCase().includes(search.toLowerCase());
    const customerMatch = customerHeader && c[customerHeader]?.toString().toLowerCase().includes(search.toLowerCase());
    return plateMatch || contractMatch || customerMatch;
  }).sort((a: any, b: any) => {
    if (!pickupHeader) return 0;
    const dateA = parseExcelDate(a[pickupHeader])?.getTime() || 0;
    const dateB = parseExcelDate(b[pickupHeader])?.getTime() || 0;
    return dateA - dateB;
  });

  const contractsToShow = searched.filter((c: any) => {
    if (invygoFilter === 'invygo') {
      return c.invygoListed;
    }
    if (invygoFilter === 'other') {
      return !c.invygoListed;
    }
    if (invygoFilter === 'invygo-open') {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return c.invygoListed && (status === 'open' || status === 'active');
    }
    if (invygoFilter === 'invygo-closed') {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return c.invygoListed && !(status === 'open' || status === 'active');
    }
    if (invygoFilter === 'other-open') {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return !c.invygoListed && (status === 'open' || status === 'active');
    }
    if (invygoFilter === 'other-closed') {
      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
      return !c.invygoListed && !(status === 'open' || status === 'active');
    }
    return true; // 'all' filter
  });

  const unrentedToShow = unrentedPlates.filter((plate: string) =>
    plate.toLowerCase().includes(search.toLowerCase())
  );

  const repeatedToShow = repeatedContracts.filter(([plate, rows]: [string, any[]]) => {
    const normalizedPlate = plate.toString().replace(/\s/g, '').trim().toUpperCase();
    const plateMatch = normalizedPlate.toLowerCase().includes(search.toLowerCase());
    
    // البحث في أسماء العملاء
    const customerMatch = rows.some((contract: any) => {
      const customerName = customerHeader ? contract[customerHeader]?.toString().toLowerCase() : '';
      const contractNo = contractNoHeader ? contract[contractNoHeader]?.toString().toLowerCase() : '';
      return customerName.includes(search.toLowerCase()) || contractNo.includes(search.toLowerCase());
    });
    
    return invygoPlates.includes(normalizedPlate) && (plateMatch || customerMatch || !search);
  });

  const updateSalikInfo = (salikIndex: number, contractNo: string) => {
    const contractNoHeaderVal = findHeader(['Contract No.']);
    const customerHeaderVal = findHeader(['Customer', 'Customer Name']);
    const pickupHeaderVal = findHeader(['Pick-up Date', 'Pickup Date']);
    const dropoffHeaderVal = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
    const statusHeaderVal = findHeader(['Status']);

    if (!contractNoHeaderVal || !pickupHeaderVal || !dropoffHeaderVal) {
      alert("The contracts file must contain 'Contract No.', 'Pick-up Date', and 'Drop-off Date' headers.");
      return;
    }

    if (!contracts || contracts.length === 0) {
      alert("No contracts loaded. Please upload contracts file first.");
      return;
    }

    const cleanContractNo = contractNo.toString().trim();
    
    let contract = contracts.find((c: any) => 
      c[contractNoHeaderVal]?.toString().trim().toLowerCase() === cleanContractNo.toLowerCase()
    );

    const newSalikData = [...salikData];
    const salikItem = newSalikData[salikIndex];

    if (contract) {
      // Contract found, update the single salik item
      salikItem.Contract = contract[contractNoHeaderVal];
      salikItem.Contract_Start = contract[pickupHeaderVal];

      const dealerBooking = dealerBookings.find((booking: any) => 
          booking['Agreement']?.toString() === salikItem.Contract?.toString()
      );
      if (dealerBooking) {
          salikItem.CustomerName = dealerBooking['Customer'] || dealerBooking['Customer Name'] || '';
      } else if (customerHeaderVal) {
          salikItem.CustomerName = contract[customerHeaderVal];
      }

      const contractStatus = statusHeaderVal ? contract[statusHeaderVal]?.toString().toLowerCase() : '';
      if (contractStatus === 'open' || contractStatus === 'active') {
        salikItem.Contract_End = 'Open';
      } else {
        salikItem.Contract_End = contract[dropoffHeaderVal];
      }
      
      salikItem.matchType = 'matched';
      salikItem.manual_update = true;
      
      setSalikData(newSalikData);
    } else {
      // Contract not found, update only the single item being edited
      salikItem.Contract = '';
      salikItem.CustomerName = '';
      salikItem.Contract_Start = '';
      salikItem.Contract_End = '';
      salikItem.matchType = 'unmatched';
      salikItem.manual_update = false;

      setSalikData(newSalikData);
    }
  };

  const handleAutoMatchSalik = (salikIndex: number) => {
    if (!revenueData || revenueData.length === 0) {
      alert("Please upload the Revenue file first.");
      return;
    }
  
    const salikItem = salikData[salikIndex];
    const salikPlate = (salikItem['Plate_Number'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
    const salikDate = parseExcelDate(salikItem['Trip_Date']);
    const formattedSalikDate = formatDate(salikDate);
    
    const revenueMatch = revenueData.find((rev: any) => {
      const revPlate = (rev['Plate Number'] || '').toString().replace(/\s+/g, '').trim().toUpperCase();
      const revDateObj = parseExcelDate(rev['Revenue Date']);
      
      if (!revPlate || !revDateObj) return false;
      
      const formattedRevDate = formatDate(revDateObj);
      return revPlate === salikPlate && formattedRevDate === formattedSalikDate;
    });
  
    if (revenueMatch) {
      const contractNo = revenueMatch['Contract No.'];
      if (contractNo) {
        updateSalikInfo(salikIndex, contractNo);
        alert(`Match found! Updating with Contract No: ${contractNo}`);
      } else {
        alert("A match was found in the revenue file, but it does not contain a contract number.");
      }
    } else {
      const newSalikData = [...salikData];
      const salikItemToUpdate = newSalikData[salikIndex];
      salikItemToUpdate.Contract = '';
      salikItemToUpdate.CustomerName = '';
      salikItemToUpdate.Contract_Start = '';
      salikItemToUpdate.Contract_End = '';
      salikItemToUpdate.matchType = 'unmatched';
      salikItemToUpdate.manual_update = false;
      setSalikData(newSalikData);
      
      alert(`No match found in the revenue file for plate ${salikPlate} on ${formatDate(salikDate)}. Record marked as unmatched.`);
    }
  };

  const handleRevenueCheck = () => {
    console.log('=== Revenue Check Started ===');
    console.log('Revenue Data Length:', revenueData?.length || 0);
    console.log('Selected Rows:', Array.from(selectedRows));
    console.log('Current View:', view);
    
    if (!revenueData || revenueData.length === 0) {
      console.log('❌ No revenue data found');
      alert("Please upload the Revenue file first.");
      return;
    }
    
    if (selectedRows.size === 0) {
      console.log('❌ No rows selected');
      alert("Please select rows to check revenue for.");
      return;
    }

    let updatedCount = 0;
    const dataToCheck = view === 'parking' ? parkingData : salikData;
    const newData = [...dataToCheck];
    
    console.log('Data to check length:', dataToCheck.length);
    
    // Store before counts
    let beforeMatched = 0, beforeReplacement = 0, beforeUnmatched = 0;
    
    // Calculate counts BEFORE processing
    if (view === 'parking') {
      const beforeTypedData = dataToCheck.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const hasInvygoPlate = invygoPlates.includes(plateNumber);
        const hasDealerBooking = p.Contract && dealerBookings && dealerBookings.some((booking: any) => 
            booking['Agreement']?.toString() === p.Contract?.toString()
        );
        return parkingType === 'invygo' ? (hasInvygoPlate || hasDealerBooking) : !(hasInvygoPlate || hasDealerBooking);
      });
      
      beforeMatched = beforeTypedData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const isInInvygoPlates = invygoPlates.includes(plateNumber);
        return p.Contract && p.Dealer_Booking_Number && p.Customer_Name && (isInInvygoPlates || p.matched);
      }).length;
      
      beforeReplacement = beforeTypedData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const isInInvygoPlates = invygoPlates.includes(plateNumber);
        return p.Contract && p.Dealer_Booking_Number && p.Customer_Name && !isInInvygoPlates && !p.matched;
      }).length;
      
      beforeUnmatched = beforeTypedData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const isInInvygoPlates = invygoPlates.includes(plateNumber);
        return (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name) && isInInvygoPlates;
      }).length;
      
      console.log('📊 BEFORE Revenue Check:');
      console.log('  Matched:', beforeMatched);
      console.log('  Replacement:', beforeReplacement);
      console.log('  Unmatched:', beforeUnmatched);
      console.log('  Total:', beforeTypedData.length);
    }

    newData.forEach((item, index) => {
      if (selectedRows.has(index)) {
        console.log(`\n--- Processing Row ${index} ---`);
        
        const itemPlate = (item['Plate_Number'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const itemDate = view === 'parking' ? parseExcelDate(item['Date']) : parseExcelDate(item['Trip_Date']);
        const formattedItemDate = formatDate(itemDate);
        
        console.log('Item Plate:', itemPlate);
        console.log('Item Date:', formattedItemDate);
        console.log('Item Data:', item);
        
        if (!itemPlate || !formattedItemDate) {
          console.log('❌ Missing plate or date, skipping');
          return;
        }

        const revenueMatch = revenueData.find((rev: any) => {
          const revPlate = (rev['Plate Number'] || '').toString().replace(/\s+/g, '').trim().toUpperCase();
          const revDateObj = parseExcelDate(rev['Revenue Date']);
          
          if (!revPlate || !revDateObj) return false;
          
          const formattedRevDate = formatDate(revDateObj);
          const isMatch = revPlate === itemPlate && formattedRevDate === formattedItemDate;
          
          if (isMatch) {
            console.log('✅ Revenue Match Found:', rev);
          }
          
          return isMatch;
        });

        if (revenueMatch) {
          const contractNo = revenueMatch['Contract No.'];
          console.log('Contract No from revenue:', contractNo);
          
          if (contractNo) {
            if (view === 'parking') {
              console.log('🅿️ Updating parking info with contract:', contractNo);
              // Inlined updateParkingInfo logic to modify the local 'newData' array directly
              const contractNoHeaderVal = findHeader(['Contract No.']);
              const customerHeaderVal = findHeader(['Customer', 'Customer Name']);
              const pickupHeaderVal = findHeader(['Pick-up Date', 'Pickup Date']);
              const dropoffHeaderVal = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
              const statusHeaderVal = findHeader(['Status']);

              if (contractNoHeaderVal) {
                const contract = contracts.find((c: any) => 
                  c[contractNoHeaderVal]?.toString().trim().toLowerCase() === contractNo.toString().trim().toLowerCase()
                );

                if (contract) {
                  const parkingItem = newData[index]; // Modify item in the local 'newData' array

                  parkingItem.Contract = contract[contractNoHeaderVal];
                  
                  if (customerHeaderVal) {
                    parkingItem.Customer_Contract = contract[customerHeaderVal];
                  }
                  if (pickupHeaderVal) {
                    parkingItem.Contract_Start = contract[pickupHeaderVal];
                  }
                  if (dropoffHeaderVal) {
                    const status = statusHeaderVal ? contract[statusHeaderVal]?.toString().toLowerCase() : '';
                    if (status === 'open' || status === 'active') {
                      parkingItem.Contract_End = 'Open';
                    } else {
                      parkingItem.Contract_End = contract[dropoffHeaderVal];
                    }
                  }

                  const plateNumber = (parkingItem.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                  if (invygoPlates.includes(plateNumber)) {
                    const dealerBooking = dealerBookings.find((booking: any) => 
                      booking['Agreement']?.toString().trim().toLowerCase() === contractNo?.toString().trim().toLowerCase()
                    );
                    
                    if (dealerBooking) {
                      parkingItem.Dealer_Booking_Number = dealerBooking['Booking ID'];
                      parkingItem.Customer_Name = dealerBooking['Customer'] || dealerBooking['Customer Name'] || '';
                      
                      const brandName = dealerBooking['Brand Name'] || '';
                      const carName = dealerBooking['Car Name'] || '';
                      const carYear = dealerBooking['Car Year'] || '';
                      parkingItem.Model = [brandName, carName, carYear].filter(part => part).join(' ');
                    }
                  } else {
                    const bookingNumberHeader = findHeader(['Booking Number', 'Booking No', 'Booking ID']);
                    const pickupBranchHeader = findHeader(['Pick-up Branch', 'Pickup Branch', 'Branch']);
                    const modelHeaderContract = findHeader(['Model', 'Car Model', 'Vehicle Model']);
                    
                    if(bookingNumberHeader) parkingItem.Booking_Number = contract[bookingNumberHeader] || '';
                    if(pickupBranchHeader) parkingItem.Pickup_Branch = contract[pickupBranchHeader] || '';
                    if(modelHeaderContract) parkingItem.Model_Contract = contract[modelHeaderContract] || '';
                  }
                  
                  parkingItem.manual_update = true;
                  parkingItem.matched = true;
                  console.log('✅ Parking info updated in local array');
                } else {
                  console.log(`❌ Contract ${contractNo} not found in contracts file. Will clear item.`);
                  const parkingItem = newData[index]; // Get the item to modify
                  console.log('🧹 Clearing contract info for item with non-existent contract. Before:', JSON.parse(JSON.stringify(parkingItem)));
                  
                  parkingItem.Contract = '';
                  parkingItem.manual_update = false;
                  parkingItem.Dealer_Booking_Number = '';
                  parkingItem.Customer_Name = '';
                  parkingItem.Customer_Contract = '';
                  parkingItem.Contract_Start = '';
                  parkingItem.Contract_End = '';
                  parkingItem.matched = false;
                  
                  console.log('✅ Parking item cleared. After:', JSON.parse(JSON.stringify(parkingItem)));
                }
              }
            } else {
              console.log('🚗 Updating salik info with contract:', contractNo);
              updateSalikInfo(index, contractNo);
              console.log('✅ Salik info updated');
            }
            updatedCount++;
            console.log('✅ Updated with contract:', contractNo);
          } else {
            console.log('❌ No contract number in revenue match');
          }
        } else {
          console.log('❌ No revenue match found');
          
          // Clear contract info for unmatched items in both parking and salik
          const itemToUpdate = newData[index];
          console.log('🧹 Clearing contract info for unmatched item');
          console.log('Before clearing:', itemToUpdate);
          
          itemToUpdate.Contract = '';
          itemToUpdate.manual_update = false;
          
          if (view === 'salik') {
            itemToUpdate.CustomerName = '';
            itemToUpdate.Contract_Start = '';
            itemToUpdate.Contract_End = '';
            itemToUpdate.matchType = 'unmatched';
            console.log('✅ Salik item cleared');
          } else if (view === 'parking') {
            itemToUpdate.Dealer_Booking_Number = '';
            itemToUpdate.Customer_Name = '';
            itemToUpdate.Customer_Contract = '';
            itemToUpdate.Contract_Start = '';
            itemToUpdate.Contract_End = '';
            itemToUpdate.matched = false;
            console.log('✅ Parking item cleared');
          }
          
          console.log('After clearing:', itemToUpdate);
          updatedCount++;
        }
      }
    });

    console.log('\n=== Revenue Check Summary ===');
    console.log('Updated Count:', updatedCount);
    
    // Calculate counts AFTER processing
    if (view === 'parking') {
      const afterTypedData = newData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const hasInvygoPlate = invygoPlates.includes(plateNumber);
        const hasDealerBooking = p.Contract && dealerBookings && dealerBookings.some((booking: any) => 
            booking['Agreement']?.toString() === p.Contract?.toString()
        );
        return parkingType === 'invygo' ? (hasInvygoPlate || hasDealerBooking) : !(hasInvygoPlate || hasDealerBooking);
      });
      
      const afterMatched = afterTypedData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const isInInvygoPlates = invygoPlates.includes(plateNumber);
        return p.Contract && p.Dealer_Booking_Number && p.Customer_Name && (isInInvygoPlates || p.matched);
      }).length;
      
      const afterReplacement = afterTypedData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const isInInvygoPlates = invygoPlates.includes(plateNumber);
        return p.Contract && p.Dealer_Booking_Number && p.Customer_Name && !isInInvygoPlates && !p.matched;
      }).length;
      
      const afterUnmatched = afterTypedData.filter((p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const isInInvygoPlates = invygoPlates.includes(plateNumber);
        return (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name) && isInInvygoPlates;
      }).length;
      
      console.log('📊 AFTER Revenue Check:');
      console.log('  Matched:', afterMatched);
      console.log('  Replacement:', afterReplacement);
      console.log('  Unmatched:', afterUnmatched);
      console.log('  Total:', afterTypedData.length);
      
      console.log('🔄 CHANGES:');
      console.log('  Matched change:', afterMatched - beforeMatched);
      console.log('  Replacement change:', afterReplacement - beforeReplacement);
      console.log('  Unmatched change:', afterUnmatched - beforeUnmatched);
    }
    
    if (updatedCount > 0) {
      console.log('\n🔄 Updating state with new data');
      if (view === 'parking') {
        console.log('🅿️ Setting parking data with', newData.length, 'records');
        setParkingData(newData);
        console.log('✅ Parking data updated');
        
        // Auto-switch to matched filter if we're currently viewing unmatched
        if (parkingFilter === 'unmatched') {
          console.log('🔄 Switching to matched filter to show updated records');
          setParkingFilter('matched');
        }
      } else {
        console.log('🚗 Setting salik data with', newData.length, 'records');
        setSalikData(newData);
        console.log('✅ Salik data updated');
        
        // Auto-switch to matched filter if we're currently viewing unmatched
        if (salikFilter === 'unmatched') {
          console.log('🔄 Switching to matched filter to show updated records');
          setSalikFilter('matched');
        }
      }
      setSelectedRows(new Set());
      console.log('✅ Selected rows cleared');
      alert(`${updatedCount} selected records have been updated based on the revenue file.`);
    } else {
      console.log('❌ No updates made');
      alert("No new matches found in the revenue file for the selected records.");
    }
  };

  const updateParkingInfo = (parkingIndex: number, contractNo: string) => {
    const contractNoHeaderVal = findHeader(['Contract No.']);
    const customerHeaderVal = findHeader(['Customer', 'Customer Name']);
    const pickupHeaderVal = findHeader(['Pick-up Date', 'Pickup Date']);
    const dropoffHeaderVal = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
    const statusHeaderVal = findHeader(['Status']);

    if (!contractNoHeaderVal) {
      alert("Cannot find 'Contract No.' header in the contracts file.");
      return;
    }

    const contract = contracts.find((c: any) => c[contractNoHeaderVal] === contractNo);

    if (contract) {
      const newParkingData = [...parkingData];
      const parkingItem = newParkingData[parkingIndex];

      parkingItem.Contract = contract[contractNoHeaderVal];
      
      if (customerHeaderVal) {
        parkingItem.Customer_Contract = contract[customerHeaderVal];
      }
      if (pickupHeaderVal) {
        parkingItem.Contract_Start = contract[pickupHeaderVal];
      }
      if (dropoffHeaderVal) {
        const status = statusHeaderVal ? contract[statusHeaderVal]?.toString().toLowerCase() : '';
        if (status === 'open' || status === 'active') {
          parkingItem.Contract_End = 'Open';
        } else {
          parkingItem.Contract_End = contract[dropoffHeaderVal];
        }
      }

      const plateNumber = (parkingItem.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
      if (invygoPlates.includes(plateNumber)) {
        const dealerBooking = dealerBookings.find((booking: any) => 
          booking['Agreement']?.toString() === contractNo?.toString()
        );
        
        if (dealerBooking) {
          parkingItem.Dealer_Booking_Number = dealerBooking['Booking ID'];
          parkingItem.Customer_Name = dealerBooking['Customer'] || dealerBooking['Customer Name'] || '';
          
          const brandName = dealerBooking['Brand Name'] || '';
          const carName = dealerBooking['Car Name'] || '';
          const carYear = dealerBooking['Car Year'] || '';
          parkingItem.Model = [brandName, carName, carYear].filter(part => part).join(' ');
        }
      } else {
        const bookingNumberHeader = findHeader(['Booking Number', 'Booking No', 'Booking ID']);
        const pickupBranchHeader = findHeader(['Pick-up Branch', 'Pickup Branch', 'Branch']);
        const modelHeaderContract = findHeader(['Model', 'Car Model', 'Vehicle Model']);
        
        if(bookingNumberHeader) parkingItem.Booking_Number = contract[bookingNumberHeader] || '';
        if(pickupBranchHeader) parkingItem.Pickup_Branch = contract[pickupBranchHeader] || '';
        if(modelHeaderContract) parkingItem.Model_Contract = contract[modelHeaderContract] || '';
      }
      
      parkingItem.manual_update = true;
      parkingItem.matched = true;
      setParkingData(newParkingData);
    } else {
      console.log(`🅿️ [Manual Edit] Contract ${contractNo} not found in contracts file. Clearing item.`);
      const newParkingData = [...parkingData];
      const parkingItem = newParkingData[parkingIndex];
      
      console.log('🧹 Clearing contract info. Before:', JSON.parse(JSON.stringify(parkingItem)));

      parkingItem.Contract = '';
      parkingItem.Customer_Contract = '';
      parkingItem.Contract_Start = '';
      parkingItem.Contract_End = '';
      parkingItem.Dealer_Booking_Number = '';
      parkingItem.Customer_Name = '';
      parkingItem.Model = '';
      parkingItem.Booking_Number = '';
      parkingItem.Pickup_Branch = '';
      parkingItem.Model_Contract = '';
      parkingItem.manual_update = false;
      parkingItem.matched = false;

      console.log('✅ Parking item cleared. After:', JSON.parse(JSON.stringify(parkingItem)));
      
      setParkingData(newParkingData);
      alert(`Contract ${contractNo} was not found. The parking record has been cleared and marked as unmatched.`);
    }
  };



  // Auto-filter contracts when contracts, invygoPlates, startDate, or endDate change
  useEffect(() => {
    if (contracts.length > 0 && invygoPlates.length > 0 && startDate && endDate && startDate.length === 10 && endDate.length === 10) {
      filterContracts();
    }
    // eslint-disable-next-line
  }, [contracts, invygoPlates, startDate, endDate]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFF8E1",
      fontFamily: "Tajawal, Arial, sans-serif"
    }}>
      <button
        onClick={() => window.location.href = "https://moalamir52.github.io/Yelo/#dashboard"}
        style={{
          margin: "24px 0 16px 24px",
          background: "#FFD600",
          color: "#673ab7",
          border: "2px solid #673ab7",
          borderRadius: 8,
          fontWeight: "bold",
          fontSize: 18,
          padding: "10px 28px",
          cursor: "pointer",
          boxShadow: "0 2px 8px #FFD60044"
        }}
      >
        ← Back to YELO
      </button>

      <div style={{
        maxWidth: 900,
        margin: "32px auto",
        background: "#FFD600",
        borderRadius: 18,
        boxShadow: "0 4px 24px #FFD60055",
        padding: 32,
        textAlign: "center",
        border: "3px solid #673ab7"
      }}>
        <h1 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 38, margin: 0 }}>Contract Matcher </h1>
        <div style={{ color: "#222", fontSize: 18, marginTop: 8, marginBottom: 0 }}>
          The smart tool for matching and analyzing car rental contracts.
        </div>
      </div>

      <div style={{
        maxWidth: 1600,
        margin: "32px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 24px #0001",
        padding: 24,
        minHeight: 600
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
          <button
            onClick={() => setShowTemplateDialog(true)}
            style={{
              background: "#fff",
              color: "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}
          >Template</button>
          <TemplateDialog 
            showTemplateDialog={showTemplateDialog} 
            setShowTemplateDialog={setShowTemplateDialog} 
            downloadTemplate={downloadTemplate} 
          />
          <input
            type="text"
            placeholder="🔍 Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "2px solid #FFD600",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 16,
              width: 220
            }}
          />
          <button
            onClick={() => {
              setSearch('');
              setFiltered([]);
              setUnrentedPlates([]);
              setRepeatedContracts([]);
              setParkingData([]);
              setInvygoSummary({ invygoCount: 0, nonInvygoCount: 0, openCount: 0, closedCount: 0, invygoOpenCount: 0, invygoClosedCount: 0, otherOpenCount: 0, otherClosedCount: 0 });
            }}
            style={{
              background: "#fff",
              color: "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Reset</button>
          <button
            onClick={() => setShowExportDialog(true)}
            style={{
              background: "#fff",
              color: "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Export</button>
          <button
            onClick={() => window.print()}
            style={{
              background: "#fff",
              color: "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Print</button>
          <button
            onClick={() => setShowCopyDialog(true)}
            style={{
              background: "#fff",
              color: "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Copy</button>

          <button
            onClick={() => setView('contracts')}
            style={{
              background: view === 'contracts' ? "#FFD600" : "#fff",
              color: view === 'contracts' ? "#222" : "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Contracts ({filtered.length})</button>
          <button
            onClick={() => setView('unrented')}
            style={{
              background: view === 'unrented' ? "#FFD600" : "#fff",
              color: view === 'unrented' ? "#222" : "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Unrented Cars ({unrentedPlates.length})</button>
          <button
            onClick={() => setView('repeated')}
            style={{
              background: view === 'repeated' ? "#FFD600" : "#fff",
              color: view === 'repeated' ? "#222" : "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Repeated Cars ({repeatedToShow.length})</button>
          <button
            onClick={() => setShowParkingDialog(true)}
            style={{
              background: view === 'parking' ? "#FFD600" : "#fff",
              color: view === 'parking' ? "#222" : "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Parking ({parkingData.length})</button>
          <button
            onClick={() => setShowSalikDialog(true)}
            style={{
              background: view === 'salik' ? "#FFD600" : "#fff",
              color: view === 'salik' ? "#222" : "#673ab7",
              border: "2px solid #FFD600",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 18px",
              cursor: "pointer"
            }}>Salik ({salikData.length})</button>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap" }}>
          </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap" }}>
          <FileUploadButton
            title="Upload Contracts File"
            onUpload={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            fileName={contractFileName}
          />
          <FileUploadButton
            title="Upload Invygo Cars"
            onUpload={handleInvygoUpload}
            accept=".xlsx, .xls, .csv"
            fileName={invygoFileName}
          />
          <FileUploadButton
            title="Upload Bookings File"
            onUpload={handleDealerBookingUpload}
            accept=".xlsx, .xls, .csv"
            fileName={dealerFileName}
          />
          <FileUploadButton
            title="Upload Parking File"
            onUpload={handleParkingUpload}
            accept=".xlsx, .xls, .csv"
            fileName={parkingFileName}
          />
          <FileUploadButton
            title="Upload Salik File"
            onUpload={handleSalikUpload}
            accept=".xlsx, .xls, .csv"
            fileName={salikFileName}
          />
          <FileUploadButton
            title="Upload Revenue File"
            onUpload={handleRevenueUpload}
            accept=".xlsx, .xls, .csv"
            fileName={revenueFileName}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4, textAlign: "center" }}>From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                border: "2px solid #FFD600",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 15,
                fontWeight: "bold",
                width: 120,
                textAlign: "center"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4, textAlign: "center" }}>To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                border: "2px solid #FFD600",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 15,
                fontWeight: "bold",
                width: 120,
                textAlign: "center"
              }}
            />
          </div>
          <button
            onClick={filterContracts}
            style={{
              background: "#FFD600",
              color: "#222",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 16,
              padding: "8px 20px",
              marginRight: 4,
              cursor: "pointer",
              boxShadow: "0 2px 8px #FFD60044",
              height: 40
            }}
          >
            Show Contracts
          </button>
        </div>

        {search && (
          <>
            {view === 'contracts' && <ContractsTable contractsToShow={contractsToShow} invygoSummary={invygoSummary} setInvygoFilter={setInvygoFilter} invygoFilter={invygoFilter} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} customerHeader={customerHeader} plateNoHeader={plateNoHeader} pickupHeader={pickupHeader} dropoffHeader={dropoffHeader} findHeader={findHeader} />}
            {view === 'unrented' && <UnrentedTable unrentedToShow={unrentedToShow} />}
            {view === 'repeated' && <RepeatedTable repeatedToShow={repeatedToShow} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} customerHeader={customerHeader} pickupHeader={pickupHeader} dropoffHeader={dropoffHeader} statusHeader={statusHeader} />}
            {view === 'parking' && <ParkingTable parkingData={parkingData} parkingType={parkingType} setParkingFilter={setParkingFilter} parkingFilter={parkingFilter} invygoPlates={invygoPlates} search={search} copyToClipboard={copyToClipboard} updateParkingInfo={updateParkingInfo} selectedRows={selectedRows} setSelectedRows={setSelectedRows} dealerBookings={dealerBookings} handleRevenueCheck={handleRevenueCheck} />}
            {view === 'salik' && !showSalikSummary && <SalikTable salikData={salikData} salikType={salikType} setSalikFilter={setSalikFilter} salikFilter={salikFilter} invygoPlates={invygoPlates} search={search} copyToClipboard={copyToClipboard} updateSalikInfo={updateSalikInfo} selectedRows={selectedRows} setSelectedRows={setSelectedRows} dealerBookings={dealerBookings} setShowSalikSummary={setShowSalikSummary} setSalikData={setSalikData} handleAutoMatchSalik={handleAutoMatchSalik} handleRevenueCheck={handleRevenueCheck} />}
            {view === 'salik' && showSalikSummary && <SalikSummaryTable salikData={salikData} salikType={salikType} invygoPlates={invygoPlates} search={search} setShowSalikSummary={setShowSalikSummary} dealerBookings={dealerBookings} summaryFilter={summaryFilter} setSummaryFilter={setSummaryFilter} />}
          </>
        )}

        {!search && (
          <>
            {view === 'contracts' && <ContractsTable contractsToShow={contractsToShow} invygoSummary={invygoSummary} setInvygoFilter={setInvygoFilter} invygoFilter={invygoFilter} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} customerHeader={customerHeader} plateNoHeader={plateNoHeader} pickupHeader={pickupHeader} dropoffHeader={dropoffHeader} findHeader={findHeader} />}
            {view === 'unrented' && <UnrentedTable unrentedToShow={unrentedToShow} />}
            {view === 'repeated' && <RepeatedTable repeatedToShow={repeatedToShow} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} customerHeader={customerHeader} pickupHeader={pickupHeader} dropoffHeader={dropoffHeader} statusHeader={statusHeader} />}
            {view === 'parking' && <ParkingTable parkingData={parkingData} parkingType={parkingType} setParkingFilter={setParkingFilter} parkingFilter={parkingFilter} invygoPlates={invygoPlates} search={search} copyToClipboard={copyToClipboard} updateParkingInfo={updateParkingInfo} selectedRows={selectedRows} setSelectedRows={setSelectedRows} dealerBookings={dealerBookings} handleRevenueCheck={handleRevenueCheck} />}
            {view === 'salik' && !showSalikSummary && <SalikTable salikData={salikData} salikType={salikType} setSalikFilter={setSalikFilter} salikFilter={salikFilter} invygoPlates={invygoPlates} search={search} copyToClipboard={copyToClipboard} updateSalikInfo={updateSalikInfo} selectedRows={selectedRows} setSelectedRows={setSelectedRows} dealerBookings={dealerBookings} setShowSalikSummary={setShowSalikSummary} setSalikData={setSalikData} handleAutoMatchSalik={handleAutoMatchSalik} handleRevenueCheck={handleRevenueCheck} />}
            {view === 'salik' && showSalikSummary && <SalikSummaryTable salikData={salikData} salikType={salikType} invygoPlates={invygoPlates} search={search} setShowSalikSummary={setShowSalikSummary} dealerBookings={dealerBookings} summaryFilter={summaryFilter} setSummaryFilter={setSummaryFilter} />}
          </>
        )}

        <SalikDialog 
          showSalikDialog={showSalikDialog} 
          setShowSalikDialog={setShowSalikDialog} 
          setSalikType={setSalikType} 
          setView={setView} 
          salikData={salikData} 
          invygoPlates={invygoPlates} 
          dealerBookings={dealerBookings}
        />

        <ParkingDialog 
          showParkingDialog={showParkingDialog} 
          setShowParkingDialog={setShowParkingDialog} 
          setParkingType={setParkingType} 
          setView={setView} 
          parkingData={parkingData} 
          invygoPlates={invygoPlates} 
          dealerBookings={dealerBookings}
        />

        <ExportDialog 
          showExportDialog={showExportDialog} 
          setShowExportDialog={setShowExportDialog} 
          view={view} 
          parkingData={parkingData} 
          parkingType={parkingType} 
          invygoPlates={invygoPlates} 
          parkingFilter={parkingFilter} 
          search={search} 
          startDate={startDate} 
          endDate={endDate} 
          contractNoHeader={contractNoHeader} 
          customerHeader={customerHeader} 
          plateNoHeader={plateNoHeader} 
          pickupHeader={pickupHeader} 
          dropoffHeader={dropoffHeader} 
          contractsToShow={view === 'unrented' ? unrentedToShow : view === 'repeated' ? repeatedToShow : contractsToShow} 
          invygoFilter={invygoFilter} 
          selectedRows={selectedRows}
        />

        <CopyDialog 
          showCopyDialog={showCopyDialog} 
          setShowCopyDialog={setShowCopyDialog} 
          getAvailableColumns={getAvailableColumns} 
          selectedColumns={selectedColumns} 
          setSelectedColumns={setSelectedColumns} 
          copySelectedColumns={copySelectedColumns} 
        />

        <ContractDetailsModal 
          selectedContract={selectedContract} 
          modalRef={modalRef} 
        />

      </div>
    </div>
  );
}