import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { toast } = useToast();

    const [form, setForm] = useState({
        username: localStorage.getItem('rememberedUsername') || '',
        password: '',
        rememberMe: !!localStorage.getItem('rememberedUsername'),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(''); // Clear previous error
        try {
            setLoading(true);
            await login(form.username, form.password);

            // Save username if "Remember Me" is checked
            if (form.rememberMe) {
                localStorage.setItem('rememberedUsername', form.username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }

            navigate('/dashboard');
        } catch (e: any) {
            setError('Kullanıcı adı veya şifre hatalı');

            // Clear password field
            setForm(prev => ({ ...prev, password: '' }));

            toast({
                variant: 'destructive',
                title: 'Giriş Başarısız',
                description: 'Lütfen kullanıcı adınızı ve şifrenizi kontrol edin.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f5e9] via-[#f1f8f4] to-[#e8f5e9]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/95 backdrop-blur rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-12">
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <div className="mb-4 flex justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#50C878] to-[#3fa85f] rounded-3xl flex items-center justify-center shadow-lg">
                                <LogIn className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-[#111813] mb-2">Hoş Geldiniz</h1>
                        <p className="text-[#61896b]">Kreş Yönetim Sistemi</p>
                    </div>


                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-5 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-900">{error}</p>
                                <p className="text-xs text-red-700 mt-1">Lütfen bilgilerinizi kontrol edip tekrar deneyin.</p>
                            </div>
                        </motion.div>
                    )}


                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-[#141c16] font-medium">
                                E-posta Adresi
                            </Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#61896b]" />
                                <Input
                                    id="username"
                                    type="email"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    placeholder="ornek@kres.com"
                                    required
                                    disabled={loading}
                                    className="pl-12 h-12 border-[#dfe8df] focus:border-[#50C878] rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[#141c16] font-medium">
                                Şifre
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#61896b]" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => {
                                        setForm({ ...form, password: e.target.value });
                                        setError(''); // Clear error when typing
                                    }}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    className="pl-12 h-12 border-[#dfe8df] focus:border-[#50C878] rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={form.rememberMe}
                                onCheckedChange={(checked) => setForm({ ...form, rememberMe: !!checked })}
                                disabled={loading}
                            />
                            <Label htmlFor="remember" className="text-sm text-[#61896b] cursor-pointer">
                                Beni Hatırla
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-[#50C878] to-[#3fa85f] hover:from-[#3fa85f] hover:to-[#2f8040] text-white font-semibold rounded-xl shadow-lg transition-all"
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-[#8aa190]">
                        Varsayılan kullanıcı: <span className="font-medium text-[#61896b]">admin</span> / <span className="font-medium text-[#61896b]">admin</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
