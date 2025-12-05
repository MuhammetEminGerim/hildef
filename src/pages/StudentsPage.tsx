import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, User, FileText } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { useStudents } from '../hooks/use-students';
import { useStudentParents } from '../hooks/use-student-parents';
import { useStudentHealth } from '../hooks/use-student-health';
import { useStudentVaccinations } from '../hooks/use-student-vaccinations';
import { useStudentFiles } from '../hooks/use-student-files';
import { useClasses } from '../hooks/use-classes';
import { getLocalToday } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUpload } from '../components/ui/file-upload';
import { Select } from '../components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../components/ui/skeleton';
import { Student, StudentParent, StudentHealth, StudentVaccination, StudentFile } from '../lib/types';
import { uploadImageToCloudinary } from '../lib/cloudinary';



// Student Photo Component
function StudentPhoto({ path, url, name }: { path?: string | null; url?: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  const imageSrc = url || (path ? `app://local-file/${path}` : null);

  if (!imageSrc || hasError) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <User className="h-4 w-4" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      className="w-8 h-8 rounded-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}



const createEmptyHealth = (studentId: string): StudentHealth => ({
  id: '',
  student_id: studentId,
  chronic_diseases: '',
  allergies: '',
  medications: '',
  doctor_name: '',
  doctor_phone: '',
  insurance_info: '',
  notes: '',
});

export default function StudentsPage() {
  const { toast } = useToast();
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents();
  const { classes } = useClasses();

  // State declarations FIRST
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [fileUploadType, setFileUploadType] = useState<'health_report' | 'identity' | 'contract' | 'other'>('health_report');
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  // Sub-collection hooks AFTER selectedStudent is defined
  const { parents: studentParents, addParent, updateParent, deleteParent, setPrimary } = useStudentParents(selectedStudent?.id);
  const { health: studentHealth, saveHealth } = useStudentHealth(selectedStudent?.id);
  const { vaccinations: studentVaccinations, addVaccination, updateVaccination, deleteVaccination } = useStudentVaccinations(selectedStudent?.id);
  const { files: studentFiles, addFile, deleteFile, openFile } = useStudentFiles(selectedStudent?.id);

  const [form, setForm] = useState<Partial<Student>>({
    name: '',
    date_of_birth: '',
    gender: null,
    tc_identity_no: '',
    blood_type: '',
    birth_place: '',
    parent_name: '',
    phone: '',
    emergency_contact: '',
    enrollment_date: getLocalToday(),
    monthly_fee: 0,
    status: 'active',
    notes: '',
  });
  // Local state for editing
  const [localParents, setLocalParents] = useState<StudentParent[]>([]);
  const [localHealth, setLocalHealth] = useState<StudentHealth | null>(null);
  const [localVaccinations, setLocalVaccinations] = useState<StudentVaccination[]>([]);
  const [localFiles, setLocalFiles] = useState<StudentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with hook data
  useEffect(() => {
    if (studentParents) setLocalParents(studentParents);
  }, [studentParents]);

  useEffect(() => {
    if (studentHealth) setLocalHealth(studentHealth);
    else if (selectedStudent?.id) setLocalHealth(createEmptyHealth(selectedStudent.id));
  }, [studentHealth, selectedStudent]);

  useEffect(() => {
    if (studentVaccinations) setLocalVaccinations(studentVaccinations);
  }, [studentVaccinations]);

  useEffect(() => {
    if (studentFiles) setLocalFiles(studentFiles);
  }, [studentFiles]);


  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error,
      });
    }
  }, [error, toast]);

  const pageSize = 4;



  const getStudentClass = (student: Student) => {
    if (!student.class_id) {
      return 'Sınıf Belirtilmedi';
    }
    const cls = classes.find((c) => c.id === student.class_id);
    return cls ? cls.name : 'Sınıf Belirtilmedi';
  };

  const classOptions = useMemo(() => {
    const classes = new Set<string>();
    if (Array.isArray(students)) {
      students.forEach((student) => {
        const className = getStudentClass(student);
        if (className && className !== 'Sınıf Belirtilmedi') {
          classes.add(className);
        }
      });
    }
    return Array.from(classes);
  }, [students]);


  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, statusFilter, classFilter]);

  function filterStudents() {
    // Eğer students array değilse, boş array kullan
    if (!Array.isArray(students)) {
      setFilteredStudents([]);
      return;
    }

    let filtered = [...students];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.parent_name.toLowerCase().includes(query) ||
          s.phone.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter((s) => getStudentClass(s) === classFilter);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);
  const showingStart = filteredStudents.length === 0 ? 0 : startIndex + 1;
  const showingEnd = startIndex + paginatedStudents.length;

  const visiblePages = useMemo(() => {
    const length = Math.min(3, totalPages);
    const start = Math.min(
      Math.max(currentPage - 1, 1),
      Math.max(totalPages - length + 1, 1)
    );
    return Array.from({ length }, (_, idx) => start + idx);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const statusBadgeMap: Record<
    NonNullable<Student['status']> | 'pending',
    { label: string; bg: string; text: string }
  > = {
    active: { label: 'Aktif', bg: 'bg-[#e1f8e9]', text: 'text-[#0f7b32]' },
    graduated: { label: 'Mezun', bg: 'bg-[#e0f2ff]', text: 'text-[#0b5fab]' },
    transferred: { label: 'Nakil', bg: 'bg-[#fff4e0]', text: 'text-[#b15d00]' },
    suspended: { label: 'Pasif', bg: 'bg-[#fde5e5]', text: 'text-[#c62828]' },
    pending: { label: 'Beklemede', bg: 'bg-[#fff6d7]', text: 'text-[#b28705]' },
  };

  const getStatusBadge = (status?: Student['status']) => {
    return statusBadgeMap[status ?? 'active'] ?? statusBadgeMap.active;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('tr-TR');
  };





  function resetForm() {
    setForm({
      name: '',
      date_of_birth: '',
      gender: null,
      tc_identity_no: '',
      blood_type: '',
      birth_place: '',
      parent_name: '',
      phone: '',
      emergency_contact: '',
      enrollment_date: getLocalToday(),
      monthly_fee: 0,
      status: 'active',
      notes: '',
    });
    setSelectedStudent(null);
    setFileUploadType('health_report');
    setPendingPhoto(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.parent_name || !form.phone || form.monthly_fee === undefined || form.monthly_fee === null) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Lütfen zorunlu alanları doldurun',
      });
      return;
    }

    // Telefon numarası validasyonu (daha esnek - sadece boş olmamalı)
    if (!form.phone || form.phone.trim().length < 5) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Geçerli bir telefon numarası girin',
      });
      return;
    }

    // Aylık ücret validasyonu
    const monthlyFee = typeof form.monthly_fee === 'number' ? form.monthly_fee : Number(form.monthly_fee);
    if (isNaN(monthlyFee) || monthlyFee < 0) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Aylık ücret geçerli bir sayı olmalıdır (0 veya pozitif)',
      });
      return;
    }

    // Doğum tarihi validasyonu (sadece geçerli tarih kontrolü)
    if (form.date_of_birth) {
      const birthDate = new Date(form.date_of_birth);
      if (isNaN(birthDate.getTime())) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Geçerli bir doğum tarihi girin',
        });
        return;
      }
    }

    // Kayıt tarihi validasyonu (sadece geçerli tarih kontrolü)
    if (form.enrollment_date) {
      const enrollmentDate = new Date(form.enrollment_date);
      if (isNaN(enrollmentDate.getTime())) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Geçerli bir kayıt tarihi girin',
        });
        return;
      }
    }

    try {
      // Type-safe payload oluştur
      const payload: any = {
        ...form,
        name: form.name!,
        parent_name: form.parent_name!,
        phone: form.phone!,
        date_of_birth: form.date_of_birth || '2000-01-01',
        enrollment_date: form.enrollment_date || getLocalToday(),
        monthly_fee: typeof form.monthly_fee === 'number' ? form.monthly_fee : Number(form.monthly_fee) || 0,
        status: (form.status || 'active') as Student['status'],
        is_active: true,
      };

      if (selectedStudent?.id) {
        await updateStudent(selectedStudent.id, payload, pendingPhoto || undefined);
        toast({
          title: 'Başarılı',
          description: 'Öğrenci güncellendi',
        });
      } else {
        await addStudent(payload, pendingPhoto || undefined);
        toast({
          title: 'Başarılı',
          description: 'Öğrenci eklendi',
        });
      }

      // Note: Parent/Health/Vaccination/File sub-collections logic needs to be updated to Firestore too.
      // For now, we are focusing on the main Student record.
      // We will need separate hooks or sub-collection logic for these.

      resetForm();
      setIsDialogOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message ?? 'Kayıt işlemi başarısız',
      });
    }
  }

  async function handleDelete(student: Student) {
    if (!window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;

    if (!student.id) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Öğrenci ID bulunamadı',
      });
      return;
    }
    try {
      await deleteStudent(student.id);
      toast({
        title: 'Başarılı',
        description: 'Öğrenci silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Silme işlemi başarısız',
      });
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!selectedStudent?.id) {
      setPendingPhoto(file);
      toast({
        title: 'Bilgi',
        description: 'Önce öğrenciyi kaydedin, fotoğraf otomatik yüklenecek',
      });
      return;
    }

    try {
      const photoUrl = await uploadImageToCloudinary(file);
      await updateStudent(selectedStudent.id, { photo_url: photoUrl });
      toast({
        title: 'Başarılı',
        description: 'Fotoğraf yüklendi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message ?? 'Fotoğraf yüklenemedi',
      });
    }
  }

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Öğrenci Listesi</h2>
          <p className="text-sm text-[#3e5c45]">Tüm kayıtlı öğrencileri yönetin ve görüntüleyin.</p>
        </div>
        <Button
          className="h-11 rounded-xl bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915] font-semibold gap-2 px-5"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Yeni Öğrenci Ekle
        </Button>
      </motion.div>

      <div className="rounded-[24px] border border-[#b0c4b1] bg-white px-4 py-5 md:flex md:items-center md:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8aa692]" />
            <Input
              placeholder="Öğrenci, veli veya sınıfa göre ara"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border border-[#e0ede3] bg-[#f6f8f6] pl-10 text-sm text-[#111813] placeholder:text-[#8aa692]"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2 md:mt-0">
          <Select
            value={classFilter}
            onValueChange={(value) => setClassFilter(value)}
            className="h-12 min-w-[140px] rounded-2xl border border-[#e0ede3] bg-[#f6f8f6] text-sm font-medium text-[#111813] focus-visible:ring-[#13ec49]/40"
          >
            <option value="all">Tüm Sınıflar</option>
            {classOptions.length === 0 ? (
              <option value="Sınıf Belirtilmedi">Sınıf Belirtilmedi</option>
            ) : (
              classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))
            )}
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
            className="h-12 min-w-[140px] rounded-2xl border border-[#e0ede3] bg-[#f6f8f6] text-sm font-medium text-[#111813] focus-visible:ring-[#13ec49]/40"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="graduated">Mezun</option>
            <option value="transferred">Nakil</option>
            <option value="suspended">Pasif</option>
          </Select>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#b0c4b1] bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : paginatedStudents.length ? (
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-[#7d9785] bg-[#f1f5f1]">
              <tr>
                <th className="px-6 py-4 font-medium">Öğrenci</th>
                <th className="px-6 py-4 font-medium">Sınıf</th>
                <th className="px-6 py-4 font-medium">Veli Bilgileri</th>
                <th className="px-6 py-4 font-medium">Kayıt Tarihi</th>
                <th className="px-6 py-4 font-medium">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => {
                const badge = getStatusBadge(student.status);
                return (
                  <tr
                    key={student.id}
                    className="border-b border-[#ecf2ec] last:border-0 hover:bg-[#f8fdf8]"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <StudentPhoto path={student.photo_path} url={student.photo_url} name={student.name} />
                        <div className="flex flex-col">
                          <span className="font-semibold">{student.name}</span>
                          <span className="text-sm text-[#3e5c45]">{student.parent_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[#3e5c45]">{getStudentClass(student)}</td>
                    <td className="px-6 py-5">
                      <div className="font-medium">{student.parent_name}</div>
                      <div className="text-sm text-[#3e5c45]">{student.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-5 text-[#3e5c45]">
                      {formatDate(student.enrollment_date)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg border border-[#e0ede3] hover:bg-[#e8f7ec]"
                          onClick={() => {
                            if (student.id) {
                              setSelectedStudent(student);
                              setForm(student);
                              setIsDialogOpen(true);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 text-[#111813]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg border border-[#ffe6e6] hover:bg-[#ffecec]"
                          onClick={() => void handleDelete(student)}
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
        ) : (
          <div className="py-16 text-center text-[#7d9785]">Henüz öğrenci eklenmemiş.</div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 px-2 text-sm text-[#3e5c45] sm:flex-row">
        <span>
          {filteredStudents.length
            ? `${showingStart}-${showingEnd} / ${filteredStudents.length} arası gösteriliyor`
            : '0 kayıt görüntüleniyor'}
        </span>
        <div className="inline-flex h-9 overflow-hidden rounded-lg border border-[#b0c4b1] text-sm">
          <button
            className="px-4 text-[#3e5c45] hover:bg-[#e8f4eb] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Önceki
          </button>
          {visiblePages.map((page) => (
            <button
              key={page}
              className={`px-3 font-semibold ${page === currentPage ? 'bg-[#c9f3d5] text-[#111813]' : 'text-[#3e5c45] hover:bg-[#e8f4eb]'
                }`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="px-4 text-[#3e5c45] hover:bg-[#e8f4eb] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || filteredStudents.length === 0}
          >
            Sonraki
          </button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
            </DialogTitle>
            <DialogDescription>
              Öğrenci bilgilerini girin ve kaydedin
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="parents">Veli Bilgileri</TabsTrigger>
              <TabsTrigger value="health">Sağlık</TabsTrigger>
              <TabsTrigger value="vaccinations">Aşılar</TabsTrigger>
              <TabsTrigger value="files">Dosyalar</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FileUpload
                      label="Öğrenci Fotoğrafı"
                      onFileSelect={(file) => {
                        if (file instanceof File) {
                          handlePhotoUpload(file);
                        }
                      }}
                      currentFile={selectedStudent?.photo_path || (pendingPhoto ? URL.createObjectURL(pendingPhoto) : undefined)}
                      onRemove={() => {
                        setPendingPhoto(null);
                        if (selectedStudent?.id) {
                          updateStudent(selectedStudent.id, { photo_path: null, photo_url: null });
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Çocuk Adı *</Label>
                    <Input
                      id="name"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Doğum Tarihi *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={form.date_of_birth || ''}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Cinsiyet</Label>
                    <Select
                      value={form.gender || ''}
                      onValueChange={(v) => setForm({ ...form, gender: v as 'M' | 'F' | null })}
                    >
                      <option value="">Seçiniz</option>
                      <option value="M">Erkek</option>
                      <option value="F">Kız</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tc_identity_no">TC Kimlik No</Label>
                    <Input
                      id="tc_identity_no"
                      value={form.tc_identity_no || ''}
                      onChange={(e) => setForm({ ...form, tc_identity_no: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="blood_type">Kan Grubu</Label>
                    <Select
                      value={form.blood_type || ''}
                      onValueChange={(v) => setForm({ ...form, blood_type: v })}
                    >
                      <option value="">Seçiniz</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="birth_place">Doğum Yeri</Label>
                    <Input
                      id="birth_place"
                      value={form.birth_place || ''}
                      onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="parent_name">Veli Adı *</Label>
                    <Input
                      id="parent_name"
                      value={form.parent_name || ''}
                      onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergency_contact">Acil İletişim</Label>
                    <Input
                      id="emergency_contact"
                      value={form.emergency_contact || ''}
                      onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="enrollment_date">Kayıt Tarihi *</Label>
                    <Input
                      id="enrollment_date"
                      type="date"
                      value={form.enrollment_date || ''}
                      onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthly_fee">Aylık Ücret (TL) *</Label>
                    <Input
                      id="monthly_fee"
                      type="number"
                      step="0.01"
                      value={form.monthly_fee || ''}
                      onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Durum</Label>
                    <Select
                      value={form.status || 'active'}
                      onValueChange={(v) => setForm({ ...form, status: v as Student['status'] })}
                    >
                      <option value="active">Aktif</option>
                      <option value="graduated">Mezun</option>
                      <option value="transferred">Nakil</option>
                      <option value="suspended">Askıya Alındı</option>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="notes">Notlar</Label>
                    <textarea
                      id="notes"
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.notes || ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Veli Bilgileri</h3>
                    {selectedStudent?.id && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const studentId = selectedStudent.id;
                          if (!studentId) return;
                          setLocalParents([...localParents, {
                            id: '', // Temporary ID
                            student_id: studentId,
                            name: '',
                            relationship: 'mother',
                            phone: '',
                            email: undefined,
                            is_primary: localParents.length === 0,
                          }]);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Veli Ekle
                      </Button>
                    )}
                  </div>

                  {!selectedStudent?.id ? (
                    <p className="text-sm text-muted-foreground">
                      Önce öğrenciyi kaydedin
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {localParents.map((parent, idx) => (
                        <div key={parent.id || idx} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {parent.is_primary ? (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Birincil</span>
                              ) : null}
                              <span className="text-sm font-medium">
                                {parent.relationship === 'mother' ? 'Anne' : parent.relationship === 'father' ? 'Baba' : 'Vasi'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {!parent.is_primary && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (parent.id && selectedStudent?.id) {
                                      await setPrimary(parent.id, selectedStudent.id);
                                    }
                                  }}
                                >
                                  Birincil Yap
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (parent.id) {
                                    await deleteParent(parent.id);
                                  } else {
                                    setLocalParents(localParents.filter((_, i) => i !== idx));
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Ad Soyad *</Label>
                              <Input
                                value={parent.name}
                                onChange={(e) => {
                                  const updated = [...localParents];
                                  updated[idx].name = e.target.value;
                                  setLocalParents(updated);
                                }}
                                placeholder="Veli adı"
                              />
                            </div>
                            <div>
                              <Label>İlişki *</Label>
                              <Select
                                value={parent.relationship}
                                onValueChange={(v) => {
                                  const updated = [...localParents];
                                  updated[idx].relationship = v as 'mother' | 'father' | 'guardian';
                                  setLocalParents(updated);
                                }}
                              >
                                <option value="mother">Anne</option>
                                <option value="father">Baba</option>
                                <option value="guardian">Vasi</option>
                              </Select>
                            </div>
                            <div>
                              <Label>Telefon *</Label>
                              <Input
                                value={parent.phone}
                                onChange={(e) => {
                                  const updated = [...localParents];
                                  updated[idx].phone = e.target.value;
                                  setLocalParents(updated);
                                }}
                                placeholder="05XX XXX XX XX"
                              />
                            </div>
                            <div>
                              <Label>E-posta</Label>
                              <Input
                                type="email"
                                value={parent.email || ''}
                                onChange={(e) => {
                                  const updated = [...localParents];
                                  updated[idx].email = e.target.value;
                                  setLocalParents(updated);
                                }}
                                placeholder="email@example.com"
                              />
                            </div>
                          </div>

                          {parent.id ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!parent.name || !parent.phone) {
                                  toast({
                                    variant: 'destructive',
                                    title: 'Hata',
                                    description: 'Ad ve telefon zorunludur',
                                  });
                                  return;
                                }
                                if (!parent.id || !selectedStudent?.id) return;
                                await updateParent(parent.id, parent);
                                toast({
                                  title: 'Başarılı',
                                  description: 'Veli bilgileri güncellendi',
                                });
                              }}
                            >
                              Kaydet
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={async () => {
                                if (!parent.name || !parent.phone) {
                                  toast({
                                    variant: 'destructive',
                                    title: 'Hata',
                                    description: 'Ad ve telefon zorunludur',
                                  });
                                  return;
                                }
                                if (!selectedStudent?.id) {
                                  toast({
                                    variant: 'destructive',
                                    title: 'Hata',
                                    description: 'Önce öğrenciyi kaydedin',
                                  });
                                  return;
                                }
                                await addParent({
                                  student_id: selectedStudent.id,
                                  name: parent.name,
                                  relationship: parent.relationship,
                                  phone: parent.phone,
                                  email: parent.email || undefined,
                                  is_primary: parent.is_primary || false,
                                });
                                toast({
                                  title: 'Başarılı',
                                  description: 'Veli eklendi',
                                });
                              }}
                            >
                              Kaydet
                            </Button>
                          )}
                        </div>
                      ))}

                      {studentParents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Henüz veli eklenmemiş. "Veli Ekle" butonuna tıklayarak ekleyebilirsiniz.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="health" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sağlık Bilgileri</h3>
                  {!selectedStudent?.id ? (
                    <p className="text-sm text-muted-foreground">
                      Önce öğrenciyi kaydedin
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Kronik Rahatsızlıklar</Label>
                        <Input
                          value={localHealth?.chronic_diseases || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, chronic_diseases: e.target.value })}
                          placeholder="Yok"
                        />
                      </div>
                      <div>
                        <Label>Alerjiler</Label>
                        <Input
                          value={localHealth?.allergies || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, allergies: e.target.value })}
                          placeholder="Yok"
                        />
                      </div>
                      <div>
                        <Label>Sürekli Kullanılan İlaçlar</Label>
                        <Input
                          value={localHealth?.medications || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, medications: e.target.value })}
                          placeholder="Yok"
                        />
                      </div>
                      <div>
                        <Label>Doktor Adı</Label>
                        <Input
                          value={localHealth?.doctor_name || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, doctor_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Doktor Telefon</Label>
                        <Input
                          value={localHealth?.doctor_phone || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, doctor_phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Sigorta Bilgileri</Label>
                        <Input
                          value={localHealth?.insurance_info || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, insurance_info: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Notlar</Label>
                        <textarea
                          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={localHealth?.notes || ''}
                          onChange={(e) => localHealth && setLocalHealth({ ...localHealth, notes: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          onClick={async () => {
                            if (localHealth) {
                              const { id, created_at, updated_at, ...healthData } = localHealth;
                              await saveHealth(healthData);
                              toast({
                                title: 'Başarılı',
                                description: 'Sağlık bilgileri güncellendi',
                              });
                            }
                          }}
                        >
                          Kaydet
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vaccinations" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Aşı Kayıtları</h3>
                    {selectedStudent?.id && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setLocalVaccinations([...localVaccinations, {
                            id: '',
                            student_id: selectedStudent.id,
                            vaccine_name: '',
                            vaccine_date: getLocalToday(),
                            next_dose_date: undefined,
                            notes: undefined,
                          }]);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Aşı Ekle
                      </Button>
                    )}
                  </div>

                  {!selectedStudent?.id ? (
                    <p className="text-sm text-muted-foreground">
                      Önce öğrenciyi kaydedin
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {localVaccinations.map((vaccination, idx) => (
                        <div key={vaccination.id || idx} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Aşı Kaydı</h4>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (vaccination.id) {
                                  await deleteVaccination(vaccination.id);
                                  toast({
                                    title: 'Başarılı',
                                    description: 'Aşı kaydı silindi',
                                  });
                                } else {
                                  setLocalVaccinations(localVaccinations.filter((_, i) => i !== idx));
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Aşı Adı *</Label>
                              <Input
                                value={vaccination.vaccine_name}
                                onChange={(e) => {
                                  const updated = [...localVaccinations];
                                  updated[idx].vaccine_name = e.target.value;
                                  setLocalVaccinations(updated);
                                }}
                                placeholder="Örn: KKK, Hepatit B"
                              />
                            </div>
                            <div>
                              <Label>Aşı Tarihi *</Label>
                              <Input
                                type="date"
                                value={vaccination.vaccine_date}
                                onChange={(e) => {
                                  const updated = [...localVaccinations];
                                  updated[idx].vaccine_date = e.target.value;
                                  setLocalVaccinations(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Sonraki Doz Tarihi</Label>
                              <Input
                                type="date"
                                value={vaccination.next_dose_date || ''}
                                onChange={(e) => {
                                  const updated = [...localVaccinations];
                                  updated[idx].next_dose_date = e.target.value || undefined;
                                  setLocalVaccinations(updated);
                                }}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label>Notlar</Label>
                              <textarea
                                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={vaccination.notes || ''}
                                onChange={(e) => {
                                  const updated = [...localVaccinations];
                                  updated[idx].notes = e.target.value || undefined;
                                  setLocalVaccinations(updated);
                                }}
                                placeholder="Ek notlar"
                              />
                            </div>
                          </div>

                          {vaccination.id ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!vaccination.id || !selectedStudent?.id) return;
                                await updateVaccination(vaccination.id, vaccination);
                                toast({
                                  title: 'Başarılı',
                                  description: 'Aşı kaydı güncellendi',
                                });
                              }}
                            >
                              Güncelle
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={async () => {
                                if (!selectedStudent?.id) return;
                                await addVaccination({
                                  student_id: selectedStudent.id,
                                  vaccine_name: vaccination.vaccine_name,
                                  vaccine_date: vaccination.vaccine_date,
                                  next_dose_date: vaccination.next_dose_date,
                                  notes: vaccination.notes,
                                });
                                toast({
                                  title: 'Başarılı',
                                  description: 'Aşı kaydı eklendi',
                                });
                              }}
                            >
                              Kaydet
                            </Button>
                          )}
                        </div>
                      ))}

                      {localVaccinations.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Henüz aşı kaydı eklenmemiş. "Aşı Ekle" butonuna tıklayarak ekleyebilirsiniz.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-lg font-semibold">Dosyalar</h3>
                    {selectedStudent?.id && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div>
                          <Label className="text-xs text-muted-foreground">Dosya Türü</Label>
                          <Select
                            className="sm:w-48"
                            value={fileUploadType}
                            onValueChange={(value) => setFileUploadType(value as StudentFile['file_type'])}
                          >
                            <option value="health_report">Sağlık Raporu</option>
                            <option value="identity">Kimlik Belgesi</option>
                            <option value="contract">Sözleşme</option>
                            <option value="other">Diğer</option>
                          </Select>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && selectedStudent?.id) {
                              try {
                                await addFile(selectedStudent.id, file, fileUploadType);
                                toast({
                                  title: 'Başarılı',
                                  description: 'Dosya yüklendi',
                                });
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              } catch (e: any) {
                                toast({
                                  variant: 'destructive',
                                  title: 'Hata',
                                  description: e.message ?? 'Dosya yüklenemedi',
                                });
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="sm:ml-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dosya Yükle
                        </Button>
                      </div>
                    )}
                  </div>

                  {!selectedStudent?.id ? (
                    <p className="text-sm text-muted-foreground">
                      Önce öğrenciyi kaydedin
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {localFiles.map((file) => (
                        <div key={file.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{file.file_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {file.file_type === 'health_report' ? 'Sağlık Raporu' :
                                  file.file_type === 'identity' ? 'Kimlik Belgesi' :
                                    file.file_type === 'contract' ? 'Sözleşme' : 'Diğer'}
                                {file.file_size && ` • ${(file.file_size / 1024).toFixed(2)} KB`}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openFile(file.file_url)}
                            >
                              Aç
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (!file.id) return;
                                await deleteFile(file.id);
                                toast({
                                  title: 'Başarılı',
                                  description: 'Dosya silindi',
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {localFiles.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Henüz dosya eklenmemiş. "Dosya Yükle" butonuna tıklayarak ekleyebilirsiniz.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  {selectedStudent ? 'Güncelle' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
