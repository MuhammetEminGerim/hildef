import { useMemo, useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { FileUpload } from '../components/ui/file-upload';
import { useTeachers } from '../hooks/use-teachers';

// Memoized Table Component
const PersonnelTable = memo(({
  staff,
  loading,
  onEdit,
  onDelete,
  formatDate
}: {
  staff: any[],
  loading: boolean,
  onEdit: (staff: any) => void,
  onDelete: (id: string) => void,
  formatDate: (date?: string) => string
}) => {
  if (loading) {
    return <div className="text-center py-12 text-[#3e5c45]">Yükleniyor...</div>;
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-12 text-[#3e5c45]">
        Personel bulunamadı.
      </div>
    );
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs uppercase text-[#7d9785] bg-[#f1f5f1]">
        <tr>
          <th className="px-6 py-4 font-medium">Personel</th>
          <th className="px-6 py-4 font-medium">Görev</th>
          <th className="px-6 py-4 font-medium">İletişim</th>
          <th className="px-6 py-4 font-medium">İşe Başlama</th>
          <th className="px-6 py-4 font-medium text-right">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        {staff.map((staffMember) => (
          <tr
            key={staffMember.id}
            className="border-b border-[#ecf2ec] last:border-0 hover:bg-[#f8fdf8]"
          >
            <td className="px-6 py-5 whitespace-nowrap">
              <div className="flex items-center gap-3">
                {staffMember.photo_url ? (
                  <img
                    src={staffMember.photo_url}
                    alt={staffMember.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <span className="font-semibold">{staffMember.name}</span>
              </div>
            </td>
            <td className="px-6 py-5 text-[#3e5c45]">{staffMember.role}</td>
            <td className="px-6 py-5">
              <div className="text-sm">
                <div>{staffMember.phone || '-'}</div>
                <div className="text-[#3e5c45]">{staffMember.email || '-'}</div>
              </div>
            </td>
            <td className="px-6 py-5 text-[#3e5c45]">
              {formatDate(staffMember.start_date)}
            </td>
            <td className="px-6 py-5 text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 rounded-lg border border-[#e0ede3] hover:bg-[#e8f7ec]"
                  onClick={() => onEdit(staffMember)}
                >
                  <Edit className="h-4 w-4 text-[#111813]" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 rounded-lg border border-[#ffe6e6] hover:bg-[#ffecec]"
                  onClick={() => onDelete(staffMember.id)}
                >
                  <Trash2 className="h-4 w-4 text-[#c62828]" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

PersonnelTable.displayName = 'PersonnelTable';

export default function PersonnelPage() {
  const { teachers: staff, loading, addTeacher, updateTeacher, deleteTeacher } = useTeachers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const { toast } = useToast();

  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    start_date: '',
    salary: '',
    notes: '',
  });

  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pendingPhoto) {
      const url = URL.createObjectURL(pendingPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [pendingPhoto]);

  const filteredStaff = useMemo(() => {
    let filtered = staff;

    const term = search.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.role && s.role.toLowerCase().includes(term))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((s) => s.role === roleFilter);
    }

    return filtered;
  }, [staff, search, roleFilter]);

  const roles = useMemo(() => {
    const uniqueRoles = new Set(staff.map((s) => s.role).filter(Boolean));
    return Array.from(uniqueRoles);
  }, [staff]);

  const resetForm = useCallback(() => {
    setStaffForm({
      name: '',
      role: '',
      phone: '',
      email: '',
      start_date: '',
      salary: '',
      notes: '',
    });
    setPendingPhoto(null);
  }, []);

  async function handleCreateStaff() {
    if (!staffForm.name || !staffForm.role) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Ad ve görev zorunludur',
      });
      return;
    }

    if (staffForm.salary && staffForm.salary.trim() !== '') {
      const salary = Number(staffForm.salary);
      if (isNaN(salary) || salary < 0) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Maaş geçerli bir sayı olmalıdır',
        });
        return;
      }
    }

    try {
      await addTeacher(
        {
          name: staffForm.name,
          role: staffForm.role,
          phone: staffForm.phone || '',
          email: staffForm.email,
          start_date: staffForm.start_date || new Date().toISOString().slice(0, 10),
          salary: staffForm.salary ? Number(staffForm.salary) : undefined,
          notes: staffForm.notes,
        },
        pendingPhoto || undefined
      );

      toast({
        title: 'Başarılı',
        description: 'Personel eklendi',
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Personel eklenemedi',
      });
    }
  }

  async function handleEditStaff() {
    if (!selectedStaff || !staffForm.name || !staffForm.role) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Ad ve görev zorunludur',
      });
      return;
    }

    if (staffForm.salary && staffForm.salary.trim() !== '') {
      const salary = Number(staffForm.salary);
      if (isNaN(salary) || salary < 0) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Maaş geçerli bir sayı olmalıdır',
        });
        return;
      }
    }

    try {
      await updateTeacher(
        selectedStaff.id,
        {
          name: staffForm.name,
          role: staffForm.role,
          phone: staffForm.phone,
          email: staffForm.email,
          start_date: staffForm.start_date,
          salary: staffForm.salary ? Number(staffForm.salary) : undefined,
          notes: staffForm.notes,
        },
        pendingPhoto || undefined
      );

      toast({
        title: 'Başarılı',
        description: 'Personel güncellendi',
      });

      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      resetForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Personel güncellenemedi',
      });
    }
  }

  const handleDeleteStaff = useCallback(async (id: string) => {
    if (!window.confirm('Bu personeli silmek istediğinize emin misiniz?')) return;

    try {
      await deleteTeacher(id);
      toast({
        title: 'Başarılı',
        description: 'Personel silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Personel silinemedi',
      });
    }
  }, [deleteTeacher, toast]);

  const openEditDialog = useCallback((staffMember: any) => {
    setSelectedStaff(staffMember);
    setStaffForm({
      name: staffMember.name,
      role: staffMember.role,
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      start_date: staffMember.start_date || '',
      salary: staffMember.salary?.toString() || '',
      notes: staffMember.notes || '',
    });
    setIsEditDialogOpen(true);
  }, []);

  const formatDate = useCallback((dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  }, []);

  return (
    <>
      <div className="flex flex-col gap-8 text-[#111813]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Personel</h2>
            <p className="text-sm text-[#3e5c45]">Personel bilgilerini yönetin.</p>
          </div>
          <Button
            className="h-11 rounded-xl bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915] font-semibold gap-2 px-5"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Yeni Personel Ekle
          </Button>
        </motion.div>

        <div className="rounded-[24px] border border-[#b0c4b1] bg-white px-4 py-5 md:flex md:items-center md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8aa692]" />
              <Input
                placeholder="Personel ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-2xl border border-[#e0ede3] bg-[#f6f8f6] pl-10 text-sm text-[#111813] placeholder:text-[#8aa692]"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2 md:mt-0">
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value)}
              className="h-12 min-w-[140px] rounded-2xl border border-[#e0ede3] bg-[#f6f8f6] text-sm font-medium text-[#111813]"
            >
              <option value="all">Tüm Görevler</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#b0c4b1] bg-white">
          <PersonnelTable
            staff={filteredStaff}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDeleteStaff}
            formatDate={formatDate}
          />
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Yeni Personel Ekle</DialogTitle>
            <DialogDescription>Yeni personel bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ad Soyad *</Label>
                <Input
                  id="name"
                  autoFocus
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Örn: Ayşe Yılmaz"
                />
              </div>
              <div>
                <Label htmlFor="role">Görev *</Label>
                <Input
                  id="role"
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  placeholder="Örn: Öğretmen"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="start_date">İşe Başlama Tarihi</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={staffForm.start_date}
                  onChange={(e) => setStaffForm({ ...staffForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="salary">Maaş (TL)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={staffForm.salary}
                  onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={staffForm.notes}
                  onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  rows={3}
                />
              </div>
            </div>
            <div>
              <FileUpload
                label="Fotoğraf"
                onFileSelect={(file) => {
                  if (file instanceof File) {
                    setPendingPhoto(file);
                  }
                }}
                currentFile={
                  previewUrl || selectedStaff?.photo_url || null
                }
                onRemove={() => setPendingPhoto(null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateStaff}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Personel Düzenle</DialogTitle>
            <DialogDescription>Personel bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Ad Soyad *</Label>
                <Input
                  id="edit-name"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Görev *</Label>
                <Input
                  id="edit-role"
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-posta</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-start_date">İşe Başlama Tarihi</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={staffForm.start_date}
                  onChange={(e) => setStaffForm({ ...staffForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-salary">Maaş (TL)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={staffForm.salary}
                  onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-notes">Notlar</Label>
                <Textarea
                  id="edit-notes"
                  value={staffForm.notes}
                  onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div>
              <FileUpload
                label="Fotoğraf"
                onFileSelect={(file) => {
                  if (file instanceof File) {
                    setPendingPhoto(file);
                  }
                }}
                currentFile={
                  previewUrl || selectedStaff?.photo_url || null
                }
                onRemove={() => setPendingPhoto(null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEditStaff}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
