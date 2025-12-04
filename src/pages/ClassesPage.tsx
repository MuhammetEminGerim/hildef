import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

import StudentPhoto from '../components/StudentPhoto';
import { useClasses } from '../hooks/use-classes';
import { useStudents } from '../hooks/use-students';

export default function ClassesPage() {
  const { classes, loading: classesLoading, addClass, updateClass, deleteClass } = useClasses();
  const { students: allStudents, loading: studentsLoading, updateStudent } = useStudents();
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [selectedClassForStudent, setSelectedClassForStudent] = useState<string | null>(null);
  const { toast } = useToast();


  const [classForm, setClassForm] = useState({
    name: '',
    age_group: '',
    capacity: '',
  });

  const loading = classesLoading || studentsLoading;

  // Group students by class
  const classStudents = allStudents.reduce((acc, student) => {
    if (student.class_id) {
      if (!acc[student.class_id]) {
        acc[student.class_id] = [];
      }
      acc[student.class_id].push(student);
    }
    return acc;
  }, {} as Record<string, typeof allStudents>);

  // Get unassigned students
  const unassignedStudents = allStudents.filter(s => !s.class_id);

  function toggleClassExpanded(classId: string) {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  }

  async function handleCreateClass() {
    if (!classForm.name || !classForm.age_group) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Sınıf adı ve yaş grubu zorunludur',
      });
      return;
    }

    if (classForm.capacity && classForm.capacity.trim() !== '') {
      const capacity = Number(classForm.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Kapasite geçerli bir sayı olmalıdır (0\'dan büyük)',
        });
        return;
      }
    }

    try {
      await addClass({
        name: classForm.name,
        age_group: classForm.age_group,
        capacity: classForm.capacity ? Number(classForm.capacity) : 0,
        description: '',
      });

      toast({
        title: 'Başarılı',
        description: 'Sınıf oluşturuldu',
      });

      setIsCreateDialogOpen(false);
      setClassForm({ name: '', age_group: '', capacity: '' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Sınıf oluşturulamadı',
      });
    }
  }

  async function handleEditClass() {
    if (!selectedClass || !classForm.name || !classForm.age_group) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Sınıf adı ve yaş grubu zorunludur',
      });
      return;
    }

    if (classForm.capacity && classForm.capacity.trim() !== '') {
      const capacity = Number(classForm.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Kapasite geçerli bir sayı olmalıdır (0\'dan büyük)',
        });
        return;
      }
    }

    try {
      await updateClass(selectedClass.id, {
        name: classForm.name,
        age_group: classForm.age_group,
        capacity: classForm.capacity ? Number(classForm.capacity) : 0,
      });

      toast({
        title: 'Başarılı',
        description: 'Sınıf güncellendi',
      });

      setIsEditDialogOpen(false);
      setSelectedClass(null);
      setClassForm({ name: '', age_group: '', capacity: '' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Sınıf güncellenemedi',
      });
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz?')) return;

    try {
      await deleteClass(classId);
      toast({
        title: 'Başarılı',
        description: 'Sınıf silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Sınıf silinemedi',
      });
    }
  }

  async function handleRemoveStudentFromClass(studentId: string) {
    if (!window.confirm('Öğrenciyi sınıftan çıkarmak istediğinize emin misiniz?')) return;

    try {
      await updateStudent(studentId, { class_id: null });
      toast({
        title: 'Başarılı',
        description: 'Öğrenci sınıftan çıkarıldı',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Öğrenci çıkarılamadı',
      });
    }
  }

  async function handleAddStudentToClass(studentId: string) {
    if (!selectedClassForStudent) return;

    try {
      await updateStudent(studentId, { class_id: selectedClassForStudent });
      toast({
        title: 'Başarılı',
        description: 'Öğrenci sınıfa eklendi',
      });
      setIsAddStudentDialogOpen(false);
      setSelectedClassForStudent(null);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Öğrenci eklenemedi',
      });
    }
  }

  function openEditDialog(cls: any) {
    setSelectedClass(cls);
    setClassForm({
      name: cls.name,
      age_group: cls.age_group,
      capacity: cls.capacity?.toString() || '',
    });
    setIsEditDialogOpen(true);
  }

  function openAddStudentDialog(classId: string) {
    setSelectedClassForStudent(classId);
    setIsAddStudentDialogOpen(true);
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
            <h2 className="text-3xl font-semibold tracking-tight">Sınıflar</h2>
            <p className="text-sm text-[#3e5c45]">Sınıfları yönetin ve öğrencileri atayın.</p>
          </div>
          <Button
            className="h-11 rounded-xl bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915] font-semibold gap-2 px-5"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Yeni Sınıf Ekle
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-[#3e5c45]">Yükleniyor...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 text-[#3e5c45]">
            Henüz sınıf eklenmemiş. Yeni sınıf eklemek için yukarıdaki butona tıklayın.
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => {
              const students = classStudents[cls.id] || [];
              const isExpanded = expandedClasses.has(cls.id);

              return (
                <div
                  key={cls.id}
                  className="rounded-[24px] border border-[#b0c4b1] bg-white overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleClassExpanded(cls.id)}
                          className="p-2 hover:bg-[#f1f5f1] rounded-lg transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-[#3e5c45]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-[#3e5c45]" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{cls.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-[#3e5c45]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {cls.age_group}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {students.length} / {cls.capacity || '∞'} öğrenci
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg border border-[#e0ede3] hover:bg-[#e8f7ec]"
                          onClick={() => openAddStudentDialog(cls.id)}
                        >
                          <Plus className="h-4 w-4 text-[#111813]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg border border-[#e0ede3] hover:bg-[#e8f7ec]"
                          onClick={() => openEditDialog(cls)}
                        >
                          <Edit className="h-4 w-4 text-[#111813]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg border border-[#ffe6e6] hover:bg-[#ffecec]"
                          onClick={() => handleDeleteClass(cls.id)}
                        >
                          <Trash2 className="h-4 w-4 text-[#c62828]" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-[#e4ede4]">
                        {students.length === 0 ? (
                          <p className="text-sm text-[#3e5c45] text-center py-4">
                            Bu sınıfta henüz öğrenci yok.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-[#e0ede3] hover:bg-[#f8fdf8]"
                              >
                                <div className="flex items-center gap-3">
                                  <StudentPhoto
                                    path={student.photo_path}
                                    url={student.photo_url}
                                    name={student.name}
                                    size="sm"
                                  />
                                  <span className="text-sm font-medium">{student.name}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleRemoveStudentFromClass(student.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-[#c62828]" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Sınıf Ekle</DialogTitle>
            <DialogDescription>Yeni bir sınıf oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Sınıf Adı *</Label>
              <Input
                id="name"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="Örn: Papatya Sınıfı"
              />
            </div>
            <div>
              <Label htmlFor="age_group">Yaş Grubu *</Label>
              <Input
                id="age_group"
                value={classForm.age_group}
                onChange={(e) => setClassForm({ ...classForm, age_group: e.target.value })}
                placeholder="Örn: 3-4 yaş"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Kapasite</Label>
              <Input
                id="capacity"
                type="number"
                value={classForm.capacity}
                onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                placeholder="Örn: 20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateClass}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sınıfı Düzenle</DialogTitle>
            <DialogDescription>Sınıf bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Sınıf Adı *</Label>
              <Input
                id="edit-name"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-age_group">Yaş Grubu *</Label>
              <Input
                id="edit-age_group"
                value={classForm.age_group}
                onChange={(e) => setClassForm({ ...classForm, age_group: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-capacity">Kapasite</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={classForm.capacity}
                onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEditClass}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student to Class Dialog */}
      <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sınıfa Öğrenci Ekle</DialogTitle>
            <DialogDescription>Sınıfa atanmamış öğrencilerden seçin.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {unassignedStudents.length === 0 ? (
              <p className="text-sm text-[#3e5c45] text-center py-8">
                Sınıfa atanmamış öğrenci yok.
              </p>
            ) : (
              <div className="space-y-2">
                {unassignedStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleAddStudentToClass(student.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#e0ede3] hover:bg-[#f8fdf8] transition"
                  >
                    <StudentPhoto
                      path={student.photo_path}
                      url={student.photo_url}
                      name={student.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{student.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
