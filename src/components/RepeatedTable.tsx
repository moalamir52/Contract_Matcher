
import React from 'react';

const RepeatedTable = ({ repeatedToShow, setSelectedContract, contractNoHeader }: any) => {
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
        <span role="img" aria-label="car">🚗</span> Repeated Cars in Period
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
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Plate No.</th>
              <th style={{ padding: "16px 8px", borderBottom: "2px solid #FFD600", textAlign: "center" }}>Contracts Count</th>
              <th style={{ padding: "16px 8px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center" }}>Contract Numbers</th>
            </tr>
          </thead>
          <tbody>
            {repeatedToShow.length > 0 ? (
              repeatedToShow.map(([plate, rows]: any, i: number) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "#FFFDE7" : "#fff",
                    transition: "background 0.2s",
                    borderBottom: "1px solid #f3e6b3"
                  }}
                >
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#888", fontWeight: "bold" }}>{i + 1}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#1976d2", letterSpacing: 1, textAlign: "center" }}>{plate}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#388e3c", fontWeight: "bold" }}>{rows.length}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    {rows.map((r: any, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-block",
                          margin: "0 6px 6px 0",
                          background: "#FFD600",
                          borderRadius: 8,
                          padding: "6px 14px",
                          color: "#222",
                          fontWeight: "bold",
                          fontSize: 15,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px #FFD60044",
                          border: "1.5px solid #673ab7",
                          transition: "background 0.2s, color 0.2s"
                        }}
                        onClick={() => setSelectedContract(r)}
                        title="Show contract details"
                        onMouseOver={e => {
                          (e.currentTarget as HTMLElement).style.background = "#673ab7";
                          (e.currentTarget as HTMLElement).style.color = "#FFD600";
                        }}
                        onMouseOut={e => {
                          (e.currentTarget as HTMLElement).style.background = "#FFD600";
                          (e.currentTarget as HTMLElement).style.color = "#222";
                        }}
                      >
                        {contractNoHeader ? r[contractNoHeader] : ''}
                      </span>
                    ))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                  No repeated cars found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    )
}

export default RepeatedTable;
