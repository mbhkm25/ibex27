import ReactPDF from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register Arabic font (Cairo) from Google Fonts CDN
// This will work for Arabic text rendering
Font.register({
  family: 'Cairo',
  src: 'https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf',
  fontWeight: 'normal',
});

Font.register({
  family: 'Cairo',
  src: 'https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf',
  fontWeight: 'bold',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Cairo', // Use Cairo font for Arabic support
    direction: 'rtl'
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2980b9',
    textAlign: 'center',
    marginBottom: 10
  },
  subheader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5
  },
  normal: {
    fontSize: 10,
    marginBottom: 3
  },
  bold: {
    fontWeight: 'bold'
  },
  line: {
    borderBottom: '1 solid #2980b9',
    marginVertical: 10
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #000'
  },
  tableHeader: {
    backgroundColor: '#2980b9',
    color: '#FFFFFF',
    fontWeight: 'bold',
    padding: 8,
    textAlign: 'right'
  },
  tableCell: {
    padding: 8,
    textAlign: 'right',
    borderRight: '1 solid #000'
  },
  tableCellLast: {
    padding: 8,
    textAlign: 'right'
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 10
  },
  note: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'right'
  },
  total: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'right'
  }
});

const InvoiceDocument = ({ store, sale, items }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>{store.title || 'فاتورة ضريبية'}</Text>
      {store.description && <Text style={styles.normal}>{store.description}</Text>}
      {store.phone && <Text style={styles.normal}>{store.phone}</Text>}
      <View style={styles.line} />
      
      <Text style={styles.normal}>
        <Text style={styles.bold}>رقم الفاتورة: </Text>
        {sale.id.toString()}
      </Text>
      <Text style={styles.normal}>
        <Text style={styles.bold}>التاريخ: </Text>
        {format(new Date(sale.createdAt || new Date()), 'yyyy-MM-dd HH:mm')}
      </Text>
      <Text style={styles.normal}>
        <Text style={styles.bold}>طريقة الدفع: </Text>
        {sale.paymentMethod === 'cash' ? 'نقدي' : 'شبكة'}
      </Text>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, { width: '40%' }]}>الصنف</Text>
          <Text style={[styles.tableHeader, { width: '15%' }]}>الكمية</Text>
          <Text style={[styles.tableHeader, { width: '20%' }]}>السعر</Text>
          <Text style={[styles.tableHeader, { width: '25%' }]}>الإجمالي</Text>
        </View>
        {items.map((item: any, idx: number) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>{item.name || '-'}</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{item.price} ر.س</Text>
            <Text style={[styles.tableCellLast, { width: '25%' }]}>{(item.price * item.quantity).toFixed(2)} ر.س</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.total}>
        <Text style={styles.bold}>الإجمالي: </Text>
        {sale.total} ر.س
      </Text>
      
      {store.footer && (
        <Text style={styles.footer}>{store.footer}</Text>
      )}
    </Page>
  </Document>
);

const SalaryDocument = ({ store, user, salary }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>تقرير الراتب</Text>
      <View style={styles.line} />
      
      <Text style={styles.normal}>{store.title || 'اسم المتجر'}</Text>
      {store.description && <Text style={styles.normal}>{store.description}</Text>}
      <Text style={styles.normal}>التاريخ: {format(new Date(), 'yyyy-MM-dd')}</Text>
      <Text style={styles.normal}>المرجع: {salary.period}</Text>
      
      <View style={styles.line} />
      
      <Text style={styles.subheader}>بيانات الموظف</Text>
      <Text style={styles.normal}>
        <Text style={styles.bold}>الاسم: </Text>
        {user.name}
      </Text>
      <Text style={styles.normal}>
        <Text style={styles.bold}>الدور: </Text>
        {user.role === 'admin' ? 'مدير' : 'موظف'}
      </Text>
      
      <Text style={styles.subheader}>تفاصيل الراتب</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, { width: '60%' }]}>البند</Text>
          <Text style={[styles.tableHeader, { width: '40%' }]}>المبلغ</Text>
        </View>
        {(salary.items || []).map((item: any, idx: number) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '60%' }]}>{item.description || '-'}</Text>
            <Text style={[styles.tableCellLast, { width: '40%' }]}>{item.amount} ر.س</Text>
          </View>
        ))}
      </View>
      
      {salary.deductions && salary.deductions.length > 0 && (
        <>
          <Text style={styles.subheader}>الخصومات</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, { width: '60%' }]}>البند</Text>
              <Text style={[styles.tableHeader, { width: '40%' }]}>المبلغ</Text>
            </View>
            {salary.deductions.map((item: any, idx: number) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>{item.description || '-'}</Text>
                <Text style={[styles.tableCellLast, { width: '40%' }]}>{item.amount} ر.س</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <Text style={styles.total}>
        <Text style={styles.bold}>الإجمالي النهائي: </Text>
        {salary.total} ر.س
      </Text>
      
      <Text style={styles.footer}>الإدارة: {salary.management || store.title}</Text>
      {salary.note && (
        <Text style={styles.note}>ملاحظة: {salary.note}</Text>
      )}
    </Page>
  </Document>
);

export const generateInvoicePDF = async (store: any, sale: any, items: any[]) => {
  const pdfDoc = <InvoiceDocument store={store} sale={sale} items={items} />;
  const pdfBuffer = await ReactPDF.renderToBuffer(pdfDoc);
  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${sale.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const generateSalarySlipPDF = async (store: any, user: any, salary: any) => {
  const pdfDoc = <SalaryDocument store={store} user={user} salary={salary} />;
  const pdfBuffer = await ReactPDF.renderToBuffer(pdfDoc);
  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `salary-slip-${user.name}-${salary.period}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

