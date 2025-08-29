
import React from 'react';

const TemplateDialog = ({ showTemplateDialog, setShowTemplateDialog, downloadTemplate }: any) => {
    if (!showTemplateDialog) return null;

    return (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "#0008", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", padding: 24, borderRadius: 18, boxShadow: "0 4px 24px #0003", maxWidth: 350, width: "100%"
          }}>
            <h3 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 22, marginBottom: 18, textAlign: "center" }}>Download Template</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => downloadTemplate('contracts')} style={{ background: "#FFD600", color: "#222", border: "2px solid #673ab7", borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 20px", cursor: "pointer" }}>Contracts File</button>
              <button onClick={() => downloadTemplate('invygo')} style={{ background: "#FFD600", color: "#222", border: "2px solid #673ab7", borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 20px", cursor: "pointer" }}>Invygo Cars File</button>
              <button onClick={() => downloadTemplate('dealer')} style={{ background: "#FFD600", color: "#222", border: "2px solid #673ab7", borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 20px", cursor: "pointer" }}>Dealer Booking File</button>
              <button onClick={() => downloadTemplate('parking')} style={{ background: "#FFD600", color: "#222", border: "2px solid #673ab7", borderRadius: 8, fontWeight: "bold", fontSize: 16, padding: "10px 20px", cursor: "pointer" }}>Parking File</button>
              <button onClick={() => setShowTemplateDialog(false)} style={{ background: "#fff", color: "#673ab7", border: "2px solid #FFD600", borderRadius: 8, fontWeight: "bold", fontSize: 15, padding: "8px 18px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
    )
}

export default TemplateDialog;
