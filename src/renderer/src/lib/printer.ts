import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// For Arabic support in jsPDF, we usually need a font. 
// Since loading fonts in client-side jsPDF can be tricky with base64 strings,
// we will stick to basic English for receipts or assume a system font if possible,
// but for a robust solution in Electron, we can read font files.
// For this MVP step, we will use a basic layout.

export const generateReceipt = (saleData: any, storeSettings: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297] // Thermal printer width usually 80mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(12);
  doc.text(storeSettings?.title || 'IBEX27 Store', pageWidth / 2, 10, { align: 'center' });
  
  doc.setFontSize(8);
  if (storeSettings?.phone) {
    doc.text(`Tel: ${storeSettings.phone}`, pageWidth / 2, 15, { align: 'center' });
  }
  
  doc.text(`Date: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, 20, { align: 'center' });
  doc.text(`Invoice #${Date.now().toString().slice(-6)}`, pageWidth / 2, 24, { align: 'center' });

  // Items
  const tableData = saleData.items.map((item: any) => [
    item.name,
    item.quantity,
    item.price
  ]);

  autoTable(doc, {
    head: [['Item', 'Qty', 'Price']],
    body: tableData,
    startY: 30,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1 },
    headStyles: { fontStyle: 'bold' },
    margin: { left: 5, right: 5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // Totals
  doc.setFontSize(10);
  doc.text(`Total: ${saleData.total}`, pageWidth - 10, finalY, { align: 'right' });

  // Footer
  if (storeSettings?.footer) {
    doc.setFontSize(8);
    doc.text(storeSettings.footer, pageWidth / 2, finalY + 10, { align: 'center' });
  }

  // Auto print or save
  doc.save(`receipt-${Date.now()}.pdf`);
};

export const generateSalarySlip = (salaryData: any, user: any, _storeSettings: any) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Salary Slip', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Employee: ${user.name}`, 20, 40);
  doc.text(`Period: ${salaryData.period}`, 20, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 40);

  // Earnings
  doc.text('Earnings:', 20, 70);
  const earningsData = salaryData.items || [];
  autoTable(doc, {
    startY: 75,
    head: [['Description', 'Amount']],
    body: earningsData.map((i: any) => [i.description, i.amount]),
    theme: 'grid'
  });

  // Deductions
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  if (salaryData.deductions && salaryData.deductions.length > 0) {
    doc.text('Deductions:', 20, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Description', 'Amount']],
      body: salaryData.deductions.map((i: any) => [i.description, i.amount]),
      theme: 'grid'
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
  }

  doc.setFontSize(14);
  doc.text(`Net Total: ${salaryData.total}`, 150, finalY + 10, { align: 'right' });

  doc.save(`salary-${user.name}-${salaryData.period}.pdf`);
};

