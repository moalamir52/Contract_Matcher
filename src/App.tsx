// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value, { date1904: false }) ?
      new Date(Date.UTC(1899, 11, 30) + value * 86400000) : null;
  }
  if (typeof value === 'string') {
    const parts = value.split(/[\/\-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => parseInt(p));
      if (year > 1900 && month <= 12 && day <= 31) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDate(value: any): string {
  const date = parseExcelDate(value);
  if (!date) return value;
  // Use UTC date parts for formatting to avoid timezone shift
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('en-GB');
}

export default function App() {
  const [view, setView] = useState<'contracts' | 'unrented' | 'repeated' | 'parking'>('contracts');
  const [contracts, setContracts] = useState<any[]>([]);
  const [parkingData, setParkingData] = useState<any[]>([]);
  const [dealerBookings, setDealerBookings] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [invygoFilter, setInvygoFilter] = useState<'all' | 'invygo' | 'other'>('all');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [invygoPlates, setInvygoPlates] = useState<string[]>([]);
  const [unrentedPlates, setUnrentedPlates] = useState<string[]>([]);
  const [repeatedContracts, setRepeatedContracts] = useState<any[]>([]);
  const modalRef = useRef(null);
  const [invygoSummary, setInvygoSummary] = useState({ invygoCount: 0, nonInvygoCount: 0 });

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (modalRef.current && !(modalRef.current as any).contains(e.target)) {
        setSelectedContract(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: any) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
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
    const reader = new FileReader();
    
    const processData = (jsonData: any[]) => {
      // Fill Contract and Dealer_Booking_Number columns
      const updatedData = jsonData.map((row: any) => {
        const plateNumber = (row['Plate_Number'] || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const parkingDate = parseExcelDate(row['Date']);
        
        if (plateNumber && parkingDate) {
          const plateNoHeader = findHeader(['Plate No.', 'Plate']);
          const pickupHeader = findHeader(['Pick-up Date', 'Pickup Date']);
          const dropoffHeader = findHeader(['Drop-off Date', 'Dropoff Date', 'Drop off Date']);
          const contractNoHeader = findHeader(['Contract No.']);
          
          if (plateNoHeader && pickupHeader && dropoffHeader && contractNoHeader) {
            // Only search in filtered Invygo contracts
            const invygoContracts = filtered.filter((c: any) => c.invygoListed);
            
            const matchingContract = invygoContracts.find((c: any) => {
              const contractPlate = (c[plateNoHeader] || '').toString().replace(/\s/g, '').trim().toUpperCase();
              const pickup = parseExcelDate(c[pickupHeader]);
              const dropoff = parseExcelDate(c[dropoffHeader]);
              const statusHeader = findHeader(['Status']);
              const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
              
              if (contractPlate !== plateNumber || !pickup) return false;
              
              // If contract is open (based on Status column), check if parking date >= pickup
              if (status === 'open' || status === 'active') {
                  return parkingDate >= pickup;
              }
              
              // Closed contract: check if parking date is within contract period
              if (!dropoff) return false;
              return parkingDate >= pickup && parkingDate <= dropoff;
            });
            
            if (matchingContract) {
              const contractNo = matchingContract[contractNoHeader];
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
              
              // Find matching dealer booking
              const dealerBooking = dealerBookings.find((booking: any) => 
                booking['Agreement']?.toString() === contractNo?.toString()
              );
              
              if (dealerBooking) {
                row.Dealer_Booking_Number = dealerBooking['Booking ID'];
              }
            } else {
              // No matching contract found - set empty values
              row.Contract_Start = '';
              row.Contract_End = '';
            }
          }
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

  const handleDealerBookingUpload = (e: any) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
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
    } else {
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

  const repeatedToShow = repeatedContracts.filter(([plate]: [string]) =>
    plate.toLowerCase().includes(search.toLowerCase())
  );

  const ContractsTable = (
    <div>
      <h2 style={{
        color: "#673ab7",
        fontWeight: "bold",
        marginTop: 24,
        fontSize: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: 1
      }}>
        <span role="img" aria-label="doc">📄</span> Contracts
      </h2>
      <div style={{
        margin: "32px 0 16px",
        padding: "12px 24px",
        background: "#fff8dc",
        border: "2px dashed #FFD600",
        borderRadius: 12,
        fontWeight: "bold",
        fontSize: 18,
        color: "#5d1789",
        display: "inline-block"
      }}>
        ✅ Invygo Contracts: <span onClick={() => setInvygoFilter('invygo')} style={{cursor: 'pointer', textDecoration: 'underline'}}> {invygoSummary.invygoCount}</span> &nbsp; | &nbsp;
        ❌ Other Contracts: <span onClick={() => setInvygoFilter('other')} style={{cursor: 'pointer', textDecoration: 'underline'}}> {invygoSummary.nonInvygoCount}</span>
        {invygoFilter !== 'all' && (
          <span onClick={() => setInvygoFilter('all')} style={{cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px'}}> (Show All)</span>
        )}
      </div>
      <div style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 32px #FFD60055",
        padding: 0,
        marginTop: 18,
        overflow: "auto",
        border: "2px solid #FFD600"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontSize: 16,
          minWidth: 700
        }}>
          <thead>
            <tr style={{
              background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
              color: "#222",
              fontWeight: "bold",
              fontSize: 18,
              boxShadow: "0 2px 8px #FFD60055"
            }}>
              <th style={{ padding: "16px 8px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>#</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Contract No.</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Customer</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Plate No.</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Pick-up</th>
              <th style={{ padding: "16px 8px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {contractsToShow.length > 0 ? (
              contractsToShow.map((c: any, index) => (
                <tr key={index} style={{
                  background: c.invygoListed
                    ? (index % 2 === 0 ? "#FFFDE7" : "#fff")
                    : "#FBE9E7",
                  transition: "background 0.2s",
                  borderBottom: "1px solid #f3e6b3"
                }}>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#888", fontWeight: "bold" }}>{index + 1}</td>
                  <td style={{
                    padding: "12px 8px",
                    color: "#1976d2",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: 8,
                    transition: "background 0.2s, color 0.2s",
                    textAlign: "center"
                  }}
                    onClick={() => setSelectedContract(c)}
                    title="Show contract details"
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.background = "#673ab7";
                      (e.currentTarget as HTMLElement).style.color = "#FFD600";
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.background = "";
                      (e.currentTarget as HTMLElement).style.color = "#1976d2";
                    }}
                  >{contractNoHeader ? c[contractNoHeader] : ''}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{customerHeader ? c[customerHeader] : ''}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{plateNoHeader ? c[plateNoHeader] : ''}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{pickupHeader ? formatDate(c[pickupHeader]) : ''}</td>
                  <td style={{ 
                    padding: "12px 8px", 
                    textAlign: "center",
                    color: (() => {
                      const statusHeader = findHeader(['Status']);
                      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                      return (status === 'open' || status === 'active') ? "#ff5722" : "inherit";
                    })(),
                    fontWeight: (() => {
                      const statusHeader = findHeader(['Status']);
                      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                      return (status === 'open' || status === 'active') ? "bold" : "normal";
                    })()
                  }}>
                    {(() => {
                      const statusHeader = findHeader(['Status']);
                      const status = statusHeader ? c[statusHeader]?.toString().toLowerCase() : '';
                      if (status === 'open' || status === 'active') {
                        return 'Open Contract';
                      }
                      return dropoffHeader ? formatDate(c[dropoffHeader]) : '';
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  No contracts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const UnrentedTable = (
    <div>
      <h2 style={{
        color: "#388e3c",
        fontWeight: "bold",
        marginTop: 32,
        fontSize: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: 1
      }}>
        <span role="img" aria-label="car">🚫</span> Unrented Cars
      </h2>
      <div style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 32px #FFD60055",
        padding: 0,
        marginTop: 18,
        overflow: "auto",
        border: "2px solid #FFD600"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontSize: 16,
          minWidth: 400
        }}>
          <thead>
            <tr style={{
              background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
              color: "#222",
              fontWeight: "bold",
              fontSize: 18,
              boxShadow: "0 2px 8px #FFD60055"
            }}>
              <th style={{ padding: "16px 8px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>#</th>
              <th style={{ padding: "16px 8px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Plate No.</th>
            </tr>
          </thead>
          <tbody>
            {unrentedToShow.length > 0 ? (
              unrentedToShow.map((plate, idx) => (
                <tr key={idx} style={{
                  background: idx % 2 === 0 ? "#FFFDE7" : "#fff",
                  transition: "background 0.2s",
                  borderBottom: "1px solid #f3e6b3"
                }}>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#888", fontWeight: "bold" }}>{idx + 1}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#1976d2", textAlign: "center" }}>
                    {plate.replace(/^([a-zA-Z]+)(\d+)$/, '$1 $2')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  No unrented cars found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ParkingTable = (
    <div>
      <h2 style={{
        color: "#ff5722",
        fontWeight: "bold",
        marginTop: 24,
        fontSize: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: 1
      }}>
        <span role="img" aria-label="parking">🅿️</span> Parking Data
      </h2>
      <div style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 32px #FFD60055",
        padding: 0,
        marginTop: 18,
        overflow: "auto",
        border: "2px solid #FFD600"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontSize: 13,
          minWidth: 1500
        }}>
          <thead>
            <tr style={{
              background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
              color: "#222",
              fontWeight: "bold",
              fontSize: 16,
              boxShadow: "0 2px 8px #FFD60055"
            }}>
              <th style={{ padding: "10px 4px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>#</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Plate Number</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Date</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Time</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Amount</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Description</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Dealer Booking</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Tax Invoice</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract Start</th>
              <th style={{ padding: "10px 4px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract End</th>
            </tr>
          </thead>
          <tbody>
            {parkingData.length > 0 ? (
              parkingData.filter((p: any) => {
                const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                return plateMatch || contractMatch || !search;
              }).map((p: any, index) => (
                <tr key={index} style={{
                  background: p.Contract ? (index % 2 === 0 ? "#FFFDE7" : "#fff") : "#FBE9E7",
                  transition: "background 0.2s",
                  borderBottom: "1px solid #f3e6b3"
                }}>
                  <td style={{ padding: "8px 4px", textAlign: "center", color: "#888", fontWeight: "bold", fontSize: 12 }}>{index + 1}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", color: "#1976d2", fontSize: 12 }}>{p.Plate_Number}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{formatDate(p.Date)}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Time}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", color: "#388e3c", fontSize: 12 }}>{p.Amount}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Description}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Dealer_Booking_Number}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Tax_Invoice_No}</td>
                  <td style={{ 
                    padding: "8px 4px", 
                    textAlign: "center", 
                    fontWeight: "bold",
                    color: p.Contract ? "#1976d2" : "#f44336",
                    fontSize: 12
                  }}>{p.Contract || 'Switch'}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", color: "#388e3c", fontSize: 12 }}>
                    {p.Contract_Start ? formatDate(p.Contract_Start) : ''}
                  </td>
                  <td style={{ 
                    padding: "8px 4px", 
                    textAlign: "center",
                    color: p.Contract_End === 'Open' ? "#ff5722" : "#388e3c",
                    fontWeight: p.Contract_End === 'Open' ? "bold" : "normal",
                    fontSize: 12
                  }}>
                    {p.Contract_End === 'Open' ? 'Open' : (p.Contract_End ? formatDate(p.Contract_End) : '')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  No parking data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RepeatedTable = (
    <div>
      <h2 style={{
        color: "#673ab7",
        fontWeight: "bold",
        marginTop: 32,
        fontSize: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: 1
      }}>
        <span role="img" aria-label="car">🚗</span> Repeated Cars in Period
      </h2>
      <div style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 32px #FFD60055",
        padding: 0,
        marginTop: 18,
        overflow: "auto",
        border: "2px solid #FFD600"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontSize: 16,
          minWidth: 700
        }}>
          <thead>
            <tr style={{
              background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
              color: "#222",
              fontWeight: "bold",
              fontSize: 18,
              boxShadow: "0 2px 8px #FFD60055"
            }}>
              <th style={{ padding: "16px 8px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>#</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Plate No.</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Contracts Count</th>
              <th style={{ padding: "16px 8px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Contract Numbers</th>
            </tr>
          </thead>
          <tbody>
            {repeatedToShow.length > 0 ? (
              repeatedToShow.map(([plate, rows], i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "#FFFDE7" : "#fff",
                    transition: "background 0.2s",
                    borderBottom: "1px solid #f3e6b3"
                  }}
                >
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#888", fontWeight: "bold" }}>{i + 1}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#1976d2", letterSpacing: 1, textAlign: "center" }}>{plate}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#388e3c", fontWeight: "bold" }}>{rows.length}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    {rows.map((r: any, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-block",
                          margin: "0 6px 6px 0",
                          background: "#FFD600",
                          borderRadius: 8,
                          padding: "6px 14px",
                          color: "#222",
                          fontWeight: "bold",
                          fontSize: 15,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px #FFD60044",
                          border: "1.5px solid #673ab7",
                          transition: "background 0.2s, color 0.2s"
                        }}
                        onClick={() => setSelectedContract(r)}
                        title="Show contract details"
                        onMouseOver={e => {
                          (e.currentTarget as HTMLElement).style.background = "#673ab7";
                          (e.currentTarget as HTMLElement).style.color = "#FFD600";
                        }}
                        onMouseOut={e => {
                          (e.currentTarget as HTMLElement).style.background = "#FFD600";
                          (e.currentTarget as HTMLElement).style.color = "#222";
                        }}
                      >
                        {contractNoHeader ? r[contractNoHeader] : ''}
                      </span>
                    ))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  No repeated cars found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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
        <h1 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 38, margin: 0 }}>Invygo Contracts </h1>
        <div style={{ color: "#222", fontSize: 18, marginTop: 8, marginBottom: 0 }}>
          Search and view all contracts in one place
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
                        onClick={() => {
              if (view === 'parking' && parkingData.length > 0) {
                // Export parking data with all original columns plus filled Contract and Dealer_Booking_Number
                const parkingToShow = parkingData.filter((p: any) => {
                  const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                  const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                  return plateMatch || contractMatch || !search;
                });
                
                const headers = ['Plate_Number', 'Date', 'Time', 'Amount', 'Description', 'Dealer_Booking_Number', 'Tax_Invoice_No', 'Contract'];
                const headerRowString = headers.join(',');
                
                const dataRowsStrings = parkingToShow.map((p: any) => [
                  p.Plate_Number || '',
                  p.Date || '',
                  p.Time || '',
                  p.Amount || '',
                  p.Description || '',
                  p.Dealer_Booking_Number || '',
                  p.Tax_Invoice_No || '',
                  p.Contract || 'Switch'
                ].join(','));
                
                const csvRows = [headerRowString, ...dataRowsStrings];
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
                const link = document.createElement("a");
                link.setAttribute("href", encodeURI(csvContent));
                link.setAttribute("download", `Parking_Data_${startDate}_to_${endDate}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                // Original export logic for other views
                const headerRowString = [contractNoHeader, customerHeader, plateNoHeader, pickupHeader, dropoffHeader].filter(h => h).join(",");
                const dataRowsStrings = contractsToShow.map((c: any) => [
                  contractNoHeader ? c[contractNoHeader] : '',
                  customerHeader ? c[customerHeader] : '',
                  plateNoHeader ? c[plateNoHeader] : '',
                  pickupHeader ? formatDate(c[pickupHeader]) : '',
                  dropoffHeader ? formatDate(c[dropoffHeader]) : ''
                ].join(','));

                const csvRows = [headerRowString, ...dataRowsStrings];

                const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
                const link = document.createElement("a");
                link.setAttribute("href", encodeURI(csvContent));

                let prefix = '';
                if (view === 'contracts') {
                  if (invygoFilter === 'invygo') {
                    prefix = 'Invygo_Contracts';
                  } else if (invygoFilter === 'other') {
                    prefix = 'Other_Contracts';
                  } else {
                    prefix = 'All_Contracts';
                  }
                } else if (view === 'unrented') {
                  prefix = 'Unrented_Cars';
                }
                else if (view === 'repeated') {
                  prefix = 'Repeated_Cars';
                }

                const dateRange = `${startDate}_to_${endDate}`;
                const filename = `${prefix}_${dateRange}.csv`;
                
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
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
            }}>Repeated Cars ({repeatedContracts.length})</button>
          <button
            onClick={() => setView('parking')}
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 6, fontWeight: "bold", color: "#222", fontSize: 16 }}>
              Contracts File
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{
                marginBottom: 0,
                padding: 7,
                borderRadius: 8,
                border: "1.2px solid #eee",
                width: 180,
                background: "#f8f8f8",
                fontSize: 15
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 6, fontWeight: "bold", color: "#222", fontSize: 16 }}>
              Invygo Cars File
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleInvygoUpload}
              style={{
                marginBottom: 0,
                padding: 7,
                borderRadius: 8,
                border: "1.2px solid #eee",
                width: 180,
                background: "#f8f8f8",
                fontSize: 15
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 6, fontWeight: "bold", color: "#222", fontSize: 16 }}>
              Dealer Booking File
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleDealerBookingUpload}
              style={{
                marginBottom: 0,
                padding: 7,
                borderRadius: 8,
                border: "1.2px solid #eee",
                width: 180,
                background: "#f8f8f8",
                fontSize: 15
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 6, fontWeight: "bold", color: "#222", fontSize: 16 }}>
              Parking File
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleParkingUpload}
              disabled={filtered.length === 0}
              title={filtered.length === 0 ? "Please filter contracts first" : ""}
              style={{
                marginBottom: 0,
                padding: 7,
                borderRadius: 8,
                border: "1.2px solid #eee",
                width: 180,
                background: filtered.length === 0 ? "#f0f0f0" : "#f8f8f8",
                fontSize: 15,
                cursor: filtered.length === 0 ? "not-allowed" : "pointer"
              }}
            />
          </div>
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
            {ContractsTable}
            {UnrentedTable}
            {RepeatedTable}
            {ParkingTable}
          </>
        )}

        {!search && (
          <>
            {view === 'contracts' && ContractsTable}
            {view === 'unrented' && UnrentedTable}
            {view === 'repeated' && RepeatedTable}
            {view === 'parking' && ParkingTable}
          </>
        )}

        {selectedContract && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "#0008", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50
          }}>
            <div ref={modalRef} style={{
              background: "#fff", padding: 24, borderRadius: 18, boxShadow: "0 4px 24px #0003", maxWidth: 650, width: "100%", maxHeight: "80vh", overflowY: "auto"
            }}>
              <h3 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 24, marginBottom: 18, textAlign: "center" }}>Contract Details</h3>
              <div style={{
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 8px 32px #FFD60055",
                padding: 0,
                marginTop: 0,
                overflow: "auto",
                border: "2px solid #FFD600"
              }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 16,
                  minWidth: 400
                }}>
                  <thead>
                    <tr style={{
                      background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
                      color: "#222",
                      fontWeight: "bold",
                      fontSize: 18,
                      boxShadow: "0 2px 8px #FFD60055"
                    }}>
                      <th style={{ padding: "14px 8px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Field</th>
                      <th style={{ padding: "14px 8px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedContract).map(([key, value], idx) => (
                      <tr key={idx} style={{
                        background: idx % 2 === 0 ? "#FFFDE7" : "#fff",
                        transition: "background 0.2s",
                        borderBottom: "1px solid #f3e6b3"
                      }}>
                        <td style={{
                          padding: "12px 8px",
                          fontWeight: "bold",
                          color: "#673ab7",
                          textAlign: "center",
                          letterSpacing: 1
                        }}>{key}</td>
                        <td style={{
                          padding: "12px 8px",
                          color: key.toLowerCase().includes('date') ? "#388e3c" : "#1976d2",
                          fontWeight: "bold",
                          textAlign: "center"
                        }}>
                          {key.toLowerCase().includes('date') ? formatDate(value) : value?.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <div style={{
          textAlign: "center",
          marginTop: 40,
          padding: 16,
          fontSize: 14,
          color: "#888",
          borderTop: "1px solid #eee"
        }}>
          © {new Date().getFullYear()} Mohamed Alamir. All rights reserved.
        </div>
      </div>
    </div>
  );
}
