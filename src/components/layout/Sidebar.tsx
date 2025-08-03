import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LayoutDashboard, Receipt, BarChart3, Target, User, Settings, FolderOpen, Calendar, Crown, LogOut, Shield, Wallet, ChevronDown, ChevronRight, Landmark } from 'lucide-react';

interface SidebarProps {
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onProfileClick, onConfigClick }) => {
  const { user, logout } = useAppContext();
  const { t } = usePreferences();
  const { isAdmin } = useUserRole();
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  
  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === '/admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (isAdmin && isAdminPage && onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard') || 'Dashboard', href: '/dashboard' },
    { icon: Wallet, label: t('nav.transactions') || 'Transações', href: '/transactions' },
    { icon: Calendar, label: t('nav.schedule') || 'Agendamentos', href: '/schedule' },
    { icon: Target, label: t('nav.goals') || 'Metas', href: '/goals' },
    { icon: BarChart3, label: t('nav.reports') || 'Relatórios', href: '/reports' },
    { icon: FolderOpen, label: t('nav.categories') || 'Categorias', href: '/categories' },
    { icon: Landmark, label: 'Bancos Conectados', href: '/bancos-conectados' }, // Novo item de menu
    { icon: Shield, label: t('nav.subscription') || 'Assinatura', href: '/plans' },
  ];
  
  const adminMenuItems = [
    { icon: Crown, label: 'Painel Admin', href: '/admin' },
    { icon: Settings, label: 'Configurações', action: () => { if (onConfigClick) { onConfigClick(); } } }
  ];

  const profileMenuItems = [
    { icon: User, label: t('nav.profile') || 'Meu Perfil', action: handleProfileClick },
    { icon: Settings, label: t('nav.settings') || 'Configurações', href: '/settings' },
  ];

  // Se for admin na página de admin, mostrar apenas menu administrativo
  if (isAdmin && isAdminPage) {
    return (
      <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">{companyName || 'Saldo'}</h1>
        </div>
        
        {/* Menu Administrativo */}
        <div className="flex-1 p-4 space-y-2 overflow-auto">
          {adminMenuItems.map(item => (
            <div key={item.label}>
              {item.href ? (
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
                  onClick={item.action}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r">
      {/* Logo/Header */}
      <div className="p-6 border-b">
        {logoUrl && (
          <img src={logoUrl} alt={logoAltText || 'Logo'} className="h-8 w-auto mb-2" />
        )}
        <h1 className="text-xl font-bold">{companyName || 'Saldo'}</h1>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 p-4 space-y-2 overflow-auto">
        {menuItems.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Seção de Perfil e Configurações */}
      <div className="border-t p-4">
        {user ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {isProfileExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            {isProfileExpanded && (
              <div className="space-y-1 pl-4">
                {profileMenuItems.map(item => (
                  <NavLink
                    key={item.label}
                    to={item.href || '#'}
                    onClick={item.action}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-muted-foreground">Tema</span>
                  <ThemeToggle variant="ghost" size="sm" />
                </div>
                
                {/* Logout Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {t('settings.logout') || 'Sair'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t('settings.logout') || 'Sair'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
