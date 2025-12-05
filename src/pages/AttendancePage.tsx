import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, LogOut, ArrowLeft, Save, Users, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import StudentPhoto from '../components/StudentPhoto';
import { useClasses } from '../hooks/use-classes';
import { useStudents } from '../hooks/use-students';
import { useAttendance } from '../hooks/use-attendance';
import { cn, getLocalToday } from '@/lib/utils';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

type AttendanceRecord = {
  student_id: string;
  status: AttendanceStatus | '';
  notes?: string;
};

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const classIdParam = searchParams.get('classId');

  const { classes } = useClasses();
  const { students: allStudents } = useStudents();
  const [attendanceDate, setAttendanceDate] = useState(getLocalToday());
  const { attendance: existingAttendance, addAttendance, updateAttendance } = useAttendance(attendanceDate);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    classIdParam || null
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Get students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return allStudents.filter(s => s.class_id === selectedClassId);
  }, [allStudents, selectedClassId]);

  // Initialize attendance records when class or date changes
  useEffect(() => {
    if (classStudents.length > 0) {
      const records: Record<string, AttendanceRecord> = {};

      classStudents.forEach((student) => {
        const existing = existingAttendance.find(a => a.student_id === student.id);
        records[student.id] = existing
          ? {
            student_id: student.id,
            status: existing.status,
            notes: existing.notes || '',
          }
          : {
            student_id: student.id,
            status: '',
            notes: '',
          };
      });

      setAttendanceRecords(records);
    } else {
      setAttendanceRecords({});
    }
  }, [classStudents, existingAttendance]);

  function updateRecord(studentId: string, field: keyof AttendanceRecord, value: any) {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  }

  function markAll(status: AttendanceStatus) {
    const updated = { ...attendanceRecords };
    Object.keys(updated).forEach((studentId) => {
      updated[studentId].status = status;
    });
    setAttendanceRecords(updated);
  }

  async function handleSave() {
    if (!selectedClassId) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Lütfen bir sınıf seçin',
      });
      return;
    }

    const recordsToSave = Object.values(attendanceRecords).filter(
      (r) => r.status !== ''
    );

    if (recordsToSave.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'En az bir öğrenci için yoklama durumu seçmelisiniz',
      });
      return;
    }

    try {
      setSaving(true);

      for (const record of recordsToSave) {
        const existing = existingAttendance.find(a => a.student_id === record.student_id);

        if (existing) {
          await updateAttendance(existing.id, {
            status: record.status as AttendanceStatus,
            notes: record.notes || '',
          });
        } else {
          await addAttendance({
            student_id: record.student_id,
            date: attendanceDate,
            status: record.status as AttendanceStatus,
            notes: record.notes || '',
          });
        }
      }

      toast({
        title: 'Başarılı',
        description: 'Yoklama kaydedildi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Yoklama kaydedilemedi',
      });
    } finally {
      setSaving(false);
    }
  }

  const stats = useMemo(() => {
    const records = Object.values(attendanceRecords);
    return {
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      earlyLeave: records.filter((r) => r.status === 'early_leave').length,
      total: classStudents.length,
    };
  }, [attendanceRecords, classStudents]);

  const statusOptions = [
    { value: 'present', label: 'Geldi', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    { value: 'absent', label: 'Gelmedi', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { value: 'late', label: 'Geç Geldi', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    { value: 'early_leave', label: 'Erken Çıktı', icon: LogOut, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Yoklama</h2>
            <p className="text-sm text-[#3e5c45]">Günlük yoklama işlemlerini yapın.</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedClassId}
          className="h-11 rounded-xl bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915] font-semibold gap-2 px-5"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="rounded-[24px] border border-[#b0c4b1] bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="class">Sınıf Seçin *</Label>
            <Select
              id="class"
              value={selectedClassId || ''}
              onValueChange={(value) => setSelectedClassId(value || null)}
              className="h-12 rounded-2xl"
            >
              <option value="">Sınıf seçiniz</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.age_group})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Tarih *</Label>
            <Input
              id="date"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
        </div>
      </div>

      {selectedClassId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {stats.total}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Geldi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  {stats.present}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Gelmedi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  {stats.absent}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">Geç</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  {stats.late}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Erken Çıktı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2 text-blue-600">
                  <LogOut className="h-5 w-5" />
                  {stats.earlyLeave}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground self-center">Hızlı İşlem:</span>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant="outline"
                  onClick={() => markAll(option.value as AttendanceStatus)}
                  className="gap-2"
                >
                  <Icon className={cn("h-4 w-4", option.color)} />
                  Tümünü {option.label}
                </Button>
              );
            })}
          </div>

          {/* Student List */}
          <div className="rounded-[24px] border border-[#b0c4b1] bg-white">
            {classStudents.length === 0 ? (
              <div className="text-center py-12 text-[#3e5c45]">
                Bu sınıfta öğrenci bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-[#ecf2ec]">
                {classStudents.map((student) => {
                  const record = attendanceRecords[student.id];
                  if (!record) return null;

                  return (
                    <div key={student.id} className="p-6 hover:bg-[#f8fdf8]">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <StudentPhoto
                            path={student.photo_url || student.photo_path}
                            name={student.name}
                            size="md"
                          />
                          <div>
                            <div className="font-semibold">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.birth_date && new Date(student.birth_date).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {statusOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = record.status === option.value;

                            return (
                              <button
                                key={option.value}
                                onClick={() => updateRecord(student.id, 'status', option.value)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition",
                                  isSelected
                                    ? cn(option.bg, "border-current")
                                    : "border-[#e0ede3] hover:bg-[#f8fdf8]"
                                )}
                              >
                                <Icon className={cn("h-4 w-4", isSelected ? option.color : "text-muted-foreground")} />
                                <span className={cn("text-sm font-medium", isSelected ? option.color : "text-muted-foreground")}>
                                  {option.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {record.status && (
                        <div className="mt-4">
                          <Input
                            placeholder="Not ekle (opsiyonel)"
                            value={record.notes || ''}
                            onChange={(e) => updateRecord(student.id, 'notes', e.target.value)}
                            className="max-w-md"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedClassId && (
        <div className="text-center py-12 text-[#3e5c45] rounded-[24px] border border-[#b0c4b1] bg-white">
          Yoklama almak için yukarıdan bir sınıf seçin.
        </div>
      )}
    </div>
  );
}
