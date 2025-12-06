import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, Filter } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn, getLocalToday } from '@/lib/utils';
import StudentPhoto from '../components/StudentPhoto';
import { useClasses } from '../hooks/use-classes';
import { useStudents } from '../hooks/use-students';
import { useAttendance } from '../hooks/use-attendance';

type ViewMode = 'class' | 'student';

export default function AttendanceHistoryPage() {
  const { classes } = useClasses();
  const { students } = useStudents();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState(getLocalToday());
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'early_leave'>('all');

  // Get attendance for date range
  const { attendance: allAttendance, loading } = useAttendance(startDate, endDate);

  const navigate = useNavigate();


  // Filter attendance records
  const filteredRecords = useMemo(() => {
    let filtered = allAttendance;

    // Filter by class
    if (viewMode === 'class' && selectedClassId) {
      const classStudentIds = students
        .filter(s => s.class_id === selectedClassId)
        .map(s => s.id);
      filtered = filtered.filter(a => classStudentIds.includes(a.student_id));
    }

    // Filter by student
    if (viewMode === 'student' && selectedStudentId) {
      filtered = filtered.filter(a => a.student_id === selectedStudentId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allAttendance, viewMode, selectedClassId, selectedStudentId, students, statusFilter]);

  const statistics = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status === 'absent').length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    const earlyLeave = filteredRecords.filter((r) => r.status === 'early_leave').length;
    const absenceRate = total > 0 ? ((absent / total) * 100).toFixed(1) : '0';

    return {
      total,
      present,
      absent,
      late,
      earlyLeave,
      absenceRate,
    };
  }, [filteredRecords]);

  const statusLabels = {
    present: 'Geldi',
    absent: 'Gelmedi',
    late: 'Geç Geldi',
    early_leave: 'Erken Çıktı',
  };

  const statusColors = {
    present: 'bg-[#e5f9eb] text-[#0f7b32]',
    absent: 'bg-[#fde7e7] text-[#c62828]',
    late: 'bg-[#fef3c7] text-[#f59e0b]',
    early_leave: 'bg-[#dbeafe] text-[#3b82f6]',
  };



  function getClassName(studentId: string) {
    const student = students.find(s => s.id === studentId);
    if (!student?.class_id) return 'Sınıfsız';
    const cls = classes.find(c => c.id === student.class_id);
    return cls?.name || 'Bilinmeyen';
  }

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Yoklama Geçmişi</h2>
            <p className="text-sm text-[#3e5c45]">Geçmiş yoklama kayıtlarını görüntüleyin.</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="border border-[#b0c4b1]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Görünüm Modu</Label>
              <Select
                value={viewMode}
                onValueChange={(val: any) => {
                  setViewMode(val);
                  if (val === 'class') {
                    setSelectedStudentId(null);
                  } else {
                    setSelectedClassId(null);
                  }
                }}
              >
                <option value="class">Sınıf Bazlı</option>
                <option value="student">Öğrenci Bazlı</option>
              </Select>
            </div>

            {viewMode === 'class' ? (
              <div>
                <Label>Sınıf</Label>
                <Select
                  value={selectedClassId || ''}
                  onValueChange={(val) => setSelectedClassId(val || null)}
                >
                  <option value="">Tüm Sınıflar</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <Label>Öğrenci</Label>
                <Select
                  value={selectedStudentId || ''}
                  onValueChange={(val) => setSelectedStudentId(val || null)}
                >
                  <option value="">Tüm Öğrenciler</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label>Durum</Label>
              <Select
                value={statusFilter}
                onValueChange={(val: any) => setStatusFilter(val)}
              >
                <option value="all">Tümü</option>
                <option value="present">Geldi</option>
                <option value="absent">Gelmedi</option>
                <option value="late">Geç Geldi</option>
                <option value="early_leave">Erken Çıktı</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Başlangıç Tarihi</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Toplam Kayıt</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Geldi</p>
                <p className="text-2xl font-bold text-green-600">{statistics.present}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Gelmedi</p>
                <p className="text-2xl font-bold text-red-600">{statistics.absent}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Geç Geldi</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.late}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Devamsızlık Oranı</p>
                <p className="text-2xl font-bold">{statistics.absenceRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Records Table */}
      <Card className="border border-[#b0c4b1]">
        <CardHeader>
          <CardTitle>Yoklama Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {selectedClassId || selectedStudentId
                ? 'Seçilen kriterlere uygun yoklama kaydı bulunamadı.'
                : 'Lütfen bir sınıf veya öğrenci seçin.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-[#7d9785] bg-[#f1f5f1]">
                  <tr>
                    <th className="px-6 py-4 font-medium text-left">Tarih</th>
                    {viewMode === 'student' && <th className="px-6 py-4 font-medium text-left">Sınıf</th>}
                    {viewMode === 'class' && <th className="px-6 py-4 font-medium text-left">Öğrenci</th>}
                    <th className="px-6 py-4 font-medium text-left">Durum</th>
                    <th className="px-6 py-4 font-medium text-left">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const student = students.find((s) => s.id === record.student_id);

                    return (
                      <tr key={record.id} className="border-b border-[#ecf2ec] hover:bg-[#f6f8f6]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(record.date).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </td>
                        {viewMode === 'student' && (
                          <td className="px-6 py-4">
                            <span className="font-medium">
                              {getClassName(record.student_id)}
                            </span>
                          </td>
                        )}
                        {viewMode === 'class' && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <StudentPhoto
                                path={student?.photo_url || student?.photo_path}
                                name={student?.name || 'Bilinmeyen'}
                                size="sm"
                              />
                              <span className="font-medium">
                                {student?.name || 'Bilinmeyen'}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                              statusColors[record.status]
                            )}
                          >
                            {statusLabels[record.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground">{record.notes || '-'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
