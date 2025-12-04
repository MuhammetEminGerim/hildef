import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Lock, LogOut, Users, Plus, Edit, Trash2, Mail, Download, Database } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select } from '../components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUsers } from '../hooks/use-users';
import type { User as UserType } from '../lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { users, loading: usersLoading, addUser, updateUser, deleteUser, resetPassword } = useUsers();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // User management state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  });

  async function handleBackup() {
    try {
      toast({
        title: 'Yedekleme Başlatıldı',
        description: 'Veriler hazırlanıyor, lütfen bekleyin...',
      });

      const collections = ['students', 'teachers', 'payments', 'expenses', 'users'];
      const backupData: Record<string, any[]> = {};

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        backupData[colName] = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.is_active !== false); // Filter out soft-deleted items
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kres_yedek_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Başarılı',
        description: 'Yedek dosyası indirildi.',
      });
    } catch (e: any) {
      console.error('Backup error:', e);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Yedekleme sırasında bir hata oluştu.',
      });
    }
  }

  async function handleChangePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Tüm alanları doldurun',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Yeni şifreler eşleşmiyor',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Şifre en az 6 karakter olmalıdır',
      });
      return;
    }

    try {
      // Firebase Auth ile şifre değiştirme burada yapılacak
      // Şimdilik placeholder
      toast({
        title: 'Bilgi',
        description: 'Şifre değiştirme özelliği Firebase Auth ile entegre edilecek',
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Şifre değiştirilemedi',
      });
    }
  }

  async function handleLogout() {
    if (!window.confirm('Çıkış yapmak istediğinize emin misiniz?')) return;

    try {
      await logout();
      navigate('/login');
      toast({
        title: 'Başarılı',
        description: 'Çıkış yapıldı',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Çıkış yapılamadı',
      });
    }
  }

  function openUserDialog(user?: UserType) {
    if (user) {
      setSelectedUser(user);
      setUserForm({
        email: user.email,
        username: user.username,
        password: '',
        role: user.role,
      });
    } else {
      setSelectedUser(null);
      setUserForm({
        email: '',
        username: '',
        password: '',
        role: 'staff',
      });
    }
    setIsUserDialogOpen(true);
  }

  async function handleUserSubmit() {
    if (!userForm.email || !userForm.username) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'E-posta ve kullanıcı adı zorunludur',
      });
      return;
    }

    if (!selectedUser && !userForm.password) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Yeni kullanıcı için şifre gereklidir',
      });
      return;
    }

    try {
      if (selectedUser) {
        // Update user
        await updateUser(selectedUser.id, {
          username: userForm.username,
          role: userForm.role,
        });
        toast({
          title: 'Başarılı',
          description: 'Kullanıcı güncellendi',
        });
      } else {
        // Add new user
        await addUser({
          email: userForm.email,
          username: userForm.username,
          password: userForm.password,
          role: userForm.role,
        });
        toast({
          title: 'Başarılı',
          description: 'Kullanıcı eklendi',
        });
      }
      setIsUserDialogOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'İşlem başarısız',
      });
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
      await deleteUser(userId);
      toast({
        title: 'Başarılı',
        description: 'Kullanıcı silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Kullanıcı silinemedi',
      });
    }
  }

  async function handleResetPassword(email: string) {
    if (!window.confirm('Bu kullanıcıya şifre sıfırlama e-postası gönderilsin mi?')) return;

    try {
      await resetPassword(email);
      toast({
        title: 'Başarılı',
        description: 'Şifre sıfırlama e-postası gönderildi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'E-posta gönderilemedi',
      });
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Ayarlar</h2>
          <p className="text-sm text-[#3e5c45]">Sistem ayarlarını yönetin</p>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Veri
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Kullanıcılar
            </TabsTrigger>
          )}
          <TabsTrigger value="about">
            <Settings className="h-4 w-4 mr-2" />
            Hakkında
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Hesap bilgilerinizi görüntüleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Kullanıcı Adı</Label>
                <Input value={user?.username || ''} disabled />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div>
                <Label>Rol</Label>
                <Input value={user?.role === 'admin' ? 'Yönetici' : 'Personel'} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>Hesap şifrenizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mevcut Şifre</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <Label>Yeni Şifre</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <Label>Yeni Şifre (Tekrar)</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword}>Şifreyi Değiştir</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Veri Yönetimi</CardTitle>
              <CardDescription>Verilerinizi yedekleyin veya yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-[#f8faf8]">
                <div>
                  <h4 className="font-medium">Veri Yedekleme</h4>
                  <p className="text-sm text-muted-foreground">
                    Tüm sistem verilerini (Öğrenciler, Personel, Ödemeler vb.) JSON formatında indirin.
                  </p>
                </div>
                <Button onClick={handleBackup} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Verileri Yedekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Kullanıcı Yönetimi</CardTitle>
                    <CardDescription>Sistem kullanıcılarını yönetin</CardDescription>
                  </div>
                  <Button onClick={() => openUserDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kullanıcı
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Yükleniyor...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Kullanıcı bulunamadı</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="text-xs uppercase text-[#7d9785] bg-[#f1f5f1]">
                        <tr>
                          <th className="px-6 py-4 text-left">Kullanıcı Adı</th>
                          <th className="px-6 py-4 text-left">E-posta</th>
                          <th className="px-6 py-4 text-left">Rol</th>
                          <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-[#ecf2ec] hover:bg-[#f6f8f6]">
                            <td className="px-6 py-4">{u.username}</td>
                            <td className="px-6 py-4">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}>
                                {u.role === 'admin' ? 'Yönetici' : 'Personel'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetPassword(u.email)}
                                  title="Şifre Sıfırla"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openUserDialog(u)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {u.id !== user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(u.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Uygulama Adı</Label>
                <Input value="Kreş Yönetim Sistemi" disabled />
              </div>
              <div>
                <Label>Versiyon</Label>
                <Input value="2.0.0 (Firestore)" disabled />
              </div>
              <div>
                <Label>Veritabanı</Label>
                <Input value="Firebase Firestore" disabled />
              </div>
              <div className="pt-4">
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Kullanıcı bilgilerini güncelleyin.' : 'Sisteme yeni bir kullanıcı ekleyin.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>E-posta</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={!!selectedUser}
              />
            </div>
            <div>
              <Label>Kullanıcı Adı</Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
            </div>
            {!selectedUser && (
              <div>
                <Label>Şifre</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Rol</Label>
              <Select
                value={userForm.role}
                onValueChange={(val: any) => setUserForm({ ...userForm, role: val })}
              >
                <option value="staff">Personel</option>
                <option value="admin">Yönetici</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUserSubmit}>
              {selectedUser ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
