import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  BarChart3,
  PartyPopper,
  BadgeCheck,
  Settings as SettingsIcon,
} from 'lucide-react';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { ipcInvoke } from '@/lib/ipc';

import { useAuthStore } from '@/store/authStore';

type Props = {
  children: ReactNode;
};

type SidebarItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  disabled?: boolean;
};

const primaryNav: SidebarItem[] = [
  { to: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
  { to: '/students', label: 'Öğrenciler', icon: Users },
  { to: '/classes', label: 'Sınıflar', icon: GraduationCap },
  { to: '/finance', label: 'Finans', icon: CreditCard },
  { to: '/reports', label: 'Raporlar', icon: BarChart3 },
  { to: '/events', label: 'Etkinlikler', icon: PartyPopper },
  { to: '/personnel', label: 'Personel', icon: BadgeCheck },
];

const secondaryNav: SidebarItem = {
  to: '/settings',
  label: 'Ayarlar',
  icon: SettingsIcon,
};

const logoUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAvY8PIFx9Ntnfs3nO36LeEG98CIL2VQmY2Wt0A3rpPnVjREhuXP_BwOZ6EBsqWvImSBAKUkQj1nWuydPpLaWeybZ-1SkdUo35QJktHXXNr0bs_klVfikBjxUPRGYiF4RDHqLT9PAH8JQidtbjKbanwN98C39MrlmzWa3fSJStAzdlXw5JuSd2rKksZrjlgJPRHVQ3YhNNxWDa_10-YlLqw7sBoz_M6GqW2gXmAizCN3EBfLi8cfM5tzpkZQ0wj3M2lACTXqYwhuDw';

export function MainLayout({ children }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [kindergartenName, setKindergartenName] = useState('Mutlu Çocuklar Kreşi');
  const [kindergartenLogo, setKindergartenLogo] = useState(logoUrl);

  // Load kindergarten info
  useEffect(() => {
    async function loadInfo() {
      try {
        const data = await ipcInvoke<{ name: string; logo: string }>('settings:get-kindergarten-info');
        setKindergartenName(data.name);
        setKindergartenLogo(data.logo);
      } catch (e) {
        console.error('Failed to load kindergarten info:', e);
      }
    }
    void loadInfo();
  }, []);

  // Filter nav items based on role
  const filteredNav = primaryNav.filter((item) => {
    if (user?.role === 'staff') {
      return !['Finans', 'Raporlar', 'Personel'].includes(item.label);
    }
    return true;
  });



  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();

      if (['d', 's', 'f', 'r', 'a'].includes(key)) {
        e.preventDefault();
      }

      switch (key) {
        case 'd':
          navigate('/dashboard');
          break;
        case 's':
          navigate('/students');
          break;
        case 'f':
          if (user?.role === 'admin') navigate('/finance');
          break;
        case 'r':
          if (user?.role === 'admin') navigate('/reports');
          break;
        case 'a':
          if (user?.role === 'admin') navigate('/settings');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, user]);

  return (
    <div className="min-h-screen flex bg-[#f6f8f6] text-[#111813]">
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#dbe6de] bg-[#fdfefc] sticky top-0 h-screen">
        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-3"
          >
            <img
              src={kindergartenLogo}
              alt="Logo"
              className="rounded-full h-10 w-10 object-cover bg-gray-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== logoUrl) {
                  target.src = logoUrl;
                }
              }}
            />
            <div>
              <p className="text-base font-medium leading-none text-[#111813]">{kindergartenName}</p>
              <p className="text-sm text-[#61896b]">Yönetim Paneli</p>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <nav className="flex flex-col gap-0.5">
            {filteredNav.map((item, index) => (
              <SidebarLink key={item.label} item={item} index={index} />
            ))}
          </nav>
        </div>

        <div className="p-4 pt-4 border-t border-[#dbe6de]">
          <SidebarLink item={secondaryNav} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-4 md:p-8 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

type SidebarLinkProps = {
  item: SidebarItem;
  index?: number;
};

function SidebarLink({ item, index = 0 }: SidebarLinkProps) {
  const Icon = item.icon;

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium leading-normal transition-colors border',
        item.disabled
          ? 'text-[#b7c4b8] cursor-not-allowed border-[#e4ede4] bg-white/50'
          : 'text-[#4b5b4e] hover:bg-[#13ec49]/10 hover:text-[#111813] border-[#e4ede4] bg-white'
      )}
    >
      <div
        className={cn(
          'h-9 w-9 rounded-2xl border flex items-center justify-center',
          item.disabled
            ? 'bg-white/50 border-[#e4ede4]'
            : 'bg-white border-[#e4ede4] shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            item.disabled ? 'text-[#cbd6cc]' : 'text-[#111813]'
          )}
        />
      </div>
      <span>{item.label}</span>
    </div>
  );

  if (item.disabled || !item.to) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="px-1">{content}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          cn('px-1', isActive ? 'text-[#111813]' : 'text-[#4b5b4e]')
        }
      >
        {({ isActive }) => (
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium leading-normal transition-colors border',
              isActive
                ? 'bg-[#13ec49]/20 text-[#111813] border-[#13ec49]/30 shadow-sm'
                : 'text-[#4b5b4e] hover:bg-[#13ec49]/10 hover:text-[#111813] border-[#e4ede4] bg-white'
            )}
          >
            <div
              className={cn(
                'h-9 w-9 rounded-2xl border flex items-center justify-center',
                isActive
                  ? 'bg-white shadow-[0_6px_16px_rgba(19,236,73,0.25)] border-[#13ec49]/30'
                  : 'bg-white border-[#e4ede4]'
              )}
            >
              <Icon className="h-4 w-4 text-[#111813]" />
            </div>
            <span>{item.label}</span>
          </div>
        )}
      </NavLink>
    </motion.div>
  );
}
