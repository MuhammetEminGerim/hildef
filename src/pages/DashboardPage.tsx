import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useStudents } from '../hooks/use-students';
import { usePayments } from '../hooks/use-payments';
import { useExpenses } from '../hooks/use-expenses';
import { useAttendance } from '../hooks/use-attendance';

type DashboardSummary = {
  totalStudents: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  netProfit: number;
  incomeSeries: { ym: string; total: number }[];
  expenseSeries: { ym: string; total: number }[];
};



type UpcomingEvent = {
  id: number;
  name: string;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
};



type AttendanceSummary = {
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  early_leave_count: number;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { students, loading: studentsLoading } = useStudents();
  const { payments, loading: paymentsLoading } = usePayments();
  const { expenses, loading: expensesLoading } = useExpenses();

  // Fix: Use local date instead of UTC to ensure correct day after midnight
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { attendance, loading: attendanceLoading } = useAttendance(today);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  const loading = studentsLoading || paymentsLoading || expensesLoading || attendanceLoading;

  useEffect(() => {
    // Calculate summary from students
    const activeStudents = students.filter(s => s.is_active).length;

    // Calculate this month's income and expenses
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncome = payments
      .filter(p => {
        if (!p.paid_date) return false;
        const paidDate = new Date(p.paid_date);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.partial_amount || p.amount), 0);

    const monthlyExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.expense_date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    setSummary({
      totalStudents: activeStudents,
      currentMonthIncome: monthlyIncome,
      currentMonthExpenses: monthlyExpenses,
      netProfit: monthlyIncome - monthlyExpenses,
      incomeSeries: [],
      expenseSeries: []
    });

    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const early = attendance.filter(a => a.status === 'early_leave').length;

    setAttendanceSummary({
      total_students: activeStudents,
      present_count: present,
      absent_count: absent,
      late_count: late,
      early_leave_count: early
    });

    setUpcomingEvents([]);
  }, [students, payments, expenses, attendance]);

  function formatEventDate(event: UpcomingEvent) {
    const date = new Date(event.event_date);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('tr-TR', { month: 'short' })
    };
  }

  function formatEventDetail(event: UpcomingEvent) {
    const parts = [];
    if (event.event_time) parts.push(event.event_time);
    if (event.location) parts.push(event.location);
    return parts.join(' • ') || 'Detay yok';
  }

  const stats = useMemo(
    () => {
      const allStats = [
        {
          label: 'Aktif Öğrenci Sayısı',
          value: summary?.totalStudents ? summary.totalStudents.toString() : '0',
          color: '#4a90e2',
        },
        {
          label: 'Bu Ayki Gelir',
          value: summary?.currentMonthIncome
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(summary.currentMonthIncome)
            : '₺0',
          color: '#50B83C',
          restricted: true,
        },
        {
          label: 'Bu Ayki Gider',
          value: summary?.currentMonthExpenses
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(summary.currentMonthExpenses)
            : '₺0',
          color: '#f5a623',
          restricted: true,
        },
        {
          label: 'Net Kâr',
          value: summary?.netProfit !== undefined
            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(summary.netProfit)
            : '₺0',
          color: summary && summary.netProfit >= 0 ? '#50B83C' : '#e74c3c',
          restricted: true,
        },
      ];

      if (user?.role !== 'admin') {
        return allStats.filter(s => !s.restricted);
      }
      return allStats;
    },
    [summary, user]
  );

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <div className="flex justify-end">
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-[#13ec49] px-5 h-11 text-sm font-semibold text-[#0c1f12] shadow-[0_8px_18px_rgba(19,236,73,0.35)] hover:opacity-95 transition"
            onClick={() => navigate('/students')}
          >
            Yeni Öğrenci Ekle
          </button>
          <button
            className="rounded-lg border border-[#cfdcd2] bg-white px-5 h-11 text-sm font-semibold text-[#111813] hover:bg-[#13ec49]/10 transition"
            onClick={() => navigate('/events')}
          >
            Yeni Etkinlik Oluştur
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[24px] border border-[#b0c4b1] bg-white/90 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.04)] flex flex-col gap-2"
          >
            <p className="text-base font-medium text-[#141c16]">{stat.label}</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {user?.role === 'admin' && (
          <div className="lg:col-span-2 rounded-[24px] border border-[#b0c4b1] bg-white/95 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
            <p className="text-base font-medium text-[#141c16]">Aylık Gelir Özeti</p>
            <p className="text-[34px] font-bold leading-tight mt-1 text-[#111813]">
              {summary?.currentMonthIncome !== undefined
                ? `₺${summary.currentMonthIncome.toLocaleString('tr-TR')}`
                : '₺0'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm text-[#3e5c45]">Bu Ay</span>
              {(() => {
                if (!summary?.incomeSeries || summary.incomeSeries.length < 2) return null;
                const sorted = [...summary.incomeSeries].sort((a, b) => a.ym.localeCompare(b.ym));
                const currentMonthYm = new Date().toISOString().slice(0, 7);
                const currentMonthData = sorted.find(s => s.ym === currentMonthYm);
                const prevMonthDate = new Date();
                prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
                const prevMonthYm = prevMonthDate.toISOString().slice(0, 7);
                const prevMonthData = sorted.find(s => s.ym === prevMonthYm);

                if (currentMonthData && prevMonthData && prevMonthData.total > 0) {
                  const change = ((currentMonthData.total - prevMonthData.total) / prevMonthData.total) * 100;
                  const isPositive = change >= 0;
                  return (
                    <span className={cn("text-sm font-semibold", isPositive ? "text-[#32d672]" : "text-[#c62828]")}>
                      {isPositive ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  );
                }
                return <span className="text-sm font-semibold text-[#8aa190]">-</span>;
              })()}
            </div>
            <div className="mt-6 grid grid-cols-4 gap-6 items-end justify-items-center min-h-[200px] px-6">
              {summary?.incomeSeries && summary.incomeSeries.length > 0 ? (
                summary.incomeSeries.slice(-4).map((item) => {
                  const maxVal = Math.max(...summary.incomeSeries.map(s => s.total));
                  const height = maxVal > 0 ? `${(item.total / maxVal) * 100}%` : '0%';
                  const date = new Date(item.ym + '-01');
                  const monthName = date.toLocaleDateString('tr-TR', { month: 'short' });

                  return (
                    <div key={item.ym} className="flex flex-col w-full items-center gap-3">
                      <div
                        className="w-full rounded-t-xl bg-[#13ec49]"
                        style={{ height: height || '4px' }}
                      />
                      <p className="text-xs font-semibold text-[#3e5c45]">{monthName}</p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-4 text-center text-sm text-[#3e5c45] py-12">
                  Henüz veri bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        <div className={cn("space-y-6", user?.role !== 'admin' && "lg:col-span-3")}>
          {/* Bugünün Yoklama Kartı */}
          <div className="rounded-[24px] border border-[#b0c4b1] bg-white/95 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#141c16]">Bugünün Yoklama</h3>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs font-bold text-[#4a90e2] hover:underline flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                Yoklama Al
              </button>
            </div>
            {loading ? (
              <div className="text-sm text-[#3e5c45] text-center py-4">Yükleniyor...</div>
            ) : attendanceSummary && attendanceSummary.total_students > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#3e5c45]">Toplam Öğrenci</span>
                  <span className="text-lg font-bold text-[#111813]">
                    {attendanceSummary.total_students}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#e5f9eb]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0f7b32]" />
                      <span className="text-sm text-[#111813]">Geldi</span>
                    </div>
                    <span className="text-sm font-bold text-[#0f7b32]">
                      {attendanceSummary.present_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#fde7e7]">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-[#c62828]" />
                      <span className="text-sm text-[#111813]">Gelmedi</span>
                    </div>
                    <span className="text-sm font-bold text-[#c62828]">
                      {attendanceSummary.absent_count}
                    </span>
                  </div>

                  {attendanceSummary.late_count > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#fef3c7]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#f59e0b]" />
                        <span className="text-sm text-[#111813]">Geç Geldi</span>
                      </div>
                      <span className="text-sm font-bold text-[#f59e0b]">
                        {attendanceSummary.late_count}
                      </span>
                    </div>
                  )}
                  {attendanceSummary.early_leave_count > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#dbeafe]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#3b82f6]" />
                        <span className="text-sm text-[#111813]">Erken Çıktı</span>
                      </div>
                      <span className="text-sm font-bold text-[#3b82f6]">
                        {attendanceSummary.early_leave_count}
                      </span>
                    </div>
                  )}
                </div>
                {attendanceSummary.total_students > 0 && (
                  <div className="pt-2 border-t border-[#e4ede4]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#3e5c45]">Devamsızlık Oranı</span>
                      <span className="text-sm font-bold text-[#111813]">
                        {attendanceSummary.total_students > 0
                          ? (
                            (attendanceSummary.absent_count / attendanceSummary.total_students) *
                            100
                          ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[#3e5c45] mb-3">Henüz bugün için yoklama alınmamış.</p>
                <button
                  onClick={() => navigate('/attendance')}
                  className="text-xs font-semibold text-[#4a90e2] hover:underline"
                >
                  İlk Yoklamayı Al
                </button>
              </div>
            )}
          </div>

          {/* Yaklaşan Etkinlikler Kartı */}
          <div className="rounded-[24px] border border-[#b0c4b1] bg-white/95 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#141c16]">Yaklaşan Etkinlikler</h3>
              <button
                onClick={() => navigate('/events')}
                className="text-xs font-bold text-[#4a90e2] hover:underline"
              >
                Tümünü Gör
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#3e5c45] mb-3">Yaklaşan etkinlik bulunmuyor.</p>
                <button
                  onClick={() => navigate('/events')}
                  className="text-xs font-semibold text-[#4a90e2] hover:underline"
                >
                  Yeni Etkinlik Ekle
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {upcomingEvents.map((event) => {
                  const { day, month } = formatEventDate(event);
                  return (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#13ec49]/18 px-3 py-2 text-center min-w-[58px]">
                        <span className="text-base font-bold text-[#111813]">{day}</span>
                        <span className="text-xs text-[#3e5c45]">{month}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111813]">{event.name}</p>
                        <p className="text-xs text-[#3e5c45]">{formatEventDetail(event)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
