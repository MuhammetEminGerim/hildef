import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../theme-provider';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Moon, Sun, Monitor, LogOut } from 'lucide-react';

const avatarUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDok8IuHkFsy7MwT6Y-_mAYqL0g_7patPBFgAhmIeExl602yZKs23d0KA0fyZZG0tdbXrmEFETOAAvom6Bl9zyqvWzVZcNUUsmFb0ZIpaEukprp6hj90tEiAx-LVLdQx7bfBrtFDJlhRr5sMmdfR_-vtfCvowDp6AD_xvC5fl-r6YTa7YZ7ZqD1V70OidAR-sK5DPZIZvawnYWdl1qSho2qln5U1F-i49b6hIdHb2zPQJPCROCFKHpUq9A36BI1ik1J6BpnEh7F2oA';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Genel Bakış',
  '/students': 'Öğrenciler',
  '/finance': 'Finans',
  '/reports': 'Raporlar',
  '/settings': 'Ayarlar',
};

export function TopBar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const title = useMemo(() => {
    return pageTitles[location.pathname] ?? 'Panel';
  }, [location.pathname]);

  return (
    <header className="flex items-center justify-between border-b border-[#dbe6de] bg-white/80 px-4 md:px-10 py-3 sticky top-0 z-30 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <label className="hidden md:flex min-w-[200px] max-w-xs flex-col">
          <div className="flex w-full items-center rounded-full bg-[#eff4ef] px-2">
            <span className="material-symbols-outlined px-2 text-[#3e5c45]">search</span>
            <input
              placeholder="Ara..."
              className="flex-1 bg-transparent py-2 pr-3 text-sm text-[#111813] placeholder:text-[#95ad9c] focus:outline-none"
            />
          </div>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg h-10 w-10 border border-transparent hover:border-[#dbe6de]"
          onClick={() =>
            setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')
          }
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="sr-only">Tema değiştir</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg h-10 w-10 border border-transparent hover:border-[#dbe6de]"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="sr-only">Bildirimler</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-10 w-10 rounded-full border border-transparent hover:border-[#dbe6de] focus-visible:outline-none overflow-hidden">
              <span className="sr-only">Kullanıcı menüsü</span>
              <div
                className="h-full w-full rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user ? (
                <div>
                  <p className="text-sm font-semibold">{user.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              ) : (
                'Kullanıcı Bilgisi'
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Açık Tema</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Koyu Tema</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Sistem Teması</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout();
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
