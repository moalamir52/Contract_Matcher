
import React from 'react';

const ContractDetailsModal = ({ selectedContract, modalRef }: any) => {
    if (!selectedContract) return null;

    return (
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
                    {Object.entries(selectedContract).map(([key, value]: any, idx: number) => (
                      <tr key={idx} style={{
                        background: idx % 2 === 0 ? "#FFFDE7" : "#fff",
                        transition: "background 0.2s",
                        borderBottom: "1px solid #f3e6b3"
                      }}>
                        <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#673ab7", textAlign: "center" }}>{key}</td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
    )
}

export default ContractDetailsModal;
