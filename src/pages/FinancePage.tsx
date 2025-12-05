import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Search,
  DollarSign,

  CheckCircle2,
  Clock,
  AlertCircle,

  CreditCard,
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { usePayments, type Payment, type PaymentStatus } from '../hooks/use-payments';
import { useExpenses } from '../hooks/use-expenses';
import { useStudents } from '../hooks/use-students';
import { usePaymentPlans } from '../hooks/use-payment-plans';
import { cn, getLocalToday } from '@/lib/utils';

export default function FinancePage() {
  const { students } = useStudents();
  const { payments, loading: paymentsLoading, addPayment, updatePayment, deletePayment } = usePayments();
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses();
  const { paymentPlans, addPaymentPlan, deletePaymentPlan } = usePaymentPlans();

  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'plans'>('payments');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isPartialPaymentDialogOpen, setIsPartialPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const { toast } = useToast();

  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    amount: '',
    original_amount: '',
    discount_amount: '',
    due_date: getLocalToday(),
    payment_date: getLocalToday(),
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'credit_card',
    month: new Date().toISOString().slice(0, 7),
    status: 'Paid' as PaymentStatus,
    notes: '',
  });

  const [partialPaymentForm, setPartialPaymentForm] = useState({
    amount: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: getLocalToday(),
    notes: '',
  });

  const [planForm, setPlanForm] = useState({
    student_id: '',
    plan_name: '',
    plan_type: 'monthly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom',
    start_date: getLocalToday(),
    end_date: '',
    monthly_amount: '',
    total_amount: '',
    discount_amount: '',
    discount_percent: '',
  });

  const loading = paymentsLoading || expensesLoading;

  // Calculate totals
  const totalIncome = useMemo(() => {
    return payments
      .filter(p => p.status === 'Paid' || p.status === 'Partial')
      .reduce((sum, p) => sum + (p.partial_amount || p.amount), 0);
  }, [payments]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netProfit = totalIncome - totalExpense;

  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length;
  }, [payments]);

  const overdueAmount = useMemo(() => {
    return payments
      .filter(p => p.status === 'Overdue')
      .reduce((sum, p) => sum + (p.amount - (p.partial_amount || 0)), 0);
  }, [payments]);

  // Filter data
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Student filter
    if (selectedStudentId !== 'all') {
      filtered = filtered.filter(p => p.student_id === selectedStudentId);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const student = students.find(s => s.id === p.student_id);
        return student?.name.toLowerCase().includes(term) ||
          p.notes?.toLowerCase().includes(term) ||
          p.note?.toLowerCase().includes(term);
      });
    }

    return filtered.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }, [payments, selectedStudentId, statusFilter, searchTerm, students]);

  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    const term = searchTerm.toLowerCase();
    return expenses.filter(e =>
      e.category.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term)
    );
  }, [expenses, searchTerm]);

  function resetPaymentForm() {
    setPaymentForm({
      student_id: '',
      amount: '',
      original_amount: '',
      discount_amount: '',
      due_date: getLocalToday(),
      payment_date: getLocalToday(),
      payment_method: 'cash',
      month: new Date().toISOString().slice(0, 7),
      status: 'Paid',
      notes: '',
    });
  }

  function resetExpenseForm() {
    setExpenseForm({
      category: '',
      description: '',
      amount: '',
      expense_date: getLocalToday(),
      notes: '',
    });
  }

  function resetPlanForm() {
    setPlanForm({
      student_id: '',
      plan_name: '',
      plan_type: 'monthly',
      start_date: getLocalToday(),
      end_date: '',
      monthly_amount: '',
      total_amount: '',
      discount_amount: '',
      discount_percent: '',
    });
  }

  async function handleAddPayment() {
    if (!paymentForm.student_id || !paymentForm.amount) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Öğrenci ve tutar zorunludur',
      });
      return;
    }

    const amount = Number(paymentForm.amount);
    const originalAmount = Number(paymentForm.original_amount) || amount;
    const discountAmount = Number(paymentForm.discount_amount) || 0;

    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Geçerli bir tutar girin',
      });
      return;
    }

    try {
      await addPayment({
        student_id: paymentForm.student_id,
        amount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        partial_amount: paymentForm.status === 'Partial' ? amount : null,
        due_date: paymentForm.due_date,
        paid_date: paymentForm.status === 'Paid' ? paymentForm.payment_date : null,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        month: paymentForm.month,
        status: paymentForm.status,
        notes: paymentForm.notes,
        note: paymentForm.notes,
      });

      toast({
        title: 'Başarılı',
        description: 'Ödeme eklendi',
      });

      setIsPaymentDialogOpen(false);
      resetPaymentForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Ödeme eklenemedi',
      });
    }
  }

  async function handlePartialPayment() {
    if (!selectedPayment) return;

    const amount = Number(partialPaymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Geçerli bir tutar girin',
      });
      return;
    }

    const currentPaid = selectedPayment.partial_amount || 0;
    const newTotal = currentPaid + amount;
    const remaining = selectedPayment.amount - newTotal;

    try {
      await updatePayment(selectedPayment.id, {
        partial_amount: newTotal,
        status: remaining <= 0 ? 'Paid' : 'Partial',
        paid_date: remaining <= 0 ? getLocalToday() : null,
      });

      toast({
        title: 'Başarılı',
        description: remaining <= 0
          ? `${formatCurrency(amount)} ödeme alındı - Ödeme tamamlandı`
          : `${formatCurrency(amount)} kısmi ödeme alındı - Kalan: ${formatCurrency(remaining)}`,
      });

      setIsPartialPaymentDialogOpen(false);
      setSelectedPayment(null);
      setPartialPaymentForm({ amount: '' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Kısmi ödeme eklenemedi',
      });
    }
  }

  async function handleAddExpense() {
    if (!expenseForm.category || !expenseForm.amount) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Kategori ve tutar zorunludur',
      });
      return;
    }

    const amount = Number(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Geçerli bir tutar girin',
      });
      return;
    }

    try {
      await addExpense({
        category: expenseForm.category,
        description: expenseForm.description,
        amount,
        expense_date: expenseForm.expense_date,
        notes: expenseForm.notes,
      });

      toast({
        title: 'Başarılı',
        description: 'Gider eklendi',
      });

      setIsExpenseDialogOpen(false);
      resetExpenseForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Gider eklenemedi',
      });
    }
  }

  async function handleAddPlan() {
    if (!planForm.student_id || !planForm.plan_name || !planForm.monthly_amount) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Öğrenci, plan adı ve aylık tutar zorunludur',
      });
      return;
    }

    const monthlyAmount = Number(planForm.monthly_amount);
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Geçerli bir tutar girin',
      });
      return;
    }

    try {
      await addPaymentPlan({
        student_id: planForm.student_id,
        plan_name: planForm.plan_name,
        plan_type: planForm.plan_type,
        start_date: planForm.start_date,
        end_date: planForm.end_date || null,
        monthly_amount: monthlyAmount,
        total_amount: planForm.total_amount ? Number(planForm.total_amount) : null,
        discount_amount: planForm.discount_amount ? Number(planForm.discount_amount) : null,
        discount_percent: planForm.discount_percent ? Number(planForm.discount_percent) : null,
      });

      toast({
        title: 'Başarılı',
        description: 'Ödeme planı oluşturuldu',
      });

      setIsPlanDialogOpen(false);
      resetPlanForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Ödeme planı eklenemedi',
      });
    }
  }

  async function handleDeletePayment(id: string) {
    if (!window.confirm('Bu ödemeyi silmek istediğinize emin misiniz?')) return;

    try {
      await deletePayment(id);
      toast({
        title: 'Başarılı',
        description: 'Ödeme silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Ödeme silinemedi',
      });
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!window.confirm('Bu gideri silmek istediğinize emin misiniz?')) return;

    try {
      await deleteExpense(id);
      toast({
        title: 'Başarılı',
        description: 'Gider silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Gider silinemedi',
      });
    }
  }

  async function handleDeletePlan(id: string) {
    if (!window.confirm('Bu ödeme planını silmek istediğinize emin misiniz?')) return;

    try {
      await deletePaymentPlan(id);
      toast({
        title: 'Başarılı',
        description: 'Ödeme planı silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Ödeme planı silinemedi',
      });
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  }

  function getStudentName(studentId: string) {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Bilinmeyen';
  }

  function getPaymentStatusBadge(status: PaymentStatus) {
    const badges = {
      Paid: { label: 'Ödendi', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      Pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      Overdue: { label: 'Gecikmiş', className: 'bg-red-100 text-red-800', icon: AlertCircle },
      Partial: { label: 'Kısmi', className: 'bg-blue-100 text-blue-800', icon: CreditCard },
      Cancelled: { label: 'İptal', className: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };
    return badges[status] || badges.Pending;
  }

  function openPartialPaymentDialog(payment: Payment) {
    setSelectedPayment(payment);
    setPartialPaymentForm({ amount: '' });
    setIsPartialPaymentDialogOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-8 text-[#111813]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Finans Yönetimi</h2>
            <p className="text-sm text-[#3e5c45]">Gelir, gider ve ödeme planlarını yönetin.</p>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground mt-1">Ödenen tutarlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
              <p className="text-xs text-muted-foreground mt-1">Toplam harcamalar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Kâr</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gelir - Gider</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gecikmiş: {formatCurrency(overdueAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="payments">Ödemeler</TabsTrigger>
            <TabsTrigger value="expenses">Giderler</TabsTrigger>
            <TabsTrigger value="plans">Ödeme Planları</TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8aa692]" />
                  <Input
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  className="min-w-[200px]"
                >
                  <option value="all">Tüm Öğrenciler</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v: any) => setStatusFilter(v)}
                  className="min-w-[150px]"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="Paid">Ödendi</option>
                  <option value="Pending">Beklemede</option>
                  <option value="Overdue">Gecikmiş</option>
                  <option value="Partial">Kısmi</option>
                </Select>
              </div>
              <Button
                className="bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915]"
                onClick={() => {
                  resetPaymentForm();
                  setIsPaymentDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ödeme Ekle
              </Button>
            </div>

            <div className="rounded-[24px] border border-[#b0c4b1] bg-white">
              {loading ? (
                <div className="text-center py-12 text-[#3e5c45]">Yükleniyor...</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-[#3e5c45]">
                  {searchTerm || statusFilter !== 'all' || selectedStudentId !== 'all'
                    ? 'Arama kriterlerine uygun ödeme bulunamadı.'
                    : 'Henüz ödeme eklenmemiş.'}
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-[#7d9785] bg-[#f1f5f1]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Öğrenci</th>
                      <th className="px-6 py-4 font-medium">Tutar</th>
                      <th className="px-6 py-4 font-medium">Vade</th>
                      <th className="px-6 py-4 font-medium">Durum</th>
                      <th className="px-6 py-4 font-medium">Ödeme Yöntemi</th>
                      <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => {
                      const badge = getPaymentStatusBadge(payment.status);
                      const Icon = badge.icon;
                      const remaining = payment.amount - (payment.partial_amount || 0);

                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-[#ecf2ec] last:border-0 hover:bg-[#f8fdf8]"
                        >
                          <td className="px-6 py-5">{getStudentName(payment.student_id)}</td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                            {payment.status === 'Partial' && (
                              <div className="text-xs text-muted-foreground">
                                Ödenen: {formatCurrency(payment.partial_amount || 0)} / Kalan: {formatCurrency(remaining)}
                              </div>
                            )}
                            {payment.discount_amount && payment.discount_amount > 0 && (
                              <div className="text-xs text-blue-600">
                                İndirim: {formatCurrency(payment.discount_amount)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-[#3e5c45]">{formatDate(payment.due_date)}</td>
                          <td className="px-6 py-5">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", badge.className)}>
                              <Icon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-[#3e5c45]">
                            {payment.payment_method === 'cash' ? 'Nakit' :
                              payment.payment_method === 'bank_transfer' ? 'Banka' : 'Kredi Kartı'}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              {(payment.status === 'Pending' || payment.status === 'Partial' || payment.status === 'Overdue') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 px-3 rounded-lg border border-[#e0ede3] hover:bg-[#e8f7ec]"
                                  onClick={() => openPartialPaymentDialog(payment)}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  Ödeme Al
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 rounded-lg border border-[#ffe6e6] hover:bg-[#ffecec]"
                                onClick={() => handleDeletePayment(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-[#c62828]" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8aa692]" />
                <Input
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                className="bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915]"
                onClick={() => {
                  resetExpenseForm();
                  setIsExpenseDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Gider Ekle
              </Button>
            </div>

            <div className="rounded-[24px] border border-[#b0c4b1] bg-white">
              {loading ? (
                <div className="text-center py-12 text-[#3e5c45]">Yükleniyor...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-[#3e5c45]">
                  {searchTerm ? 'Arama kriterlerine uygun gider bulunamadı.' : 'Henüz gider eklenmemiş.'}
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-[#7d9785] bg-[#f1f5f1]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Kategori</th>
                      <th className="px-6 py-4 font-medium">Açıklama</th>
                      <th className="px-6 py-4 font-medium">Tutar</th>
                      <th className="px-6 py-4 font-medium">Tarih</th>
                      <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-[#ecf2ec] last:border-0 hover:bg-[#f8fdf8]"
                      >
                        <td className="px-6 py-5 font-medium">{expense.category}</td>
                        <td className="px-6 py-5 text-[#3e5c45]">{expense.description || '-'}</td>
                        <td className="px-6 py-5 font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-5 text-[#3e5c45]">{formatDate(expense.expense_date)}</td>
                        <td className="px-6 py-5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg border border-[#ffe6e6] hover:bg-[#ffecec]"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-[#c62828]" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Payment Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-end">
              <Button
                className="bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915]"
                onClick={() => {
                  resetPlanForm();
                  setIsPlanDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Plan Oluştur
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentPlans.length === 0 ? (
                <div className="col-span-full text-center py-12 text-[#3e5c45]">
                  Henüz ödeme planı oluşturulmamış.
                </div>
              ) : (
                paymentPlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{plan.plan_name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Öğrenci:</span>
                        <span className="font-medium">{getStudentName(plan.student_id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tip:</span>
                        <span className="font-medium">
                          {plan.plan_type === 'monthly' ? 'Aylık' :
                            plan.plan_type === 'quarterly' ? 'Üç Aylık' :
                              plan.plan_type === 'semi_annual' ? 'Altı Aylık' :
                                plan.plan_type === 'annual' ? 'Yıllık' : 'Özel'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aylık Tutar:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(plan.monthly_amount)}
                        </span>
                      </div>
                      {plan.discount_amount && plan.discount_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">İndirim:</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(plan.discount_amount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Başlangıç:</span>
                        <span>{formatDate(plan.start_date)}</span>
                      </div>
                      {plan.end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bitiş:</span>
                          <span>{formatDate(plan.end_date)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ödeme Ekle</DialogTitle>
            <DialogDescription>Yeni ödeme kaydı oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="student">Öğrenci *</Label>
              <Select
                value={paymentForm.student_id}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, student_id: value })}
              >
                <option value="">Seçiniz</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Tutar (TL) *</Label>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="original_amount">Orijinal Tutar</Label>
              <Input
                id="original_amount"
                type="number"
                value={paymentForm.original_amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, original_amount: e.target.value })}
                placeholder="İndirim varsa"
              />
            </div>
            <div>
              <Label htmlFor="discount_amount">İndirim Tutarı</Label>
              <Input
                id="discount_amount"
                type="number"
                value={paymentForm.discount_amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, discount_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="due_date">Vade Tarihi *</Label>
              <Input
                id="due_date"
                type="date"
                value={paymentForm.due_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="payment_date">Ödeme Tarihi</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Durum</Label>
              <Select
                value={paymentForm.status}
                onValueChange={(value: any) => setPaymentForm({ ...paymentForm, status: value })}
              >
                <option value="Paid">Ödendi</option>
                <option value="Pending">Beklemede</option>
                <option value="Partial">Kısmi Ödeme</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_method">Ödeme Yöntemi</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value: any) => setPaymentForm({ ...paymentForm, payment_method: value })}
              >
                <option value="cash">Nakit</option>
                <option value="bank_transfer">Banka Transferi</option>
                <option value="credit_card">Kredi Kartı</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Ay (YYYY-MM)</Label>
              <Input
                id="month"
                type="month"
                value={paymentForm.month}
                onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <Input
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Ek notlar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddPayment}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial Payment Dialog */}
      <Dialog open={isPartialPaymentDialogOpen} onOpenChange={setIsPartialPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kısmi Ödeme Al</DialogTitle>
            <DialogDescription>
              Kısmi ödeme alın
            </DialogDescription>
            {selectedPayment && (
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div>Öğrenci: <strong>{getStudentName(selectedPayment.student_id)}</strong></div>
                <div>Toplam Tutar: <strong>{formatCurrency(selectedPayment.amount)}</strong></div>
                <div>Ödenen: <strong>{formatCurrency(selectedPayment.partial_amount || 0)}</strong></div>
                <div>Kalan: <strong className="text-red-600">
                  {formatCurrency(selectedPayment.amount - (selectedPayment.partial_amount || 0))}
                </strong></div>
              </div>
            )}
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="partial_amount">Alınacak Tutar (TL) *</Label>
            <Input
              id="partial_amount"
              type="number"
              value={partialPaymentForm.amount}
              onChange={(e) => setPartialPaymentForm({ amount: e.target.value })}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPartialPaymentDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handlePartialPayment}>Ödeme Al</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gider Ekle</DialogTitle>
            <DialogDescription>Yeni gider kaydı oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Input
                id="category"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                placeholder="Örn: Kira, Maaş, Malzeme"
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Detaylı açıklama..."
              />
            </div>
            <div>
              <Label htmlFor="expense_amount">Tutar (TL) *</Label>
              <Input
                id="expense_amount"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="expense_date">Gider Tarihi *</Label>
              <Input
                id="expense_date"
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddExpense}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ödeme Planı Oluştur</DialogTitle>
            <DialogDescription>Öğrenci için ödeme planı tanımlayın.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="plan_student">Öğrenci *</Label>
              <Select
                value={planForm.student_id}
                onValueChange={(value) => setPlanForm({ ...planForm, student_id: value })}
              >
                <option value="">Seçiniz</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="plan_name">Plan Adı *</Label>
              <Input
                id="plan_name"
                value={planForm.plan_name}
                onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })}
                placeholder="Örn: 2024 Eğitim Yılı"
              />
            </div>
            <div>
              <Label htmlFor="plan_type">Plan Tipi</Label>
              <Select
                value={planForm.plan_type}
                onValueChange={(value: any) => setPlanForm({ ...planForm, plan_type: value })}
              >
                <option value="monthly">Aylık</option>
                <option value="quarterly">Üç Aylık</option>
                <option value="semi_annual">Altı Aylık</option>
                <option value="annual">Yıllık</option>
                <option value="custom">Özel</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="monthly_amount">Aylık Tutar (TL) *</Label>
              <Input
                id="monthly_amount"
                type="number"
                value={planForm.monthly_amount}
                onChange={(e) => setPlanForm({ ...planForm, monthly_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="total_amount">Toplam Tutar</Label>
              <Input
                id="total_amount"
                type="number"
                value={planForm.total_amount}
                onChange={(e) => setPlanForm({ ...planForm, total_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="discount_amount_plan">İndirim Tutarı</Label>
              <Input
                id="discount_amount_plan"
                type="number"
                value={planForm.discount_amount}
                onChange={(e) => setPlanForm({ ...planForm, discount_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="discount_percent">İndirim Oranı (%)</Label>
              <Input
                id="discount_percent"
                type="number"
                value={planForm.discount_percent}
                onChange={(e) => setPlanForm({ ...planForm, discount_percent: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="start_date_plan">Başlangıç Tarihi *</Label>
              <Input
                id="start_date_plan"
                type="date"
                value={planForm.start_date}
                onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date_plan">Bitiş Tarihi</Label>
              <Input
                id="end_date_plan"
                type="date"
                value={planForm.end_date}
                onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddPlan}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
