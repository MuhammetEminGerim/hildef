import { useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../components/ui/label';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { usePayments } from '../hooks/use-payments';
import { useExpenses } from '../hooks/use-expenses';
import { useStudents } from '../hooks/use-students';
import { Input } from '../components/ui/input';

const COLORS = ['#13ec49', '#4a90e2', '#f5a623', '#e74c3c', '#9b59b6', '#1abc9c'];

export default function ReportsPage() {
  const { payments } = usePayments();
  const { expenses } = useExpenses();
  const { students } = useStudents();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const { toast } = useToast();

  // Filter data by selected month
  const monthlyData = useMemo(() => {
    const monthPayments = payments.filter(p => {
      // Use paid_date for cash flow consistency with Dashboard
      if (!p.paid_date) return false;
      const paymentMonth = p.paid_date.slice(0, 7);
      return paymentMonth === selectedMonth && (p.status === 'Paid' || p.status === 'Partial');
    });

    const monthExpenses = expenses.filter(e => {
      const expenseMonth = e.expense_date.slice(0, 7);
      return expenseMonth === selectedMonth;
    });

    const totalIncome = monthPayments.reduce((sum, p) => sum + (p.partial_amount || p.amount), 0);
    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      payments: monthPayments,
      expenses: monthExpenses,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  }, [payments, expenses, selectedMonth]);

  // Yearly trend data (last 12 months)
  const yearlyTrend = useMemo(() => {
    const months: { month: string; income: number; expense: number }[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthIncome = payments
        .filter(p => {
          if (!p.paid_date) return false;
          return p.paid_date.slice(0, 7) === monthKey && (p.status === 'Paid' || p.status === 'Partial');
        })
        .reduce((sum, p) => sum + (p.partial_amount || p.amount), 0);

      const monthExpense = expenses
        .filter(e => e.expense_date.slice(0, 7) === monthKey)
        .reduce((sum, e) => sum + e.amount, 0);

      months.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short' }),
        income: monthIncome,
        expense: monthExpense,
      });
    }

    return months;
  }, [payments, expenses]);

  // Expense categories
  const expenseCategories = useMemo(() => {
    const categories: Record<string, number> = {};

    monthlyData.expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    return Object.entries(categories)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyData.expenses]);

  // Payment methods distribution
  const paymentMethods = useMemo(() => {
    const methods: Record<string, number> = {
      cash: 0,
      bank_transfer: 0,
      credit_card: 0,
    };

    monthlyData.payments.forEach(p => {
      methods[p.payment_method] = (methods[p.payment_method] || 0) + (p.partial_amount || p.amount);
    });

    return [
      { name: 'Nakit', value: methods.cash },
      { name: 'Banka', value: methods.bank_transfer },
      { name: 'Kredi Kartı', value: methods.credit_card },
    ].filter(m => m.value > 0);
  }, [monthlyData.payments]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  }

  function getStudentName(studentId: string) {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Bilinmeyen';
  }

  async function handleExport() {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      // Load Roboto font from CDN
      const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf';
      const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());

      // Convert to base64
      const binary = new Uint8Array(fontBytes).reduce((data, byte) => data + String.fromCharCode(byte), '');
      const base64Font = btoa(binary);

      const doc = new jsPDF() as any;

      // Add font to VFS
      doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');

      // Title
      doc.setFontSize(20);
      doc.text('Gelir/Gider Raporu', 14, 20);

      // Period
      doc.setFontSize(12);
      const periodText = new Date(selectedMonth + '-01').toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric'
      });
      doc.text(`Dönem: ${periodText}`, 14, 28);

      // Summary Box
      doc.setFillColor(19, 236, 73);
      doc.rect(14, 35, 182, 30, 'F');

      doc.setFontSize(10);
      doc.setTextColor(16, 41, 21);
      doc.setFont('Roboto', 'normal');
      doc.text('ÖZET', 18, 42);

      const formatCurrencyPDF = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY',
          minimumFractionDigits: 2,
        }).format(amount).replace('₺', 'TL');
      };

      doc.text(`Toplam Gelir: ${formatCurrencyPDF(monthlyData.totalIncome)}`, 18, 50);
      doc.text(`Toplam Gider: ${formatCurrencyPDF(monthlyData.totalExpense)}`, 18, 56);
      doc.text(`Net Kâr: ${formatCurrencyPDF(monthlyData.netProfit)}`, 18, 62);

      doc.setTextColor(0, 0, 0);

      // Income Table
      let yPos = 75;
      doc.setFontSize(14);
      doc.text('Gelirler', 14, yPos);

      const incomeData = monthlyData.payments.map(p => [
        getStudentName(p.student_id),
        formatCurrencyPDF(p.partial_amount || p.amount),
        new Date(p.paid_date!).toLocaleDateString('tr-TR'),
        p.payment_method === 'cash' ? 'Nakit' :
          p.payment_method === 'credit_card' ? 'Kredi Kartı' :
            p.payment_method === 'bank_transfer' ? 'Banka' : 'Diğer'
      ]);

      doc.autoTable({
        startY: yPos + 5,
        head: [['Öğrenci', 'Tutar', 'Tarih', 'Ödeme Yöntemi']],
        body: incomeData,
        theme: 'grid',
        headStyles: {
          fillColor: [74, 144, 226],
          textColor: [255, 255, 255],
          font: 'Roboto'
        },
        styles: {
          font: 'Roboto',
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 35 },
          3: { cellWidth: 45 }
        }
      });

      // Expense Table
      yPos = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Giderler', 14, yPos);

      const expenseData = monthlyData.expenses.map(e => [
        e.category,
        e.description || '-',
        formatCurrencyPDF(e.amount),
        new Date(e.expense_date).toLocaleDateString('tr-TR')
      ]);

      doc.autoTable({
        startY: yPos + 5,
        head: [['Kategori', 'Açıklama', 'Tutar', 'Tarih']],
        body: expenseData,
        theme: 'grid',
        headStyles: {
          fillColor: [245, 166, 35],
          textColor: [255, 255, 255],
          font: 'Roboto'
        },
        styles: {
          font: 'Roboto',
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 70 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35 }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Sayfa ${i} / ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      // Download
      doc.save(`rapor_${selectedMonth}.pdf`);

      toast({
        title: 'Başarılı',
        description: 'PDF rapor indirildi',
      });
    } catch (e: any) {
      console.error('PDF export error:', e);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Rapor indirilemedi: ' + e.message,
      });
    }
  }

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Raporlar</h2>
          <p className="text-sm text-[#3e5c45]">Gelir ve gider raporlarını görüntüleyin.</p>
        </div>
        <Button
          onClick={handleExport}
          className="h-11 rounded-xl bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915] font-semibold gap-2 px-5"
        >
          <Download className="h-4 w-4" />
          Rapor İndir (PDF)
        </Button>
      </div>

      {/* Month Selector */}
      <div className="rounded-[24px] border border-[#b0c4b1] bg-white p-6">
        <div className="flex items-center gap-4">
          <Label htmlFor="month" className="whitespace-nowrap">Dönem Seçin:</Label>
          <Input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyData.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyData.payments.length} ödeme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyData.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyData.expenses.length} gider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Kâr</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyData.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyData.netProfit >= 0 ? 'Kâr' : 'Zarar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yearly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Yıllık Trend (Son 12 Ay)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke="#13ec49"
                  fill="#13ec49"
                  name="Gelir"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stackId="2"
                  stroke="#e74c3c"
                  fill="#e74c3c"
                  name="Gider"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Gider Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Bu dönemde gider kaydı yok
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: ${formatCurrency(entry.total)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {expenseCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Ödeme Yöntemleri Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Bu dönemde ödeme kaydı yok
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#4a90e2" name="Tutar" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>En Yüksek Giderler</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Bu dönemde gider kaydı yok
              </div>
            ) : (
              <div className="space-y-3">
                {expenseCategories.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-medium">{cat.category}</span>
                    </div>
                    <span className="text-red-600 font-semibold">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
