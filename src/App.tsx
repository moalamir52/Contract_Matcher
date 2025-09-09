import React, { useState, useEffect, useRef } from 'react';
import { useFileUpload } from './hooks/useFileUpload';
import { parseExcelDate, formatDate, formatDateTime } from './utils/dates';
import FileUploadButton from './components/FileUploadButton';
import ContractsTable from './components/ContractsTable';
import UnrentedTable from './components/UnrentedTable';
import RepeatedTable from './components/RepeatedTable';
import ParkingTable from './components/ParkingTable';
import TemplateDialog from './components/TemplateDialog';
import ParkingDialog from './components/ParkingDialog';
import ExportDialog from './components/ExportDialog';
import CopyDialog from './components/CopyDialog';
import ContractDetailsModal from './components/ContractDetailsModal';

export default function App() {
  const { 
    contracts,
    parkingData,
    dealerBookings,
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
  const [view, setView] = useState<'contracts' | 'unrented' | 'repeated' | 'parking'>('contracts');
  const [invygoFilter, setInvygoFilter] = useState<'all' | 'invygo' | 'other'>('all');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [unrentedPlates, setUnrentedPlates] = useState<string[]>([]);
  const [repeatedContracts, setRepeatedContracts] = useState<any[]>([]);
  const modalRef = useRef(null);
  const [invygoSummary, setInvygoSummary] = useState({ invygoCount: 0, nonInvygoCount: 0 });
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<'invygo' | 'yelo'>('invygo');
  const [showParkingDialog, setShowParkingDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [parkingFilter, setParkingFilter] = useState<'all' | 'matched' | 'unmatched' | 'edited'>('all');

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
    if (!startDate || !endDate) return;

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
    setInvygoSummary({ invygoCount, nonInvygoCount });

    const rentedPlates = new Set(result.map((c: any) => {
        const plateValue = plateNoHeader ? (c[plateNoHeader] || '') : '';
        return plateValue.toString().replace(/\s/g, '').trim().toUpperCase()
    }).filter(p => p));

    const notRented = invygoPlates.filter(plate => !rentedPlates.has(plate));

    const grouped: Record<string, any[]> = {};
    result.forEach((c: any) => {
        const plateValue = plateNoHeader ? (c[plateNoHeader] || 'Unknown') : 'Unknown';
        const plate = plateValue.toString().trim().toUpperCase();
        if (!grouped[plate]) grouped[plate] = [];
        grouped[plate].push(c);
    });

    const repeated = Object.entries(grouped).filter(([_, arr]) => arr.length > 1);

    setRepeatedContracts(repeated);
    setFiltered(result);
    setUnrentedPlates(notRented);
  };

  const plateNoHeader = findHeader(['Plate No.', 'Plate']);
  const contractNoHeader = findHeader(['Contract No.']);
  const customerHeader = findHeader(['Customer']);
  const pickupHeader = findHeader(['Pick-up Date', 'Pickup Date']);
  const dropoffHeader = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);

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
    return true; // 'all' filter
  });

  const unrentedToShow = unrentedPlates.filter((plate: string) =>
    plate.toLowerCase().includes(search.toLowerCase())
  );

  const repeatedToShow = repeatedContracts.filter(([plate]: [string]) => {
    const normalizedPlate = plate.toString().replace(/\s/g, '').trim().toUpperCase();
    return invygoPlates.includes(normalizedPlate) && normalizedPlate.toLowerCase().includes(search.toLowerCase());
  });

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
      } else { // For YELO cars, get contract data directly
        const bookingNumberHeader = findHeader(['Booking Number', 'Booking No', 'Booking ID']);
        const pickupBranchHeader = findHeader(['Pick-up Branch', 'Pickup Branch', 'Branch']);
        const modelHeaderContract = findHeader(['Model', 'Car Model', 'Vehicle Model']);
        
        if(bookingNumberHeader) parkingItem.Booking_Number = contract[bookingNumberHeader] || '';
        if(pickupBranchHeader) parkingItem.Pickup_Branch = contract[pickupBranchHeader] || '';
        if(modelHeaderContract) parkingItem.Model_Contract = contract[modelHeaderContract] || '';
      }
      
      // Manually added flag
      parkingItem.manual_update = true;

      setParkingData(newParkingData);
    } else {
      alert(`Contract with number "${contractNo}" not found.`);
    }
  };

  // Auto-filter contracts when contracts, invygoPlates, startDate, or endDate change
  useEffect(() => {
    if (contracts.length > 0 && invygoPlates.length > 0 && startDate && endDate) {
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
              setInvygoSummary({ invygoCount: 0, nonInvygoCount: 0 });
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
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap" }}>
          </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap" }}>
          <FileUploadButton
            title="Upload Contracts File"
            onUpload={handleFileUpload}
            accept=".xlsx, .xls"
            fileName={contractFileName}
          />
          <FileUploadButton
            title="Upload Invygo Cars"
            onUpload={handleInvygoUpload}
            accept=".xlsx, .xls"
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
            {view === 'repeated' && <RepeatedTable repeatedToShow={repeatedToShow} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} />}
            {view === 'parking' && <ParkingTable parkingData={parkingData} parkingType={parkingType} setParkingFilter={setParkingFilter} parkingFilter={parkingFilter} invygoPlates={invygoPlates} search={search} copyToClipboard={copyToClipboard} updateParkingInfo={updateParkingInfo} />}
          </>
        )}

        {!search && (
          <>
            {view === 'contracts' && <ContractsTable contractsToShow={contractsToShow} invygoSummary={invygoSummary} setInvygoFilter={setInvygoFilter} invygoFilter={invygoFilter} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} customerHeader={customerHeader} plateNoHeader={plateNoHeader} pickupHeader={pickupHeader} dropoffHeader={dropoffHeader} findHeader={findHeader} />}
            {view === 'unrented' && <UnrentedTable unrentedToShow={unrentedToShow} />}
            {view === 'repeated' && <RepeatedTable repeatedToShow={repeatedToShow} setSelectedContract={setSelectedContract} contractNoHeader={contractNoHeader} />}
            {view === 'parking' && <ParkingTable parkingData={parkingData} parkingType={parkingType} setParkingFilter={setParkingFilter} parkingFilter={parkingFilter} invygoPlates={invygoPlates} search={search} copyToClipboard={copyToClipboard} updateParkingInfo={updateParkingInfo} />}
          </>
        )}

        <ParkingDialog 
          showParkingDialog={showParkingDialog} 
          setShowParkingDialog={setShowParkingDialog} 
          setParkingType={setParkingType} 
          setView={setView} 
          parkingData={parkingData} 
          invygoPlates={invygoPlates} 
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