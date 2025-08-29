
import React from 'react';

const CopyDialog = ({ showCopyDialog, setShowCopyDialog, getAvailableColumns, selectedColumns, setSelectedColumns, copySelectedColumns }: any) => {
    if (!showCopyDialog) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "#0008", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50
          }}>
            <div style={{
              background: "#fff", padding: 24, borderRadius: 18, boxShadow: "0 4px 24px #0003", maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto"
            }}>
              <h3 style={{ color: "#673ab7", fontWeight: "bold", fontSize: 24, marginBottom: 18, textAlign: "center" }}>Select Columns to Copy</h3>
              <div style={{ marginBottom: 20 }}>
                {getAvailableColumns().map((column: any) => (
                  <label key={column} style={{ display: "block", marginBottom: 10, fontSize: 16, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns([...selectedColumns, column]);
                        } else {
                          setSelectedColumns(selectedColumns.filter((c: any) => c !== column));
                        }
                      }}
                      style={{ marginRight: 8, width: 16, height: 16 }}
                    />
                    {column}
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={copySelectedColumns}
                  disabled={selectedColumns.length === 0}
                  style={{
                    background: selectedColumns.length > 0 ? "#FFD600" : "#ccc",
                    color: "#222",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: 16,
                    padding: "10px 20px",
                    cursor: selectedColumns.length > 0 ? "pointer" : "not-allowed"
                  }}
                >
                  Copy Selected
                </button>
                <button
                  onClick={() => {
                    setShowCopyDialog(false);
                    setSelectedColumns([]);
                  }}
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

export default CopyDialog;
