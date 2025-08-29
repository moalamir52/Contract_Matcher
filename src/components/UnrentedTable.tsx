
import React from 'react';

const UnrentedTable = ({ unrentedToShow }: any) => {
    return (
        <div>
      <h2 style={{
        color: "#388e3c",
        fontWeight: "bold",
        marginTop: 32,
        fontSize: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: 1
      }}>
        <span role="img" aria-label="car">🚫</span> Unrented Cars
      </h2>
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
              <th style={{ padding: "16px 8px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>#</th>
              <th style={{ padding: "16px 8px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Plate No.</th>
            </tr>
          </thead>
          <tbody>
            {unrentedToShow.length > 0 ? (
              unrentedToShow.map((plate: any, idx: number) => (
                <tr key={idx} style={{
                  background: idx % 2 === 0 ? "#FFFDE7" : "#fff",
                  transition: "background 0.2s",
                  borderBottom: "1px solid #f3e6b3"
                }}>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#888", fontWeight: "bold" }}>{idx + 1}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#1976d2", textAlign: "center" }}>
                    {plate.replace(/^([a-zA-Z]+)(\d+)$/, '$1 $2')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  No unrented cars found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    )
}

export default UnrentedTable;
