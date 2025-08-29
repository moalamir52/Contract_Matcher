
import React, { useRef } from 'react';

const FileUploadButton = ({ title, onUpload, accept, fileName }: { title: string, onUpload: (e: any) => void, accept: string, fileName: string | undefined }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: 'center' }}>
      <button
        onClick={handleClick}
        style={{
          background: "#FFD600",
          color: "#222",
          border: "2px solid #673ab7",
          borderRadius: 8,
          fontWeight: "bold",
          fontSize: 16,
          padding: "10px 20px",
          cursor: "pointer",
          width: 220,
          textAlign: 'center'
        }}
      >
        {title}
      </button>
      <input
        type="file"
        accept={accept}
        onChange={onUpload}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      {fileName && <span style={{ marginTop: 8, fontSize: 12, color: '#555' }}>{fileName}</span>}
    </div>
  );
};

export default FileUploadButton;
