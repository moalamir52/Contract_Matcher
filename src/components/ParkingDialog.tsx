
import React from 'react';

const ParkingDialog = ({ showParkingDialog, setShowParkingDialog, setParkingType, setView, parkingData, invygoPlates }: any) => {
    if (!showParkingDialog) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "#0008", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50
          }}>
            <div style={{
              background: "#fff", padding: 24, borderRadius: 18, boxShadow: "0 4px 24px #0003", maxWidth: 400, width: "100%"
            }}>
              <h3 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 24, marginBottom: 18, textAlign: "center" }}>Select Parking Type</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={() => {
                    setParkingType('invygo');
                    setView('parking');
                    setShowParkingDialog(false);
                  }}
                  style={{
                    background: "#FFD600",
                    color: "#222",
                    border: "2px solid #673ab7",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: 18,
                    padding: "12px 20px",
                    cursor: "pointer"
                  }}
                >
                  🚗 Invygo Parking ({parkingData.filter((p: any) => {
                    const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    return invygoPlates.includes(plateNumber);
                  }).length})
                </button>
                <button
                  onClick={() => {
                    setParkingType('yelo');
                    setView('parking');
                    setShowParkingDialog(false);
                  }}
                  style={{
                    background: "#FFD600",
                    color: "#222",
                    border: "2px solid #673ab7",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: 18,
                    padding: "12px 20px",
                    cursor: "pointer"
                  }}
                >
                  🅿️ YELO Parking ({parkingData.filter((p: any) => {
                    const plateNumber = (p.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
                    return !invygoPlates.includes(plateNumber);
                  }).length})
                </button>
                <button
                  onClick={() => setShowParkingDialog(false)}
                  style={{
                    background: "#fff",
                    color: "#673ab7",
                    border: "2px solid #FFD600",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: 16,
                    padding: "10px 20px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
    )
}

export default ParkingDialog;
