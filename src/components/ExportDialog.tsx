import React from 'react';
import { formatDate, formatTimeOnly } from '../utils/dates';

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
                            
                            // Apply parking filter
                            if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                            if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                            
                            // Apply search filter
                            const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                            const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                            return plateMatch || contractMatch || !search;
                          });
                          
                          const headers = ['Plate_Number', 'Date', 'Time', 'Amount', 'Description', 'Dealer_Booking_Number', 'Tax_Invoice_No'];
                          const dataRowsStrings = parkingToShow.map((p: any) => [
                            p.Plate_Number || '', formatDate(p.Date) || '', formatTimeOnly(p.Time_Out) || '', p.Amount || '',
                            p.Description || '', p.Contract || '', p.Tax_Invoice_No || ''
                          ].join(','));
                          
                          const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," + [headers.join(','), ...dataRowsStrings].join("\n");
                          const link = document.createElement("a");
                          link.setAttribute("href", encodeURI(csvContent));
                          link.setAttribute("download", `invygo_parking-charges-format_${startDate}_to_${endDate}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setShowExportDialog(false);
                        }}
                        style={{
                          background: "#FFD600", color: "#222", border: "2px solid #673ab7",
                          borderRadius: 8, fontWeight: "bold", fontSize: 18, padding: "12px 20px", cursor: "pointer"
                        }}
                      >
                        📊 Parking Charges Format
                      </button>
                      <button
                        onClick={() => {
                          const parkingToShow = parkingData.filter((p: any) => {
                            const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                            const isInvygoCar = invygoPlates.includes(plateNumber);
                            if (!isInvygoCar) return false;
                            
                            // Apply parking filter
                            if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                            if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                            
                            // Apply search filter
                            const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                            const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                            return plateMatch || contractMatch || !search;
                          });
                          
                          const headers = ['Contract', 'Dealer_Booking_Number', 'Model', 'Plate_Number', 'Date', 'Time', 'Time_In', 'Time_Out', 'Amount', 'Customer_Name', 'Tax_Invoice_No'];
                          const dataRowsStrings = parkingToShow.map((p: any) => [
                            p.Contract || '', p.Dealer_Booking_Number || '', p.Model || '', p.Plate_Number || '',
                            formatDate(p.Date) || '', p.Time || '', p.Time_In || '', p.Time_Out || '',
                            p.Amount || '', p.Customer_Name || '', p.Tax_Invoice_No || ''
                          ].join(','));
                          
                          const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," + [headers.join(','), ...dataRowsStrings].join("\n");
                          const link = document.createElement("a");
                          link.setAttribute("href", encodeURI(csvContent));
                          link.setAttribute("download", `invygo_Parking_Word_${startDate}_to_${endDate}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setShowExportDialog(false);
                        }}
                        style={{
                          background: "#FFD600", color: "#222", border: "2px solid #673ab7",
                          borderRadius: 8, fontWeight: "bold", fontSize: 18, padding: "12px 20px", cursor: "pointer"
                        }}
                      >
                        📄 Parking Word Format
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        const parkingToShow = parkingData.filter((p: any) => {
                          const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                          const isInvygoCar = invygoPlates.includes(plateNumber);
                          if (isInvygoCar) return false;
                          
                          // Apply parking filter
                          if (parkingFilter === 'matched' && (!p.Contract || p.Contract === '')) return false;
                          if (parkingFilter === 'unmatched' && (p.Contract && p.Contract !== '')) return false;
                          
                          // Apply search filter
                          const plateMatch = p.Plate_Number?.toString().toLowerCase().includes(search.toLowerCase());
                          const contractMatch = p.Contract?.toString().toLowerCase().includes(search.toLowerCase());
                          return plateMatch || contractMatch || !search;
                        });
                        
                        const headers = ['Plate_Number', 'Date', 'Time', 'Amount', 'Description', 'Tax_Invoice_No', 'Contract', 'Booking_Number', 'Customer', 'Pickup_Branch', 'Model', 'Contract_Start', 'Contract_End'];
                        const dataRowsStrings = parkingToShow.map((p: any) => [
                          p.Plate_Number || '', p.Date || '', p.Time || '', p.Amount || '',
                          p.Description || '', p.Tax_Invoice_No || '', p.Contract || '',
                          p.Booking_Number || '', p.Customer_Contract || '', p.Pickup_Branch || '',
                          p.Model_Contract || '', p.Contract_Start || '', p.Contract_End || ''
                        ].join(','));
                        
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...dataRowsStrings].join("\n");
                        const link = document.createElement("a");
                        link.setAttribute("href", encodeURI(csvContent));
                        link.setAttribute("download", `yelo_complete_parking_data_${startDate}_to_${endDate}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setShowExportDialog(false);
                      }}
                      style={{
                        background: "#FFD600", color: "#222", border: "2px solid #673ab7",
                        borderRadius: 8, fontWeight: "bold", fontSize: 18, padding: "12px 20px", cursor: "pointer"
                      }}
                    >
                      📊 Complete YELO Parking Data
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      let processedContractsToShow = contractsToShow;

                      if (view === 'unrented') {
                        // Transform array of plate strings into array of objects
                        processedContractsToShow = contractsToShow.map((plate: string) => ({
                          [plateNoHeader]: plate
                        }));
                      } else if (view === 'repeated') {
                        // Flatten the [plate, rows] structure into a single array of contract objects
                        processedContractsToShow = contractsToShow.flatMap(([, rows]: any) => rows);
                      }

                      const headerRowString = [contractNoHeader, customerHeader, plateNoHeader, pickupHeader, dropoffHeader].filter(h => h).join(",");
                      const dataRowsStrings = processedContractsToShow.map((c: any) => [
                        contractNoHeader ? c[contractNoHeader] : '', customerHeader ? c[customerHeader] : '',
                        plateNoHeader ? c[plateNoHeader] : '', pickupHeader ? c[pickupHeader] : '',
                        dropoffHeader ? c[dropoffHeader] : ''
                      ].join(','));
                      
                      let prefix = '';
                      if (view === 'contracts') {
                        prefix = invygoFilter === 'invygo' ? 'Invygo_Contracts' : invygoFilter === 'other' ? 'Other_Contracts' : 'All_Contracts';
                      } else if (view === 'unrented') {
                        prefix = 'Unrented_Cars';
                      } else if (view === 'repeated') {
                        prefix = 'Repeated_Cars';
                      }
                      
                      const csvContent = "data:text/csv;charset=utf-8," + [headerRowString, ...dataRowsStrings].join("\n");
                      const link = document.createElement("a");
                      link.setAttribute("href", encodeURI(csvContent));
                      link.setAttribute("download", `${prefix}_${startDate}_to_${endDate}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setShowExportDialog(false);
                    }}
                    style={{
                      background: "#FFD600", color: "#222", border: "2px solid #673ab7",
                      borderRadius: 8, fontWeight: "bold", fontSize: 18, padding: "12px 20px", cursor: "pointer"
                    }}
                  >
                    📊 Export CSV
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
