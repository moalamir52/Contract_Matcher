import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../utils/dates';

const ParkingTable = ({ 
    parkingData, 
    parkingType, 
    setParkingFilter, 
    parkingFilter, 
    invygoPlates, 
    search, 
    copyToClipboard,
    updateParkingInfo,
    selectedRows,
    setSelectedRows,
    dealerBookings,
    handleRevenueCheck
}: any) => {

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newContract, setNewContract] = useState('');
    const [forceUpdate, setForceUpdate] = useState(0);
    
    // Force re-render when parkingData changes
    useEffect(() => {
        setForceUpdate(prev => prev + 1);
    }, [parkingData]);

    const isInvygoCar = (p: any) => {
        const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        // Check if plate is in invygo plates OR has a dealer booking (replacement car)
        const hasInvygoPlate = invygoPlates.includes(plateNumber);
        const hasDealerBooking = p.Contract && dealerBookings && dealerBookings.some((booking: any) => 
            booking['Agreement']?.toString() === p.Contract?.toString()
        );
        return hasInvygoPlate || hasDealerBooking;
    };
    
    const typedParkingData = parkingData.filter((p: any) => {
        const isInvygoType = isInvygoCar(p);
        return parkingType === 'invygo' ? isInvygoType : !isInvygoType;
    });

    const totalAmount = typedParkingData.reduce((acc: number, p: any) => acc + Number(p.Amount || 0), 0);

    const matchedParking = typedParkingData.filter((p: any) => {
        if (parkingType === 'invygo') {
            // Count as matched if it has contract info AND (is in invygo plates OR manually matched)
            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
            const isInInvygoPlates = invygoPlates.includes(plateNumber);
            return p.Contract && p.Dealer_Booking_Number && p.Customer_Name && (isInInvygoPlates || p.matched);
        } else {
            return p.Contract && p.Customer_Contract;
        }
    });
    const unmatchedParking = typedParkingData.filter((p: any) => {
        if (parkingType === 'invygo') {
            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
            const isInInvygoPlates = invygoPlates.includes(plateNumber);
            // Unmatched: no contract info AND is in invygo plates
            return (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name) && isInInvygoPlates;
        } else {
            return !p.Contract || !p.Customer_Contract;
        }
    });
    const editedParking = typedParkingData.filter((p: any) => p.manual_update);

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
        <span role="img" aria-label="parking">🅿️</span> {parkingType === 'invygo' ? 'Invygo' : 'YELO'} Parking Data
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
          onClick={() => setParkingFilter('matched')} 
          style={{color: "#388e3c", cursor: 'pointer', textDecoration: 'underline'}}
        >
          {matchedParking.length}
        </span> &nbsp; | &nbsp;
        🔄 Replacement: <span
            onClick={() => setParkingFilter('replacement')}
            style={{color: "#f57c00", cursor: 'pointer', textDecoration: 'underline'}}
        >
            {typedParkingData.filter((p: any) => {
                if (parkingType === 'invygo') {
                    const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    const isInInvygoPlates = invygoPlates.includes(plateNumber);
                    return p.Contract && p.Dealer_Booking_Number && p.Customer_Name && !isInInvygoPlates;
                } else {
                    return 0;
                }
            }).length}
        </span> &nbsp; | &nbsp;
        ❌ Unmatched: <span 
          onClick={() => setParkingFilter('unmatched')} 
          style={{color: "#f44336", cursor: 'pointer', textDecoration: 'underline'}}
        >
          {unmatchedParking.length}
        </span> &nbsp; | &nbsp;
        ✏️ Edited: <span
            onClick={() => setParkingFilter('edited')}
            style={{color: "#ff9800", cursor: 'pointer', textDecoration: 'underline'}}
        >
            {editedParking.length}
        </span>
        {parkingFilter !== 'all' && (
          <span onClick={() => setParkingFilter('all')} style={{cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px'}}> (Show All)</span>
        )}
      </div>
      
      <div style={{ margin: "16px 0", display: "flex", gap: "10px" }}>
        <button
          onClick={handleRevenueCheck}
          style={{
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 14,
            padding: "8px 16px",
            cursor: "pointer"
          }}
        >
          💰 Check Revenue
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
              <th style={{ padding: "10px 4px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.size > 0 && selectedRows.size === parkingData.filter((p: any) => {
                    const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    if (parkingType === 'invygo') {
                      if (!isInvygoCar(p)) return false;
                    } else {
                      if (isInvygoCar(p)) return false;
                    }
                    if (parkingFilter === 'matched') {
                      if (parkingType === 'invygo') {
                        const isInInvygoPlates = invygoPlates.includes(plateNumber);
                        if (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name || (!isInInvygoPlates && !p.matched)) return false;
                      } else {
                        if (!p.Contract || !p.Customer_Contract) return false;
                      }
                    }
                    if (parkingFilter === 'replacement') {
                      if (parkingType === 'invygo') {
                        const isInInvygoPlates = invygoPlates.includes(plateNumber);
                        if (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name || isInInvygoPlates) return false;
                      } else {
                        return false;
                      }
                    }
                    if (parkingFilter === 'unmatched') {
                      if (parkingType === 'invygo') {
                        const isInInvygoPlates = invygoPlates.includes(plateNumber);
                        if ((p.Contract && p.Dealer_Booking_Number && p.Customer_Name) || !isInInvygoPlates) return false;
                      } else {
                        if (p.Contract && p.Customer_Contract) return false;
                      }
                    }
                    if (parkingFilter === 'edited' && !p.manual_update) return false;
                    const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                    const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                    return plateMatch || contractMatch || !search;
                  }).length}
                  onChange={(e) => {
                    const visibleRows = parkingData.map((p: any, index: number) => ({ p, index })).filter(({ p }: any) => {
                      const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                      if (parkingType === 'invygo') {
                        if (!isInvygoCar(p)) return false;
                      } else {
                        if (isInvygoCar(p)) return false;
                      }
                      if (parkingFilter === 'matched') {
                        if (parkingType === 'invygo') {
                          const isInInvygoPlates = invygoPlates.includes(plateNumber);
                          if (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name || (!isInInvygoPlates && !p.matched)) return false;
                        } else {
                          if (!p.Contract || !p.Customer_Contract) return false;
                        }
                      }
                      if (parkingFilter === 'replacement') {
                        if (parkingType === 'invygo') {
                          const isInInvygoPlates = invygoPlates.includes(plateNumber);
                          if (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name || isInInvygoPlates) return false;
                        } else {
                          return false;
                        }
                      }
                      if (parkingFilter === 'unmatched') {
                        if (parkingType === 'invygo') {
                          const isInInvygoPlates = invygoPlates.includes(plateNumber);
                          if ((p.Contract && p.Dealer_Booking_Number && p.Customer_Name) || !isInInvygoPlates) return false;
                        } else {
                          if (p.Contract && p.Customer_Contract) return false;
                        }
                      }
                      if (parkingFilter === 'edited' && !p.manual_update) return false;
                      const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                      const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
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
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Amount</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Description</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Tax Invoice</th>
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract</th>
              {parkingType === 'invygo' ? (
                <>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Dealer Booking</th>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Customer Name</th>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Model</th>
                </>
              ) : (
                <>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Booking Number</th>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Customer</th>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Pick-up Branch</th>
                  <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Model</th>
                </>
              )}
              <th style={{ padding: "10px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract Start</th>
              <th style={{ padding: "10px 4px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract End</th>
            </tr>
          </thead>
          <tbody>
            {parkingData.length > 0 ? (
              parkingData.filter((p: any) => {
                const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                
                if (parkingType === 'invygo') {
                  // Show only Invygo cars (including replacement cars)
                  if (!isInvygoCar(p)) return false;
                } else {
                  // Show only YELO cars (not Invygo)
                  if (isInvygoCar(p)) return false;
                }
                
                // Apply parking filter
                if (parkingFilter === 'matched') {
                    if (parkingType === 'invygo') {
                        const isInInvygoPlates = invygoPlates.includes(plateNumber);
                        if (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name || (!isInInvygoPlates && !p.matched)) return false;
                    } else {
                        if (!p.Contract || !p.Customer_Contract) return false;
                    }
                }
                if (parkingFilter === 'replacement') {
                    if (parkingType === 'invygo') {
                        const isInInvygoPlates = invygoPlates.includes(plateNumber);
                        if (!p.Contract || !p.Dealer_Booking_Number || !p.Customer_Name || isInInvygoPlates) return false;
                    } else {
                        return false;
                    }
                }
                if (parkingFilter === 'unmatched') {
                    if (parkingType === 'invygo') {
                        const isInInvygoPlates = invygoPlates.includes(plateNumber);
                        if ((p.Contract && p.Dealer_Booking_Number && p.Customer_Name) || !isInInvygoPlates) return false;
                    } else {
                        if (p.Contract && p.Customer_Contract) return false;
                    }
                }
                if (parkingFilter === 'edited' && !p.manual_update) return false;

                
                const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                return plateMatch || contractMatch || !search;
              }).map((p: any, index: number) => {
                const originalIndex = parkingData.indexOf(p);
                return (
                <tr key={index} style={{
                  background: p.manual_update ? '#e8f5e9' : (p.Contract ? (index % 2 === 0 ? "#FFFDE7" : "#fff") : "#FBE9E7"),
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
                    onClick={() => copyToClipboard(p.Plate_Number)}
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
                  >{p.Plate_Number}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 2 }}>{formatDate(p.Date)}</div>
                    <div style={{ fontSize: 12, color: "#333" }}>
                      {p.Time_In && p.Time_Out ? `${p.Time_In} - ${p.Time_Out}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", color: "#ff5722", fontSize: 12 }}>{p.Time || ''}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", color: "#388e3c", fontSize: 12 }}>{p.Amount}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Description}</td>
                  <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Tax_Invoice_No}</td>
                  <td style={{ 
                    padding: "8px 4px", 
                    textAlign: "center", 
                    fontWeight: "bold",
                    color: p.Contract ? "#1976d2" : "#f44336",
                    fontSize: 12
                  }}>
                    {editingIndex === originalIndex ? (
                        <input
                            type="text"
                            defaultValue={p.Contract || ''}
                            onChange={(e) => setNewContract(e.target.value)}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                updateParkingInfo(originalIndex, newContract);
                                setEditingIndex(null);
                            }
                            }}
                            onBlur={() => {
                                setEditingIndex(null);
                            }}
                            autoFocus
                        />
                        ) : (
                        <div>
                            {p.Contract || 'N/A'}
                            <button 
                                onClick={() => {
                                setEditingIndex(originalIndex);
                                setNewContract(p.Contract || '');
                                }} 
                                style={{
                                marginLeft: '5px', 
                                padding: '2px 5px', 
                                fontSize: '10px',
                                cursor: 'pointer',
                                backgroundColor: p.Contract ? '#e3f2fd' : '#ffebee',
                                border: '1px solid #ccc',
                                borderRadius: '3px'
                                }}
                            >
                                {p.Contract ? 'Edit' : 'Add'}
                            </button>
                        </div>
                        )}
                  </td>
                  {parkingType === 'invygo' ? (
                    <>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Dealer_Booking_Number}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: "bold", color: "#673ab7" }}>{p.Customer_Name}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Model}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Booking_Number}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: "bold", color: "#673ab7" }}>{p.Customer_Contract}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Pickup_Branch}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 12 }}>{p.Model_Contract}</td>
                    </>
                  )}
                  <td style={{ padding: "8px 4px", textAlign: "center", color: "#388e3c", fontSize: 12 }}>
                    {p.Contract_Start ? formatDateTime(p.Contract_Start) : ''}
                  </td>
                  <td style={{ 
                    padding: "8px 4px", 
                    textAlign: "center",
                    color: p.Contract_End === 'Open' ? "#ff5722" : "#388e3c",
                    fontWeight: p.Contract_End === 'Open' ? "bold" : "normal",
                    fontSize: 12
                  }}>
                    {p.Contract_End === 'Open' ? 'Open' : (p.Contract_End ? formatDateTime(p.Contract_End) : '')}
                  </td>
                </tr>
                )}
              )
            ) : (
              <tr>
                <td colSpan={parkingType === 'invygo' ? 14 : 15} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  {parkingFilter === 'matched' ? 'No matched parking data found.' : 
                   parkingFilter === 'unmatched' ? 'No unmatched parking data found.' : 
                   'No parking data found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    )
}

export default ParkingTable;