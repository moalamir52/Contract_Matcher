import React, { useState } from 'react';
import { formatDate, formatDateTime } from '../utils/dates';

const SalikTable = ({ 
    salikData, 
    salikType, 
    setSalikFilter, 
    salikFilter, 
    invygoPlates, 
    search, 
    copyToClipboard,
    updateSalikInfo,
    selectedRows,
    setSelectedRows,
    dealerBookings,
    setShowSalikSummary,
    setSalikData
}: any) => {

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newContract, setNewContract] = useState('');

    const isInvygoCar = (s: any) => {
        const plateNumber = (s.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        // Check if plate is in invygo plates OR has a dealer booking (replacement car)
        const hasInvygoPlate = invygoPlates.includes(plateNumber);
        const hasDealerBooking = s.Contract && dealerBookings && dealerBookings.some((booking: any) => 
            booking['Agreement']?.toString() === s.Contract?.toString()
        );
        return hasInvygoPlate || hasDealerBooking;
    };
    
    const typedSalikData = salikData.filter((s: any) => {
        const isInvygoType = isInvygoCar(s);
        return salikType === 'invygo' ? isInvygoType : !isInvygoType;
    });

    const totalAmount = typedSalikData.reduce((acc: number, s: any) => acc + Number(s.Amount || 0), 0);

    const matchedSalik = typedSalikData.filter((s: any) => {
        return s.Contract && s.CustomerName && !s.ignored;
    });
    const unmatchedSalik = typedSalikData.filter((s: any) => {
        return (!s.Contract || !s.CustomerName) && !s.ignored;
    });
    const ignoredSalik = typedSalikData.filter((s: any) => s.ignored);
    const editedSalik = typedSalikData.filter((s: any) => s.manual_update);

    return (
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
        <span role="img" aria-label="salik">🛣️</span> {salikType === 'invygo' ? 'Invygo' : 'YELO'} Salik Data
      </h2>
      <div style={{
        margin: "16px 0",
        padding: "12px 24px",
        background: "#fff8dc",
        border: "2px dashed #FFD600",
        borderRadius: 12,
        fontWeight: "bold",
        fontSize: 18,
        color: "#5d1789",
        display: "inline-block"
      }}>
        Total Amount: {totalAmount.toFixed(2)} AED
      </div>
      <div style={{
        margin: "16px 0",
        padding: "12px 24px",
        background: "#fff8dc",
        border: "2px dashed #FFD600",
        borderRadius: 12,
        fontWeight: "bold",
        fontSize: 18,
        color: "#5d1789",
        display: "inline-block",
        marginLeft: "10px"
      }}>
        ✅ Matched: <span 
          onClick={() => setSalikFilter('matched')} 
          style={{color: "#388e3c", cursor: 'pointer', textDecoration: 'underline'}}
        >
          {matchedSalik.length}
        </span> &nbsp; | &nbsp;
        ❌ Unmatched: <span 
          onClick={() => setSalikFilter('unmatched')} 
          style={{color: "#f44336", cursor: 'pointer', textDecoration: 'underline'}}
        >
          {unmatchedSalik.length}
        </span> &nbsp; | &nbsp;
        ✏️ Edited: <span
            onClick={() => setSalikFilter('edited')}
            style={{color: "#ff9800", cursor: 'pointer', textDecoration: 'underline'}}
        >
            {editedSalik.length}
        </span> &nbsp; | &nbsp;
        🚫 Ignored: <span
            style={{color: "#9E9E9E", fontWeight: 'bold'}}
        >
            {ignoredSalik.length}
        </span>
        {salikFilter !== 'all' && (
          <span onClick={() => setSalikFilter('all')} style={{cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px'}}> (Show All)</span>
        )}
      </div>
      
      <div style={{ margin: "16px 0", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setShowSalikSummary(true)}
          style={{
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 14,
            padding: "8px 16px",
            cursor: "pointer"
          }}
        >
          📊 Customer Summary
        </button>
        <button
          onClick={async () => {
            try {
              const JSZip = (await import('jszip')).default;
              const zip = new JSZip();
              
              const groupedData = salikData.filter((s: any) => {
                const isInvygoType = isInvygoCar(s);
                return salikType === 'invygo' ? isInvygoType : !isInvygoType;
              }).reduce((acc: any, item: any) => {
                const contract = item.Contract || 'No Contract';
                if (!acc[contract]) acc[contract] = [];
                acc[contract].push(item);
                return acc;
              }, {});
              
              Object.entries(groupedData).forEach(([contract, trips]: [string, any]) => {
                const csvContent = [
                  ['Date', 'Time', 'Plate Number', 'Gate', 'Amount', 'Direction', 'Customer'].join(','),
                  ...(trips as any[]).map(trip => [
                    formatDate(trip.Date),
                    trip.Time,
                    trip.Plate_Number,
                    trip.Gate,
                    trip.Amount,
                    trip.Direction,
                    trip.CustomerName
                  ].join(','))
                ].join('\n');
                
                zip.file(`Salik_${contract}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
              });
              
              const zipBlob = await zip.generateAsync({type: 'blob'});
              const url = URL.createObjectURL(zipBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Salik_Individual_${salikType === 'invygo' ? 'Invygo' : 'YELO'}_${new Date().toISOString().split('T')[0]}.zip`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Error creating ZIP:', error);
              alert('Error creating ZIP file. Please try again.');
            }
          }}
          style={{
            background: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 14,
            padding: "8px 16px",
            cursor: "pointer"
          }}
        >
          📥 Export Individual
        </button>
        <button
          onClick={() => {
            if (selectedRows.size === 0) {
              alert('Please select records to ignore.');
              return;
            }
            
            const newSalikData = salikData.map((item: any, index: number) => {
              if (selectedRows.has(index)) {
                return { ...item, ignored: true, Contract: 'IGNORED', CustomerName: 'Company Use' };
              }
              return item;
            });
            
            setSalikData(newSalikData);
            setSelectedRows(new Set());
          }}
          style={{
            background: "#9E9E9E",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 14,
            padding: "8px 16px",
            cursor: "pointer"
          }}
        >
          🚫 Ignore Selected
        </button>
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
          fontSize: 13,
          minWidth: 1200
        }}>
          <thead>
            <tr style={{
              background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
              color: "#222",
              fontWeight: "bold",
              fontSize: 16,
              boxShadow: "0 2px 8px #FFD60055"
            }}>
              <th style={{ padding: "10px 4px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.size > 0 && selectedRows.size === salikData.filter((s: any) => {
                    const plateNumber = (s.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    if (salikType === 'invygo') {
                      if (!isInvygoCar(s)) return false;
                    } else {
                      if (isInvygoCar(s)) return false;
                    }
                    if (salikFilter === 'matched') {
                      if (!s.Contract || !s.CustomerName) return false;
                    }
                    if (salikFilter === 'unmatched') {
                      if (s.Contract && s.CustomerName) return false;
                    }
                    if (salikFilter === 'edited' && !s.manual_update) return false;
                    const plateMatch = s.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                    const contractMatch = s.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                    return plateMatch || contractMatch || !search;
                  }).length}
                  onChange={(e) => {
                    const visibleRows = salikData.map((s: any, index: number) => ({ s, index })).filter(({ s }: any) => {
                      const plateNumber = (s.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                      if (salikType === 'invygo') {
                        if (!isInvygoCar(s)) return false;
                      } else {
                        if (isInvygoCar(s)) return false;
                      }
                      if (salikFilter === 'matched') {
                        if (!s.Contract || !s.CustomerName) return false;
                      }
                      if (salikFilter === 'unmatched') {
                        if (s.Contract && s.CustomerName) return false;
                      }
                      if (salikFilter === 'edited' && !s.manual_update) return false;
                      const plateMatch = s.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                      const contractMatch = s.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                      return plateMatch || contractMatch || !search;
                    });
                    const newSelected = new Set<number>();
                    if (e.target.checked) {
                      visibleRows.forEach(({ index }: any) => newSelected.add(index));
                    }
                    setSelectedRows(newSelected);
                  }}
                />
              </th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>#</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Plate Number</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Date</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Time</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Gate</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Amount</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Direction</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Customer Name</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract Start</th>
              <th style={{ padding: "10px 4px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract End</th>
            </tr>
          </thead>
          <tbody>
            {salikData.length > 0 ? (
              salikData.filter((s: any) => {
                const plateNumber = (s.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                
                if (salikType === 'invygo') {
                  // Show only Invygo cars (including replacement cars)
                  if (!isInvygoCar(s)) return false;
                } else {
                  // Show only YELO cars (not Invygo)
                  if (isInvygoCar(s)) return false;
                }
                
                // Apply salik filter
                if (salikFilter === 'matched') {
                    if (!s.Contract || !s.CustomerName) return false;
                }
                if (salikFilter === 'unmatched') {
                    if (s.Contract && s.CustomerName) return false;
                }
                if (salikFilter === 'edited' && !s.manual_update) return false;

                
                const plateMatch = s.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                const contractMatch = s.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                return plateMatch || contractMatch || !search;
              }).map((s: any, index: number) => {
                const originalIndex = salikData.indexOf(s);
                return (
                <tr key={index} style={{
                  background: s.manual_update ? '#e8f5e9' : (s.Contract ? (index % 2 === 0 ? "#FFFDE7" : "#fff") : "#FBE9E7"),
                  transition: "background 0.2s",
                  borderBottom: "1px solid #f3e6b3"
                }}>
                  <td style={{ padding: "8px 4px", textAlign: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(originalIndex)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(originalIndex);
                        } else {
                          newSelected.delete(originalIndex);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "center", color: "#888", fontWeight: "bold", fontSize: 12 }}>{index + 1}</td>
                  <td 
                    onClick={() => copyToClipboard(s.Plate_Number)}
                    style={{ 
                      padding: "8px 4px", 
                      textAlign: "center", 
                      fontWeight: "bold", 
                      color: "#1976d2", 
                      fontSize: 12,
                      cursor: "pointer",
                      borderRadius: 4,
                      transition: "background 0.2s"
                    }}
                    title="Click to copy plate number"
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.background = "#e3f2fd"}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ""}
                  >{s.Plate_Number}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 2 }}>{formatDate(s.Date)}</div>
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", color: "#ff5722", fontSize: 12 }}>{s.Time || ''}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{s.Gate}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", color: "#388e3c", fontSize: 12 }}>{s.Amount}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{s.Direction}</td>
                  <td style={{ 
                    padding: "8px 4px", 
                    textAlign: "center", 
                    fontWeight: "bold",
                    color: s.Contract ? "#1976d2" : "#f44336",
                    fontSize: 12
                  }}>
                    {editingIndex === originalIndex ? (
                        <input
                            type="text"
                            defaultValue={s.Contract || ''}
                            onChange={(e) => setNewContract(e.target.value)}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (newContract.trim()) {
                                  updateSalikInfo(originalIndex, newContract.trim());
                                }
                                setEditingIndex(null);
                            }
                            if (e.key === 'Escape') {
                                setEditingIndex(null);
                            }
                            }}
                            onBlur={() => {
                                if (newContract.trim()) {
                                  updateSalikInfo(originalIndex, newContract.trim());
                                }
                                setEditingIndex(null);
                            }}
                            autoFocus
                        />
                        ) : (
                        <div>
                            {s.Contract || 'N/A'}
                            <button 
                                onClick={() => {
                                setEditingIndex(originalIndex);
                                setNewContract(s.Contract || '');
                                }} 
                                style={{
                                marginLeft: '5px', 
                                padding: '2px 5px', 
                                fontSize: '10px',
                                cursor: 'pointer',
                                backgroundColor: s.Contract ? '#e3f2fd' : '#ffebee',
                                border: '1px solid #ccc',
                                borderRadius: '3px'
                                }}
                            >
                                {s.Contract ? 'Edit' : 'Add'}
                            </button>
                        </div>
                        )}
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: "bold", color: "#673ab7" }}>{s.CustomerName}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", color: "#388e3c", fontSize: 12 }}>
                    {s.Contract_Start ? formatDateTime(s.Contract_Start) : ''}
                  </td>
                  <td style={{ 
                    padding: "8px 4px", 
                    textAlign: "center",
                    color: s.Contract_End === 'Open' ? "#ff5722" : "#388e3c",
                    fontWeight: s.Contract_End === 'Open' ? "bold" : "normal",
                    fontSize: 12
                  }}>
                    {s.Contract_End === 'Open' ? 'Open' : (s.Contract_End ? formatDateTime(s.Contract_End) : '')}
                  </td>
                </tr>
                )}
              )
            ) : (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  {salikFilter === 'matched' ? 'No matched salik data found.' : 
                   salikFilter === 'unmatched' ? 'No unmatched salik data found.' : 
                   'No salik data found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    )
}

export default SalikTable;