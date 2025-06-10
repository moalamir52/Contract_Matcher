// CarRentalFilterFinal.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value, { date1904: false }) ?
      new Date(Date.UTC(1899, 11, 30) + value * 86400000) : null;
  }
  if (typeof value === 'string') {
    const parts = value.split(/[\/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => parseInt(p));
      if (year > 1900 && month <= 12 && day <= 31) {
        return new Date(year, month - 1, day);
      }
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDate(value: any): string {
  const date = parseExcelDate(value);
  if (!date) return value;
  return date.toLocaleDateString('en-GB');
}

export default function CarRentalFilter() {
  const [contracts, setContracts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRepeated, setShowRepeated] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [invygoPlates, setInvygoPlates] = useState<string[]>([]);
  const [unrentedPlates, setUnrentedPlates] = useState<string[]>([]);
  const [showUnrentedTable, setShowUnrentedTable] = useState(false);
  const [repeatedContracts, setRepeatedContracts] = useState<any[]>([]);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (modalRef.current && !(modalRef.current as any).contains(e.target)) {
        setSelectedContract(null);
        setShowRepeated(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet).filter(row => Object.values(row).some(v => v !== null && v !== ''));
      setContracts(jsonData as any[]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInvygoUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet).filter(row => Object.values(row).some(v => v !== null && v !== ''));
      const plates = jsonData.map((row: any) => (row['Plate No'] || '').toString().replace(/\s/g, '').trim());
      setInvygoPlates(plates);
    };
    reader.readAsArrayBuffer(file);
  };

  const filterContracts = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = contracts.filter((c: any) => {
      const pickup = parseExcelDate(c['Pick-up Date']);
      const dropoff = parseExcelDate(c['Drop-off Date']);
      const plate = (c['Plate No.'] || '').toString().replace(/\s/g, '').trim();
      return pickup && dropoff && pickup <= end && dropoff >= start && invygoPlates.includes(plate);
    });

    const rentedPlates = new Set(result.map((c: any) => (c['Plate No.'] || '').toString().replace(/\s/g, '').trim()));
    const notRented = invygoPlates.filter(plate => !rentedPlates.has(plate));

    const grouped: Record<string, any[]> = {};
    result.forEach((c: any) => {
      const plate = c['Plate No.'] || 'Unknown';
      if (!grouped[plate]) grouped[plate] = [];
      grouped[plate].push(c);
    });
    const repeated = Object.entries(grouped).filter(([_, arr]) => arr.length > 1);
    setRepeatedContracts(repeated);

    setFiltered(result);
    setUnrentedPlates(notRented);
  };

  const searched = filtered.filter((c: any) => {
    return (
      c['Plate No.']?.toString().toLowerCase().includes(search.toLowerCase()) ||
      c['Contract No.']?.toString().toLowerCase().includes(search.toLowerCase()) ||
      c['Customer']?.toString().toLowerCase().includes(search.toLowerCase())
    );
  }).sort((a: any, b: any) => {
    const dateA = parseExcelDate(a['Pick-up Date'])?.getTime() || 0;
    const dateB = parseExcelDate(b['Pick-up Date'])?.getTime() || 0;
    return dateA - dateB;
  });

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-purple-800">📁 رفع ملف العقود</h2>
        {filtered.length > 0 && repeatedContracts.length > 0 && (
          <button
            onClick={() => setShowRepeated(!showRepeated)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500"
          >
            🚗 عرض السيارات المكررة
          </button>
        )}
      </div>

      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="mb-2" />
      <input type="file" accept=".xlsx, .xls" onChange={handleInvygoUpload} className="mb-4" />

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="mr-2">من:</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
        <label className="mx-2">إلى:</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
        <button onClick={filterContracts} className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-300 transition">عرض العقود</button>
        <input type="text" placeholder="🔍 بحث" value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded ml-4" />
        {unrentedPlates.length > 0 && (
          <button onClick={() => setShowUnrentedTable(!showUnrentedTable)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500">🚫 عرض الغير مؤجرة</button>
        )}
      </div>

      {showRepeated && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div ref={modalRef} className="bg-white p-6 rounded shadow max-w-xl w-full">
            <h3 className="text-lg font-bold text-purple-700 mb-4">🚗 سيارات مكررة</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="border p-1">Plate No.</th>
                  <th className="border p-1"># Rentals</th>
                  <th className="border p-1">Contract Numbers</th>
                </tr>
              </thead>
              <tbody>
                {repeatedContracts.map(([plate, rows], i) => (
                  <tr key={i} className="border">
                    <td className="border p-1 font-semibold">{plate}</td>
                    <td className="border p-1 text-center">{rows.length}</td>
                    <td className="border p-1">
                      {rows.map((r: any, idx: number) => (
                        <div key={idx}>{r['Contract No.']}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <h3 className="font-semibold mb-2 text-green-700">📋 عقود سيارات Invygo خلال الفترة:</h3>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-purple-100">
                  <th className="border p-1">#</th>
                  <th className="border p-1">Contract No.</th>
                  <th className="border p-1">Customer</th>
                  <th className="border p-1">Plate No.</th>
                  <th className="border p-1">Pick-up</th>
                  <th className="border p-1">Drop-off</th>
                </tr>
              </thead>
              <tbody>
                {searched.map((c: any, index) => (
                  <tr
                    key={index}
                    className="border hover:bg-yellow-50 cursor-pointer"
                    onClick={() => setSelectedContract(c)}
                  >
                    <td className="border p-1 text-center">{index + 1}</td>
                    <td className="border p-1">{c['Contract No.']}</td>
                    <td className="border p-1">{c['Customer']}</td>
                    <td className="border p-1">{c['Plate No.']}</td>
                    <td className="border p-1">{formatDate(c['Pick-up Date'])}</td>
                    <td className="border p-1">{formatDate(c['Drop-off Date'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showUnrentedTable && unrentedPlates.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-red-700 mb-2">🚫 سيارات Invygo لم تُؤجر خلال الفترة:</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-red-100">
                <th className="border p-1">#</th>
                <th className="border p-1">Plate No.</th>
              </tr>
            </thead>
            <tbody>
              {unrentedPlates.map((plate, idx) => (
                <tr key={idx}>
                  <td className="border p-1 text-center">{idx + 1}</td>
                  <td className="border p-1">{plate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedContract && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div ref={modalRef} className="bg-white p-6 rounded shadow max-w-xl w-full overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-bold text-purple-700 mb-4">📄 تفاصيل العقد</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(selectedContract).map(([key, value], idx) => (
                <div key={idx} className="flex">
                  <div className="font-semibold w-40 text-purple-800">{key}:</div>
                  <div>{key.includes('Date') ? formatDate(value) : value?.toString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
