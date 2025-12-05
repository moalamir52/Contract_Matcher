import React, { useState } from 'react';
import { formatDate } from '../utils/dates';

const SalikSummaryTable = ({ 
    salikData, 
    salikType, 
    invygoPlates, 
    search, 
    setShowSalikSummary,
    dealerBookings,
    summaryFilter,
    setSummaryFilter
}: any) => {
    const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
    const [invoiceValues, setInvoiceValues] = useState<{[key: string]: string}>({});

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Show a brief visual feedback
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    };

    const isInvygoCar = (s: any) => {
        const plateNumber = (s.Plate_Number || '').toString().replace(/\s/g, '').trim().toUpperCase();
        const hasInvygoPlate = invygoPlates.includes(plateNumber);
        const hasDealerBooking = s.Contract && dealerBookings && dealerBookings.some((booking: any) => 
            booking['Agreement']?.toString() === s.Contract?.toString()
        );
        return hasInvygoPlate || hasDealerBooking;
    };
    
    const typedSalikData = salikData.filter((s: any) => {
        const isInvygoType = isInvygoCar(s);
        return salikType === 'invygo' ? isInvygoType : !isInvygoType;
    });

    // Group by contract
    const groupedData = typedSalikData.reduce((acc: any, item: any) => {
        const contract = item.Contract || 'No Contract';
        if (!acc[contract]) {
            const dealerBooking = dealerBookings.find((booking: any) => 
                booking['Agreement']?.toString() === contract?.toString()
            );
            
            acc[contract] = {
                invoice: `INV-${contract}-${new Date().getFullYear()}`,
                originalInvoice: `INV-${contract}-${new Date().getFullYear()}`,
                contractKey: contract,
                customer: item.CustomerName || 'Unknown',
                bookingNumber: dealerBooking ? dealerBooking['Booking ID'] : '',
                contractNo: contract,
                model: dealerBooking ? `${dealerBooking['Brand Name'] || ''} ${dealerBooking['Car Name'] || ''} ${dealerBooking['Car Year'] || ''}`.trim() : '',
                plateNo: item.Plate_Number,
                startDate: item.Contract_Start,
                endDate: item.Contract_End,
                month: new Date(item.Date).toLocaleString('default', { month: 'long', year: 'numeric' }),
                trips: [],
                totalAmount: 0,
                invoiceDate: new Date().toISOString().split('T')[0]
            };
        }
        acc[contract].trips.push(item);
        acc[contract].totalAmount += Number(item.Amount || 0);
        return acc;
    }, {});

    const summaryData = Object.values(groupedData).map((group: any) => ({
        ...group,
        invoice: invoiceValues[group.contractKey] || group.invoice
    })).filter((group: any) => {
        // Apply search filter
        if (search && !(group.contractNo.toLowerCase().includes(search.toLowerCase()) ||
               group.customer.toLowerCase().includes(search.toLowerCase()))) {
            return false;
        }
        
        // Apply status filter
        if (summaryFilter === 'open') {
            return group.endDate === 'Open';
        }
        if (summaryFilter === 'closed') {
            return group.endDate !== 'Open';
        }
        
        return true; // 'all' filter
    });

    const updateSequentialInvoices = (editedContract: string, newValue: string) => {
        const match = newValue.match(/^(.+?)(\d+)$/);
        if (!match) return;
        
        const [, prefix, startNum] = match;
        const startNumber = parseInt(startNum);
        
        const newInvoiceValues = {...invoiceValues};
        
        // Get the actual order from summaryData
        const contractOrder = summaryData.map(group => group.contractKey);
        const editedIndex = contractOrder.indexOf(editedContract);
        
        if (editedIndex !== -1) {
            contractOrder.forEach((contract, index) => {
                if (index >= editedIndex) {
                    const sequentialNumber = startNumber + (index - editedIndex);
                    newInvoiceValues[contract] = `${prefix}${sequentialNumber}`;
                }
            });
            setInvoiceValues(newInvoiceValues);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                        onClick={() => setShowSalikSummary(false)}
                        style={{
                            background: "#673ab7",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: "bold",
                            fontSize: 14,
                            padding: "8px 16px",
                            cursor: "pointer"
                        }}
                    >
                        ← Back to Details
                    </button>
                    <h2 style={{
                        color: "#ff5722",
                        fontWeight: "bold",
                        fontSize: 28,
                        margin: 0
                    }}>
                        📊 Salik Summary - {salikType === 'invygo' ? 'Invygo' : 'YELO'}
                    </h2>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                        onClick={() => setSummaryFilter('all')}
                        style={{
                            background: summaryFilter === 'all' ? "#FFD600" : "#fff",
                            color: summaryFilter === 'all' ? "#222" : "#673ab7",
                            border: "2px solid #FFD600",
                            borderRadius: 6,
                            fontWeight: "bold",
                            fontSize: 12,
                            padding: "4px 8px",
                            cursor: "pointer"
                        }}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setSummaryFilter('open')}
                        style={{
                            background: summaryFilter === 'open' ? "#FFD600" : "#fff",
                            color: summaryFilter === 'open' ? "#222" : "#673ab7",
                            border: "2px solid #FFD600",
                            borderRadius: 6,
                            fontWeight: "bold",
                            fontSize: 12,
                            padding: "4px 8px",
                            cursor: "pointer"
                        }}
                    >
                        Open
                    </button>
                    <button
                        onClick={() => setSummaryFilter('closed')}
                        style={{
                            background: summaryFilter === 'closed' ? "#FFD600" : "#fff",
                            color: summaryFilter === 'closed' ? "#222" : "#673ab7",
                            border: "2px solid #FFD600",
                            borderRadius: 6,
                            fontWeight: "bold",
                            fontSize: 12,
                            padding: "4px 8px",
                            cursor: "pointer"
                        }}
                    >
                        Closed
                    </button>
                </div>
                <button
                    onClick={async () => {
                        try {
                            console.log('Starting ZIP creation...');
                            const JSZip = (await import('jszip')).default;
                            const zip = new JSZip();
                            
                            console.log('JSZip loaded, creating files...');
                            
                            // Add summary file
                            const summaryContent = [
                                ['INVOICE', 'Customer', 'Booking Number', 'Contract No.', 'Model', 'Plate No.', 'Date', 'End Date', 'Month', 'Salik Trips', 'Total Price', 'Invoice_Date'].join(','),
                                ...summaryData.map(group => [
                                    group.invoice,
                                    group.customer,
                                    group.bookingNumber,
                                    group.contractNo,
                                    group.model,
                                    group.plateNo,
                                    formatDate(group.startDate),
                                    group.endDate === 'Open' ? 'Open' : formatDate(group.endDate),
                                    group.month,
                                    group.trips.length,
                                    group.totalAmount.toFixed(2),
                                    group.invoiceDate
                                ].join(','))
                            ].join('\n');
                            
                            const summaryFileName = `Salik_Summary_${salikType === 'invygo' ? 'Invygo' : 'YELO'}_${new Date().toISOString().split('T')[0]}.csv`;
                            zip.file(summaryFileName, summaryContent);
                            console.log('Summary file added:', summaryFileName);
                            
                            // Add individual invoice files
                            summaryData.forEach((group, index) => {
                                const individualContent = [
                                    // Trip details header
                                    ['Trip_Date', 'Trip_Time', 'Dealer_Booking_Number', 'Plate_Number', 'Toll_Gate', 'Direction', 'Amount', 'Tax_Invoice_No'].join(','),
                                    // Trip details
                                    ...group.trips.map((trip: any) => [
                                        formatDate(trip.Date),
                                        trip.Time || '',
                                        group.bookingNumber || '',
                                        group.plateNo || '',
                                        trip.Gate || '',
                                        trip.Direction || '',
                                        trip.Amount || '0',
                                        group.invoice
                                    ].join(','))
                                ].join('\n');
                                
                                const fileName = `Individual_Invoices/${group.invoice}_${new Date().toISOString().split('T')[0]}.csv`;
                                zip.file(fileName, individualContent);
                                console.log(`Individual file ${index + 1} added:`, fileName);
                            });
                            
                            console.log('Generating ZIP blob...');
                            // Generate and download ZIP
                            const zipBlob = await zip.generateAsync({type: 'blob'});
                            console.log('ZIP blob generated, size:', zipBlob.size);
                            
                            const url = URL.createObjectURL(zipBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            const zipFileName = `Salik_Export_${salikType === 'invygo' ? 'Invygo' : 'YELO'}_${new Date().toISOString().split('T')[0]}.zip`;
                            a.download = zipFileName;
                            console.log('Downloading ZIP file:', zipFileName);
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            console.log('ZIP download completed!');
                        } catch (error) {
                            console.error('Error creating ZIP:', error);
                            alert(`Error creating ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    }}
                    style={{
                        background: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: "bold",
                        fontSize: 14,
                        padding: "8px 16px",
                        cursor: "pointer"
                    }}
                >
                    📦 Export ZIP Package
                </button>
            </div>

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
                    fontSize: 14
                }}>
                    <thead>
                        <tr style={{
                            background: "linear-gradient(90deg,#FFD600 60%,#fffbe7 100%)",
                            color: "#222",
                            fontWeight: "bold",
                            fontSize: 14,
                            boxShadow: "0 2px 8px #FFD60055"
                        }}>
                            <th style={{ padding: "8px 4px", borderTopLeftRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>#</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>INVOICE</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Customer</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Booking Number</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Contract No.</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Model</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Plate No.</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Date</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>End Date</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Month</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Salik Trips</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Total Price</th>
                            <th style={{ padding: "8px 4px", borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Invoice Date</th>
                            <th style={{ padding: "8px 4px", borderTopRightRadius: 18, borderBottom: "2px solid #FFD600", textAlign: "center", fontSize: 12 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.length > 0 ? (
                            summaryData.map((group: any, index: number) => (
                                <tr key={index} style={{
                                    background: index % 2 === 0 ? "#FFFDE7" : "#fff",
                                    transition: "background 0.2s",
                                    borderBottom: "1px solid #f3e6b3"
                                }}>
                                    <td style={{ padding: "6px 4px", textAlign: "center", color: "#888", fontWeight: "bold", fontSize: 12 }}>{index + 1}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontWeight: "bold", color: "#1976d2", fontSize: 11 }}>
                                        {editingInvoice === group.contractKey ? (
                                            <input
                                                type="text"
                                                value={invoiceValues[group.contractKey] || group.invoice}
                                                onChange={(e) => setInvoiceValues({...invoiceValues, [group.contractKey]: e.target.value})}
                                                onBlur={() => {
                                                    setEditingInvoice(null);
                                                    updateSequentialInvoices(group.contractKey, invoiceValues[group.contractKey] || group.invoice);
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setEditingInvoice(null);
                                                        updateSequentialInvoices(group.contractKey, invoiceValues[group.contractKey] || group.invoice);
                                                    }
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                autoFocus
                                                style={{
                                                    width: '100%',
                                                    border: '1px solid #FFD600',
                                                    borderRadius: 4,
                                                    padding: '2px 4px',
                                                    fontSize: 11,
                                                    textAlign: 'center'
                                                }}
                                            />
                                        ) : (
                                            <span
                                                onClick={() => {
                                                    setEditingInvoice(group.contractKey);
                                                    if (!invoiceValues[group.contractKey]) {
                                                        setInvoiceValues({...invoiceValues, [group.contractKey]: group.invoice});
                                                    }
                                                }}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to edit invoice number"
                                            >
                                                {group.invoice}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontWeight: "bold", color: "#673ab7", fontSize: 11 }}>{group.customer}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: 11 }}>{group.bookingNumber}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontWeight: "bold", color: "#1976d2", fontSize: 11 }}>{group.contractNo}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: 11 }}>{group.model}</td>
                                    <td 
                                        onClick={() => copyToClipboard(group.plateNo)}
                                        style={{ 
                                            padding: "6px 4px", 
                                            textAlign: "center", 
                                            fontWeight: "bold", 
                                            fontSize: 11,
                                            cursor: "pointer",
                                            color: "#1976d2",
                                            borderRadius: 4,
                                            transition: "background 0.2s"
                                        }}
                                        title="Click to copy plate number"
                                        onMouseOver={e => (e.currentTarget as HTMLElement).style.background = "#e3f2fd"}
                                        onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ""}
                                    >{group.plateNo}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: 11 }}>{formatDate(group.startDate)}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: 11 }}>{group.endDate === 'Open' ? 'Open' : formatDate(group.endDate)}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: 11 }}>{group.month}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontWeight: "bold", color: "#ff5722", fontSize: 11 }}>{group.trips.length}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontWeight: "bold", color: "#388e3c", fontSize: 11 }}>{group.totalAmount.toFixed(2)} AED</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center", fontSize: 11 }}>{group.invoiceDate}</td>
                                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                                        <button
                                            onClick={() => {
                                                const csvContent = [
                                                    ['INVOICE', 'Customer', 'Booking Number', 'Contract No.', 'Model', 'Plate No.', 'Date', 'End Date', 'Month', 'Salik Trips', 'Total Price', 'Invoice_Date'].join(','),
                                                    [group.invoice, group.customer, group.bookingNumber, group.contractNo, group.model, group.plateNo, formatDate(group.startDate), group.endDate === 'Open' ? 'Open' : formatDate(group.endDate), group.month, group.trips.length, group.totalAmount.toFixed(2), group.invoiceDate].join(',')
                                                ].join('\n');
                                                
                                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Salik_Invoice_${group.invoice}_${new Date().toISOString().split('T')[0]}.csv`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            style={{
                                                background: "#2196F3",
                                                color: "white",
                                                border: "none",
                                                borderRadius: 4,
                                                fontSize: 10,
                                                padding: "2px 6px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            📄 Single
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={14} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                                    No customer data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalikSummaryTable;