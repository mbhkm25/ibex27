import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';

interface ThermalInvoiceData {
  store: {
    name: string;
    phone?: string;
    description?: string;
    logo?: string;
    footer?: string;
    slug: string;
  };
  sale: {
    id: number;
    createdAt: Date | string;
    paymentMethod: 'cash' | 'customer_balance' | 'mixed' | 'card';
    total: number;
    currency?: {
      symbol: string;
      name: string;
    };
    exchangeRate?: number;
    convertedTotal?: number;
    convertedCurrency?: {
      symbol: string;
      name: string;
    };
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  customer?: {
    name: string;
    phone?: string;
    balance?: number;
  };
  cashier?: {
    name: string;
  };
}

/**
 * Generate thermal invoice (80mm width) with QR Code
 */
export const generateThermalInvoice = async (data: ThermalInvoiceData): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297] // 80mm thermal printer width
  });

  const pageWidth = 80;
  let yPos = 10;
  const lineHeight = 5;
  const margin = 5;

  // Helper function to add text with wrapping
  const addText = (text: string, fontSize: number, align: 'left' | 'center' | 'right' = 'center', bold = false) => {
    doc.setFontSize(fontSize);
    if (bold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const xPos = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin;
    doc.text(text, xPos, yPos, { align });
    yPos += lineHeight;
  };

  // Helper function to add line
  const addLine = () => {
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;
  };

  // ===== HEADER =====
  // Store Logo (if available)
  if (data.store.logo) {
    try {
      // Logo is base64 data URL
      const logoData = data.store.logo;
      
      // Convert base64 to image and add to PDF
      // Note: jsPDF supports base64 images directly
      const img = new Image();
      img.src = logoData;
      
      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          console.warn('Failed to load logo image');
          resolve(null);
        };
      });
      
      // Add logo (max 20mm width, centered)
      const logoWidth = 20;
      const logoHeight = (img.height / img.width) * logoWidth;
      const logoX = (pageWidth - logoWidth) / 2;
      
      doc.addImage(logoData, 'PNG', logoX, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 3;
    } catch (error) {
      console.warn('Failed to add logo to invoice:', error);
      // Continue without logo
    }
  }

  // Store Name
  addText(data.store.name, 14, 'center', true);
  yPos += 2;

  // Store Description
  if (data.store.description) {
    addText(data.store.description, 8, 'center');
  }

  // Store Phone
  if (data.store.phone) {
    addText(`Tel: ${data.store.phone}`, 8, 'center');
  }

  yPos += 3;
  addLine();

  // ===== INVOICE INFO =====
  addText('فاتورة ضريبية', 10, 'center', true);
  yPos += 2;

  addText(`رقم الفاتورة: #${data.sale.id}`, 9, 'right');
  addText(`التاريخ: ${format(new Date(data.sale.createdAt), 'yyyy-MM-dd HH:mm')}`, 9, 'right');
  
  if (data.cashier) {
    addText(`الكاشير: ${data.cashier.name}`, 9, 'right');
  }

  // Payment Method
  const paymentMethodText = {
    cash: 'نقدي',
    customer_balance: 'من الرصيد',
    mixed: 'مختلط (نقدي + رصيد)',
    card: 'بطاقة'
  };
  addText(`طريقة الدفع: ${paymentMethodText[data.sale.paymentMethod]}`, 9, 'right');

  yPos += 3;
  addLine();

  // ===== CUSTOMER INFO =====
  if (data.customer) {
    addText('بيانات العميل', 9, 'right', true);
    addText(`الاسم: ${data.customer.name}`, 8, 'right');
    if (data.customer.phone) {
      addText(`الجوال: ${data.customer.phone}`, 8, 'right');
    }
    yPos += 2;
  }

  // ===== ITEMS TABLE =====
  addText('─────────────────────────', 8, 'center');
  yPos += 2;

  // Table Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('الصنف', margin, yPos);
  doc.text('الكم', margin + 35, yPos);
  doc.text('السعر', margin + 50, yPos);
  doc.text('الإجمالي', pageWidth - margin, yPos, { align: 'right' });
  yPos += 4;

  addText('─────────────────────────', 8, 'center');
  yPos += 2;

  // Items
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item) => {
    // Product name (may wrap)
    const nameLines = doc.splitTextToSize(item.name, 35);
    doc.setFontSize(8);
    doc.text(nameLines[0], margin, yPos);
    
    // Quantity
    doc.text(item.quantity.toString(), margin + 35, yPos);
    
    // Price
    doc.text(`${item.price.toFixed(2)}`, margin + 50, yPos);
    
    // Total
    doc.text(`${item.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    
    yPos += nameLines.length > 1 ? 6 : 4;
    
    // If name wrapped, continue on next line
    if (nameLines.length > 1) {
      for (let i = 1; i < nameLines.length; i++) {
        doc.text(nameLines[i], margin, yPos);
        yPos += 4;
      }
    }
  });

  yPos += 2;
  addText('─────────────────────────', 8, 'center');
  yPos += 3;

  // ===== TOTALS =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Base Currency Total
  const baseCurrencySymbol = data.sale.currency?.symbol || 'ر.س';
  addText(`الإجمالي: ${data.sale.total.toFixed(2)} ${baseCurrencySymbol}`, 10, 'right', true);

  // Converted Currency Total (if different)
  if (data.sale.convertedTotal && data.sale.convertedCurrency && data.sale.exchangeRate) {
    yPos += 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    addText(`(${data.sale.convertedTotal.toFixed(2)} ${data.sale.convertedCurrency.symbol})`, 9, 'right');
    addText(`سعر الصرف: 1 ${baseCurrencySymbol} = ${data.sale.exchangeRate.toFixed(4)} ${data.sale.convertedCurrency.symbol}`, 7, 'center');
  }

  yPos += 3;
  addLine();

  // ===== CUSTOMER BALANCE (if applicable) =====
  if (data.customer && data.customer.balance !== undefined) {
    yPos += 2;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    addText(`الرصيد المتبقي: ${data.customer.balance.toFixed(2)} ${baseCurrencySymbol}`, 8, 'right');
    yPos += 3;
  }

  // ===== FOOTER =====
  yPos += 3;
  if (data.store.footer) {
    addText(data.store.footer, 7, 'center');
    yPos += 2;
  }

  addText('شكراً لزيارتك', 8, 'center');
  yPos += 5;

  // ===== QR CODE =====
  // Generate invoice URL for customer portal
  const invoiceUrl = `/#/customer/invoice/${data.store.slug}/${data.sale.id}`;
  
  try {
    // Generate QR Code as data URL
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Add QR Code to PDF
    const qrSize = 25; // 25mm QR code
    const qrX = (pageWidth - qrSize) / 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
    yPos += qrSize + 3;

    // QR Code label
    addText('امسح لرؤية الفاتورة إلكترونياً', 7, 'center');
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    addText('رابط الفاتورة:', 7, 'center');
    addText(invoiceUrl, 6, 'center');
  }

  // ===== FINAL SPACING =====
  yPos += 5;
  addText('─────────────────────────', 8, 'center');

  // Generate PDF blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

/**
 * Print thermal invoice directly (if printer is available)
 */
export const printThermalInvoice = async (data: ThermalInvoiceData): Promise<void> => {
  const blob = await generateThermalInvoice(data);
  const url = URL.createObjectURL(blob);
  
  // Open print dialog
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        printWindow.close();
      }, 1000);
    };
  } else {
    // Fallback: download PDF
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${data.sale.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

/**
 * Download thermal invoice as PDF
 */
export const downloadThermalInvoice = async (data: ThermalInvoiceData): Promise<void> => {
  const blob = await generateThermalInvoice(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${data.sale.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Send invoice via WhatsApp
 */
export const sendInvoiceViaWhatsApp = (data: ThermalInvoiceData): void => {
  if (!data.customer?.phone) {
    alert('لا يوجد رقم جوال للعميل');
    return;
  }

  // Format phone number (remove leading 0, add country code)
  let phone = data.customer.phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = phone.substring(1);
  }
  if (!phone.startsWith('966')) {
    phone = '966' + phone;
  }

  // Create invoice summary message
  const invoiceUrl = `/#/customer/invoice/${data.store.slug}/${data.sale.id}`;
  const message = encodeURIComponent(
    `مرحباً ${data.customer.name} 👋\n\n` +
    `فاتورة رقم: #${data.sale.id}\n` +
    `المتجر: ${data.store.name}\n` +
    `الإجمالي: ${data.sale.total.toFixed(2)} ${data.sale.currency?.symbol || 'ر.س'}\n` +
    `التاريخ: ${format(new Date(data.sale.createdAt), 'yyyy-MM-dd HH:mm')}\n\n` +
    `رابط الفاتورة الإلكترونية:\n${invoiceUrl}\n\n` +
    `شكراً لزيارتك! 🙏`
  );

  // Open WhatsApp Web/App
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  window.open(whatsappUrl, '_blank');
};

