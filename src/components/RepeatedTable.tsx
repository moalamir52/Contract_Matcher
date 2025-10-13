
import React, { useState, useMemo } from 'react';
import { formatDate } from '../utils/dates';

const RepeatedTable = ({ repeatedToShow, setSelectedContract, contractNoHeader, customerHeader, pickupHeader, dropoffHeader, statusHeader }: any) => {
  const [minContracts, setMinContracts] = useState(0);
  const [detailSearch, setDetailSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  const filteredData = useMemo(() => {
    return repeatedToShow.filter(([plate, rows]: any) => {
      if (minContracts === 0) return true; // Show all
      return rows.length === minContracts;
    });
  }, [repeatedToShow, minContracts]);

  const allContracts = useMemo(() => {
    const contracts: any[] = [];
    filteredData.forEach(([plate, rows]: any) => {
      rows.forEach((contract: any) => {
        contracts.push({ ...contract, plateName: plate });
      });
    });
    return contracts;
  }, [filteredData]);

  const filteredContracts = useMemo(() => {
    return allContracts.filter((contract: any) => {
      const plateMatch = contract.plateName?.toLowerCase().includes(detailSearch.toLowerCase());
      const customerMatch = customerHeader ? contract[customerHeader]?.toString().toLowerCase().includes(detailSearch.toLowerCase()) : false;
      const contractMatch = contractNoHeader ? contract[contractNoHeader]?.toString().toLowerCase().includes(detailSearch.toLowerCase()) : false;
      
      const searchMatch = plateMatch || customerMatch || contractMatch || !detailSearch;
      
      if (statusFilter === 'all') return searchMatch;
      
      const status = statusHeader ? contract[statusHeader]?.toString().toLowerCase() : 'unknown';
      const isActive = status === 'open' || status === 'active';
      
      if (statusFilter === 'active') return searchMatch && isActive;
      if (statusFilter === 'closed') return searchMatch && !isActive;
      
      return searchMatch;
    });
  }, [allContracts, detailSearch, statusFilter, customerHeader, contractNoHeader, statusHeader]);

  const stats = useMemo(() => {
    const totalRepeated = repeatedToShow.length;
    const totalContracts = repeatedToShow.reduce((sum: number, [, rows]: any) => sum + rows.length, 0);
    const avgContracts = totalRepeated > 0 ? (totalContracts / totalRepeated).toFixed(1) : 0;
    return { totalRepeated, totalContracts, avgContracts };
  }, [repeatedToShow]);

  return (
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
        <span role="img" aria-label="car">🚗</span> Repeated Cars ({stats.totalRepeated})
      </h2>

      {/* Statistics */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 16,
        marginBottom: 16
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #673ab7, #9c27b0)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 12,
          textAlign: 'center',
          minWidth: 120
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.totalRepeated}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Repeated Cars</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #ff9800, #f57c00)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 12,
          textAlign: 'center',
          minWidth: 120
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.totalContracts}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Total Contracts</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4caf50, #388e3c)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 12,
          textAlign: 'center',
          minWidth: 120
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.avgContracts}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Avg per Car</div>
        </div>
      </div>



      {/* Detailed Table */}
      {filteredData.length > 0 && (
        <div style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 8px 32px #673ab755",
          padding: 0,
          marginBottom: 20,
          overflow: "auto",
          border: "3px solid #673ab7"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #673ab7 0%, #9c27b0 50%, #e1bee7 100%)",
            color: "white",
            padding: 20,
            fontWeight: "bold",
            fontSize: 20,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            textAlign: "center",
            boxShadow: "0 4px 8px rgba(103, 58, 183, 0.3)"
          }}>
            📋 Detailed Contract Information ({filteredContracts.length} of {allContracts.length} Contracts)
          </div>
          
          {/* Detail Filters */}
          <div style={{
            background: '#f8f9fa',
            padding: 16,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
            borderBottom: '2px solid #e0e0e0'
          }}>
            <input
              type="text"
              placeholder="🔍 Search contracts, customers, plates..."
              value={detailSearch}
              onChange={(e) => setDetailSearch(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #673ab7',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 250,
                outline: 'none'
              }}
            />
            <select
              value={minContracts}
              onChange={(e) => setMinContracts(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '2px solid #673ab7',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none'
              }}
            >
              <option value={0}>All repeated cars</option>
              <option value={2}>Exactly 2 contracts</option>
              <option value={3}>Exactly 3 contracts</option>
              <option value={4}>Exactly 4 contracts</option>
              <option value={5}>Exactly 5 contracts</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'closed')}
              style={{
                padding: '8px 12px',
                border: '2px solid #673ab7',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none'
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="closed">Closed Only</option>
            </select>
            <button
              onClick={() => {
                setDetailSearch('');
                setStatusFilter('all');
                setMinContracts(0);
              }}
              style={{
                padding: '8px 12px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              Clear Filters
            </button>
          </div>
          
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            border: "none"
          }}>
            <thead>
              <tr style={{
                background: "linear-gradient(90deg, #673ab7 0%, #9c27b0 100%)",
                color: "white",
                fontWeight: "bold"
              }}>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>#</th>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>🚗 Plate</th>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>📋 Contract</th>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>👤 Customer</th>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>📅 Pick-up</th>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>📅 Drop-off</th>
                <th style={{ padding: "14px 12px", textAlign: "center", border: "2px solid #673ab7", borderBottom: "3px solid #673ab7", fontSize: 13, backgroundColor: "#673ab7" }}>🟢 Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // تجميع العقود حسب رقم اللوحة
                const groupedContracts: { [key: string]: any[] } = {};
                filteredContracts.forEach((contract: any) => {
                  if (!groupedContracts[contract.plateName]) {
                    groupedContracts[contract.plateName] = [];
                  }
                  groupedContracts[contract.plateName].push(contract);
                });

                let rowIndex = 0;
                return Object.entries(groupedContracts).map(([plateName, contracts], groupIdx) => {
                  return contracts.map((contract: any, contractIdx: number) => {
                    const status = statusHeader ? contract[statusHeader]?.toString().toLowerCase() : 'unknown';
                    const isActive = status === 'open' || status === 'active';
                    const isFirstInGroup = contractIdx === 0;
                    const isLastInGroup = contractIdx === contracts.length - 1;
                    rowIndex++;
                    
                    return (
                      <tr
                        key={`${contract.plateName}-${contractIdx}`}
                        style={{
                          background: isActive ? "#e8f5e8" : (rowIndex % 2 === 0 ? "#fafafa" : "#fff"),
                          borderBottom: isLastInGroup ? "4px solid #673ab7" : "1px solid #e0e0e0",
                          borderTop: isFirstInGroup ? "3px solid #FFD600" : "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          position: "relative"
                        }}
                        onClick={() => setSelectedContract(contract)}
                        onMouseOver={e => {
                          (e.currentTarget as HTMLElement).style.background = "#e3f2fd";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.01)";
                        }}
                        onMouseOut={e => {
                          (e.currentTarget as HTMLElement).style.background = isActive ? "#e8f5e8" : (rowIndex % 2 === 0 ? "#fafafa" : "#fff");
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        }}
                      >
                        <td style={{ 
                          padding: "12px 12px", 
                          textAlign: "center", 
                          color: "#888", 
                          fontWeight: "bold", 
                          border: "1px solid #ddd",
                          position: "relative"
                        }}>
                          {rowIndex}
                          {/* مؤشر المجموعة */}
                          {isFirstInGroup && contracts.length > 1 && (
                            <div style={{
                              position: "absolute",
                              left: "2px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "3px",
                              height: "20px",
                              background: "#FFD600",
                              borderRadius: "2px"
                            }} />
                          )}
                        </td>
                        <td style={{ 
                          padding: "12px 12px", 
                          textAlign: "center", 
                          fontWeight: "bold", 
                          color: "#1976d2", 
                          fontSize: 14, 
                          border: "1px solid #ddd",
                          position: "relative"
                        }}>
                          {plateName}
                          {/* عداد العقود للوحة */}
                          {isFirstInGroup && contracts.length > 1 && (
                            <span style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "#673ab7",
                              color: "white",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              fontSize: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold"
                            }}>
                              {contracts.length}
                            </span>
                          )}
                          {/* خط ربط للعقود المتعددة */}
                          {contracts.length > 1 && !isLastInGroup && (
                            <div style={{
                              position: "absolute",
                              right: "8px",
                              bottom: "-2px",
                              width: "2px",
                              height: "4px",
                              background: "#673ab7"
                            }} />
                          )}
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: "600", color: "#333", border: "1px solid #ddd" }}>{contractNoHeader ? contract[contractNoHeader] : ''}</td>
                        <td style={{ padding: "12px 12px", textAlign: "center", color: "#555", fontWeight: "500", border: "1px solid #ddd" }}>{customerHeader ? contract[customerHeader] : 'N/A'}</td>
                        <td style={{ padding: "12px 12px", textAlign: "center", color: "#666", fontSize: 13, border: "1px solid #ddd" }}>
                          {pickupHeader && contract[pickupHeader] ? formatDate(contract[pickupHeader]) : 'N/A'}
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", color: "#666", fontSize: 13, border: "1px solid #ddd" }}>
                          {isActive ? (
                            <span style={{ color: "#4caf50", fontWeight: "bold" }}>Open Contract</span>
                          ) : (
                            dropoffHeader && contract[dropoffHeader] ? formatDate(contract[dropoffHeader]) : 'N/A'
                          )}
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", border: "1px solid #ddd" }}>
                          <span style={{
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: "bold",
                            background: isActive ? "linear-gradient(45deg, #4caf50, #66bb6a)" : "linear-gradient(45deg, #f44336, #ef5350)",
                            color: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}>
                            {isActive ? '✓ Active' : '✗ Closed'}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                }).flat();
              })()}
            </tbody>
          </table>
        </div>
      )}




    </div>
    )
}

export default RepeatedTable;
