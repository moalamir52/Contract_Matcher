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
    const parts = value.split(/[\/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => parseInt(p));
      if (year > 1900 && month <= 12 && day <= 31) {
        return new Date(year, month - 1, day);
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
  return date.toLocaleDateString('en-GB');
}

export default function App() {
  const [view, setView] = useState<'contracts' | 'unrented' | 'repeated'>('contracts');
  const [contracts, setContracts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [invygoPlates, setInvygoPlates] = useState<string[]>([]);
  const [unrentedPlates, setUnrentedPlates] = useState<string[]>([]);
  const [repeatedContracts, setRepeatedContracts] = useState<any[]>([]);
  const modalRef = useRef(null);

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
      const jsonData = XLSX.utils.sheet_to_json(sheet).filter((row: any) =>
        Object.values(row).some(v => v !== null && v !== '')
      );
      setContracts(jsonData);
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
      const plates = jsonData.map((row: any) => (row['Plate'] || '').toString().replace(/\s/g, '').trim());
      setInvygoPlates(plates);
    };
    reader.readAsArrayBuffer(file);
  };

  const filterContracts = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = contracts.filter((c: any) => {
      const pickup = parseExcelDate(c['Pick-up Date']);
      const dropoff = parseExcelDate(c['Drop-off Date']);
      const plate = (c['Plate No.'] || c['Plate'] || '').toString().replace(/\s/g, '').trim();
      return pickup && dropoff && pickup <= end && dropoff >= start && invygoPlates.includes(plate);
    });

    const rentedPlates = new Set(result.map((c: any) => (c['Plate No.'] || c['Plate'] || '').toString().replace(/\s/g, '').trim()));
    const notRented = invygoPlates.filter(plate => !rentedPlates.has(plate));

    const grouped: Record<string, any[]> = {};
    result.forEach((c: any) => {
      const plate = c['Plate No.'] || c['Plate'] || 'Unknown';
      if (!grouped[plate]) grouped[plate] = [];
      grouped[plate].push(c);
    });
    const repeated = Object.entries(grouped).filter(([_, arr]) => arr.length > 1);
    setRepeatedContracts(repeated);

    setFiltered(result);
    setUnrentedPlates(notRented);
  };

  const searched = filtered.filter((c: any) => {
    return (
      c['Plate No.']?.toString().toLowerCase().includes(search.toLowerCase()) ||
      c['Contract No.']?.toString().toLowerCase().includes(search.toLowerCase()) ||
      c['Customer']?.toString().toLowerCase().includes(search.toLowerCase())
    );
  }).sort((a: any, b: any) => {
    const dateA = parseExcelDate(a['Pick-up Date'])?.getTime() || 0;
    const dateB = parseExcelDate(b['Pick-up Date'])?.getTime() || 0;
    return dateA - dateB;
  });

  const contractsToShow = searched;
  const unrentedToShow = unrentedPlates.filter(plate =>
    plate.toLowerCase().includes(search.toLowerCase())
  );
  const repeatedToShow = repeatedContracts
    .filter(([plate]) => plate.toLowerCase().includes(search.toLowerCase()));

  // جدول العقود
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
                  background: index % 2 === 0 ? "#FFFDE7" : "#fff",
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
                  >{c['Contract No.']}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{c['Customer']}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{c['Plate No.']}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{formatDate(c['Pick-up Date'])}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>{formatDate(c['Drop-off Date'])}</td>
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

  // جدول السيارات غير المؤجرة
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
                  <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#1976d2", textAlign: "center" }}>{plate}</td>
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

  // جدول السيارات المكررة
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
                        {r['Contract No.']}
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
        maxWidth: 1200,
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
            onClick={() => setSearch('')}
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
              // Export to CSV
              const csvRows = [
                ["Contract No.", "Customer", "Plate No.", "Pick-up", "Drop-off"],
                ...searched.map((c: any) => [
                  c['Contract No.'],
                  c['Customer'],
                  c['Plate No.'],
                  formatDate(c['Pick-up Date']),
                  formatDate(c['Drop-off Date'])
                ])
              ];
              const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
              const link = document.createElement("a");
              link.setAttribute("href", encodeURI(csvContent));
              link.setAttribute("download", "contracts.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
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
            }}>Unrented Cars</button>
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
            }}>Repeated Cars</button>
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

        {/* Always show all results for search */}
        {search && (
          <>
            {ContractsTable}
            {UnrentedTable}
            {RepeatedTable}
          </>
        )}

        {/* إذا لم يكن هناك بحث، اعرض الصفحة حسب view */}
        {!search && (
          <>
            {view === 'contracts' && ContractsTable}
            {view === 'unrented' && UnrentedTable}
            {view === 'repeated' && RepeatedTable}
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
                          color: key.includes('Date') ? "#388e3c" : "#1976d2",
                          fontWeight: "bold",
                          textAlign: "center"
                        }}>
                          {key.includes('Date') ? formatDate(value) : value?.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
