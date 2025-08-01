import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'; // Adicionado Outlet
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Target, 
  User, 
  Settings, 
  FolderOpen, 
  Calendar, 
  Crown, 
  LogOut, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Palette
} from 'lucide-react';

interface MainLayoutProps {
  // Removido 'children' pois agora usaremos <Outlet />
  title?: string;
  onAddTransaction?: (type: 'income' | 'expense') => void;
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}

const Sidebar: React.FC<MainLayoutProps> = ({ 
  // Removido 'children' da desestruturação
  title,
  onAddTransaction,
  onProfileClick,
  onConfigClick
}) => {
  const { user, logout } = useAppContext();
  const { t } = usePreferences();
  const { isAdmin } = useUserRole();
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSettingsMenuExpanded, setIsSettingsMenuExpanded] = useState(false);
  
  const toggleSettingsMenu = () => {
    setIsSettingsMenuExpanded(!isSettingsMenuExpanded);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (isAdmin && location.pathname === '/admin' && onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  if (isAdmin && location.pathname === '/admin') {
    const adminMenuItems = [
      {
        icon: Settings,
        label: 'Configurações',
        action: () => {
          if (onConfigClick) {
            onConfigClick();
          }
        }
      }
    ];

    return (
      <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {adminMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={item.action}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleProfileClick}
          >
            <User className="h-5 w-5" />
            Perfil
          </Button>
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle variant="ghost" size="sm" />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  const defaultMenuItems = [
    {
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      href: '/dashboard'
    },
    {
      icon: Receipt,
      label: t('nav.transactions'),
      href: '/dashboard/transactions'
    },
    {
      icon: FolderOpen,
      label: t('nav.categories'),
      href: '/dashboard/categories'
    },
    {
      icon: Target,
      label: t('nav.goals'),
      href: '/dashboard/goals'
    },
    {
      icon: Calendar,
      label: t('schedule.title'),
      href: '/dashboard/schedule'
    },
    {
      icon: BarChart3,
      label: t('nav.reports'),
      href: '/dashboard/reports'
    },
    {
      icon: Crown,
      label: t('nav.plans'),
      href: '/dashboard/plans'
    },
  ];

  let menuItems = [...defaultMenuItems];
  if (isAdmin && location.pathname !== '/admin') {
    const adminMenuItem = {
      icon: Shield,
      label: 'Admin',
      href: '/admin'
    };
    menuItems.push(adminMenuItem);
  }

  if (!user) return null;

  return (
    <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r overflow-hidden">
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center space-x-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={logoAltText}
              className="h-8 w-8 object-contain"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const nextSibling = target.nextElementSibling as HTMLElement;
                if (nextSibling) {
                  nextSibling.style.display = 'block';
                }
              }}
            />
          )}
          {!logoUrl && (
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {companyName.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-xl font-bold text-primary">{companyName}</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2 flex-shrink-0 bg-background">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isSettingsMenuExpanded && "bg-accent text-accent-foreground"
            )}
            onClick={toggleSettingsMenu}
          >
            <Settings className="h-5 w-5" />
            Configurações
            {isSettingsMenuExpanded ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </Button>

          {isSettingsMenuExpanded && (
            <div className="pl-6 space-y-2">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )
                }
              >
                <User className="h-5 w-5" />
                {t('nav.profile')}
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )
                }
              >
                <Settings className="h-5 w-5" />
                Preferências
              </NavLink>

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <Palette className="h-5 w-5" />
                  Tema
                </span>
                <ThemeToggle variant="ghost" size="sm" />
              </div>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                {t('settings.logout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
