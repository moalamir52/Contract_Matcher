import React from 'react';
import { formatDate, formatTimeOnly } from '../utils/dates';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportDialog = ({
    showExportDialog,
    setShowExportDialog,
    view,
    parkingData,
    parkingType,
    invygoPlates,
    parkingFilter,
    search,
    startDate,
    endDate,
    contractNoHeader,
    customerHeader,
    plateNoHeader,
    pickupHeader,
    dropoffHeader,
    contractsToShow,
    invygoFilter
}: any) => {
    if (!showExportDialog) return null;

    const exportToExcel = (data: any[], fileName: string) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(blob, `${fileName}.xlsx`);
        setShowExportDialog(false);
    };

    const exportToCSV = (data: any[], fileName: string) => {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${fileName}.csv`);
        setShowExportDialog(false);
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "#0008", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50
          }}>
            <div style={{
              background: "#fff", padding: 24, borderRadius: 18, boxShadow: "0 4px 24px #0003", maxWidth: 400, width: "100%"
            }}>
              <h3 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 24, marginBottom: 18, textAlign: "center" }}>Select Export Format</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {view === 'parking' && parkingData.length > 0 ? (
                  parkingType === 'invygo' ? (
                    <>
                      <button
                        onClick={() => {
                          const parkingToShow = parkingData.filter((p: any) => {
                            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                            const isInvygoCar = invygoPlates.includes(plateNumber);
                            if (!isInvygoCar) return false;
                            
                            if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                            if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                            
                            const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                            const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                            return plateMatch || contractMatch || !search;
                          });
                          
                          const dataToExport = parkingToShow.map((p: any) => ({
                            'Plate_Number': p.Plate_Number || '',
                            'Date': formatDate(p.Date) || '',
                            'Time': formatTimeOnly(p.Time_Out) || '',
                            'Amount': p.Amount || '',
                            'Description': p.Description || '',
                            'Dealer_Booking_Number': p.Contract || '',
                            'Tax_Invoice_No': p.Tax_Invoice_No || ''
                          }));
                          
                          exportToCSV(dataToExport, `${startDate}_to_${endDate}_word`);
                        }}
                        style={{
                          background: "#4CAF50", color: "#fff", border: "2px solid #673ab7",
                          borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 16px", cursor: "pointer"
                        }}
                      >
                        📄 Parking Invoice for Word
                      </button>
                      <button
                        onClick={() => {
                          const parkingToShow = parkingData.filter((p: any) => {
                            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                            const isInvygoCar = invygoPlates.includes(plateNumber);
                            if (!isInvygoCar) return false;
                            
                            if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                            if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                            
                            const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                            const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                            return plateMatch || contractMatch || !search;
                          });
                          
                          const dataToExport = parkingToShow.map((p: any) => ({
                            'Contract': p.Contract || '',
                            'Customer Name': p.Customer_Name || '',
                            'Dealer_Booking_Number': p.Dealer_Booking_Number || '',
                            'Model': p.Model || '',
                            'Plate_Number': p.Plate_Number || '',
                            'Date': formatDate(p.Date) || '',
                            'Time_In': p.Time_In || '',
                            'Time_Out': p.Time_Out || '',
                            'Time': p.Time || '',
                            'Amount': p.Amount || '',
                            'Tax_Invoice_No': p.Tax_Invoice_No || ''
                          }));

                          exportToCSV(dataToExport, `${startDate}_to_${endDate}_upload`);
                        }}
                        style={{
                          background: "#4CAF50", color: "#fff", border: "2px solid #673ab7",
                          borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 16px", cursor: "pointer"
                        }}
                      >
                        📄 Invygo Upload
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        const parkingToShow = parkingData.filter((p: any) => {
                          const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                          const isInvygoCar = invygoPlates.includes(plateNumber);
                          if (isInvygoCar) return false;
                          
                          if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                          if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                          
                          const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                          const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                          return plateMatch || contractMatch || !search;
                        });
                        
                        const dataToExport = parkingToShow.map((p: any) => ({
                            'Plate_Number': p.Plate_Number || '',
                            'Date': formatDate(p.Date) || '',
                            'Time': p.Time || '',
                            'Amount': p.Amount || '',
                            'Description': p.Description || '',
                            'Tax_Invoice_No': p.Tax_Invoice_No || '',
                            'Contract': p.Contract || '',
                            'Booking_Number': p.Booking_Number || '',
                            'Customer': p.Customer_Contract || '',
                            'Pickup_Branch': p.Pickup_Branch || '',
                            'Model': p.Model_Contract || '',
                            'Contract_Start': p.Contract_Start || '',
                            'Contract_End': p.Contract_End || ''
                        }));

                        exportToCSV(dataToExport, `${startDate}_to_${endDate}_yelo`);
                      }}
                      style={{
                        background: "#4CAF50", color: "#fff", border: "2px solid #673ab7",
                        borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 16px", cursor: "pointer"
                      }}
                    >
                      📄 YELO CSV
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      let processedContractsToShow = contractsToShow;

                      if (view === 'unrented') {
                        processedContractsToShow = contractsToShow.map((plate: string) => ({
                          [plateNoHeader]: plate
                        }));
                      } else if (view === 'repeated') {
                        processedContractsToShow = contractsToShow.flatMap(([, rows]: any) => rows);
                      }

                      const dataToExport = processedContractsToShow.map((c: any) => ({
                        [contractNoHeader]: c[contractNoHeader] || '',
                        [customerHeader]: c[customerHeader] || '',
                        [plateNoHeader]: c[plateNoHeader] || '',
                        [pickupHeader]: c[pickupHeader] || '',
                        [dropoffHeader]: c[dropoffHeader] || ''
                      }));
                      
                      let suffix = '';
                      if (view === 'contracts') {
                        suffix = invygoFilter === 'invygo' ? 'invygo' : invygoFilter === 'other' ? 'other' : 'all';
                      } else if (view === 'unrented') {
                        suffix = 'unrented';
                      } else if (view === 'repeated') {
                        suffix = 'repeated';
                      }
                      
                      exportToCSV(dataToExport, `${startDate}_to_${endDate}_${suffix}`);
                    }}
                    style={{
                      background: "#4CAF50", color: "#fff", border: "2px solid #673ab7",
                      borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 16px", cursor: "pointer"
                    }}
                  >
                    📄 Export CSV
                  </button>
                )}
                <button
                  onClick={() => setShowExportDialog(false)}
                  style={{
                    background: "#fff", color: "#673ab7", border: "2px solid #FFD600",
                    borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 20px", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
    )
}

export default ExportDialog;