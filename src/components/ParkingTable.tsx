
import React from 'react';
import { formatDate, formatDateTime } from '../utils/dates';

const ParkingTable = ({ 
    parkingData, 
    parkingType, 
    setParkingFilter, 
    parkingFilter, 
    invygoPlates, 
    search, 
    copyToClipboard 
}: any) => {
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
        ✅ Matched: <span 
          onClick={() => setParkingFilter('matched')} 
          style={{color: "#388e3c", cursor: 'pointer', textDecoration: 'underline'}}
        >
          {parkingData.filter((p: any) => {
            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
            const isCorrectType = parkingType === 'invygo' ? invygoPlates.includes(plateNumber) : !invygoPlates.includes(plateNumber);
            return isCorrectType && p.Contract;
          }).length}
        </span> &nbsp; | &nbsp;
        ❌ Unmatched: <span 
          onClick={() => setParkingFilter('unmatched')} 
          style={{color: "#f44336", cursor: 'pointer', textDecoration: 'underline'}}
        >
          {parkingData.filter((p: any) => {
            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
            const isCorrectType = parkingType === 'invygo' ? invygoPlates.includes(plateNumber) : !invygoPlates.includes(plateNumber);
            return isCorrectType && !p.Contract;
          }).length}
        </span>
        {parkingFilter !== 'all' && (
          <span onClick={() => setParkingFilter('all')} style={{cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px'}}> (Show All)</span>
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
                  // Show only Invygo cars
                  const isInvygoCar = invygoPlates.includes(plateNumber);
                  if (!isInvygoCar) return false;
                } else {
                  // Show only YELO cars (not in Invygo)
                  const isInvygoCar = invygoPlates.includes(plateNumber);
                  if (isInvygoCar) return false;
                }
                
                // Apply parking filter
                if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                
                const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                return plateMatch || contractMatch || !search;
              }).map((p: any, index: number) => (
                <tr key={index} style={{
                  background: p.Contract ? (index % 2 === 0 ? "#FFFDE7" : "#fff") : "#FBE9E7",
                  transition: "background 0.2s",
                  borderBottom: "1px solid #f3e6b3"
                }}>
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
                  }}>{p.Contract || p.Contract_No || 'Switch'}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan={parkingType === 'invygo' ? 13 : 14} style={{ textAlign: "center", color: "#888", padding: 24 }}>
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
