
import React from 'react';
import { formatDate } from '../utils/dates';

const ContractsTable = ({ 
    contractsToShow, 
    invygoSummary, 
    setInvygoFilter, 
    invygoFilter, 
    setSelectedContract, 
    contractNoHeader, 
    customerHeader, 
    plateNoHeader, 
    pickupHeader, 
    dropoffHeader, 
    findHeader 
}: any) => {
    return (
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
        display: "inline-block"
      }}>
        <table style={{
          background: "#fff8dc",
          border: "2px solid #FFD600",
          borderRadius: 12,
          borderCollapse: "separate",
          borderSpacing: 0,
          fontWeight: "bold",
          fontSize: 16,
          color: "#5d1789",
          overflow: "hidden"
        }}>
          <thead>
            <tr style={{background: "#FFD600"}}>
              <th style={{padding: "8px 16px", textAlign: "center", color: "#222"}}>Type</th>
              <th style={{padding: "8px 16px", textAlign: "center", color: "#222"}}>Total</th>
              <th style={{padding: "8px 16px", textAlign: "center", color: "#222"}}>🟢 Open</th>
              <th style={{padding: "8px 16px", textAlign: "center", color: "#222"}}>🔴 Closed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{padding: "8px 16px", textAlign: "center"}}>✅ Invygo</td>
              <td style={{padding: "8px 16px", textAlign: "center"}}>
                <span onClick={() => setInvygoFilter('invygo')} style={{cursor: 'pointer', textDecoration: 'underline'}}>{invygoSummary.invygoCount}</span>
              </td>
              <td style={{padding: "8px 16px", textAlign: "center"}}>
                <span onClick={() => setInvygoFilter('invygo-open')} style={{color: '#4caf50', cursor: 'pointer', textDecoration: 'underline'}}>{invygoSummary.invygoOpenCount}</span>
              </td>
              <td style={{padding: "8px 16px", textAlign: "center"}}>
                <span onClick={() => setInvygoFilter('invygo-closed')} style={{color: '#f44336', cursor: 'pointer', textDecoration: 'underline'}}>{invygoSummary.invygoClosedCount}</span>
              </td>
            </tr>
            <tr style={{background: "#fff"}}>
              <td style={{padding: "8px 16px", textAlign: "center"}}>❌ Other</td>
              <td style={{padding: "8px 16px", textAlign: "center"}}>
                <span onClick={() => setInvygoFilter('other')} style={{cursor: 'pointer', textDecoration: 'underline'}}>{invygoSummary.nonInvygoCount}</span>
              </td>
              <td style={{padding: "8px 16px", textAlign: "center"}}>
                <span onClick={() => setInvygoFilter('other-open')} style={{color: '#4caf50', cursor: 'pointer', textDecoration: 'underline'}}>{invygoSummary.otherOpenCount}</span>
              </td>
              <td style={{padding: "8px 16px", textAlign: "center"}}>
                <span onClick={() => setInvygoFilter('other-closed')} style={{color: '#f44336', cursor: 'pointer', textDecoration: 'underline'}}>{invygoSummary.otherClosedCount}</span>
              </td>
            </tr>
          </tbody>
        </table>
        {invygoFilter !== 'all' && (
          <div style={{marginTop: '8px', textAlign: 'center'}}>
            <span onClick={() => setInvygoFilter('all')} style={{cursor: 'pointer', textDecoration: 'underline', color: '#673ab7', fontWeight: 'bold'}}>(Show All)</span>
          </div>
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
              contractsToShow.map((c: any, index: number) => (
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
    )
}

export default ContractsTable;
