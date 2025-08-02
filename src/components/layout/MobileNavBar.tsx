import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LayoutDashboard, Receipt, Settings, Crown, Plus, Target, Calendar, Shield, User, FileText, Wallet, Bot } from 'lucide-react'; // 👈 Adicionei o 'Bot' aqui
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavBarProps {
  onAddTransaction?: (type: 'income' | 'expense') => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({
  onAddTransaction
}) => {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === '/admin';

  const quickActionItems = [
    {
      icon: Wallet,
      label: 'Saldo',
      action: () => {
        navigate('/saldo');
        setIsQuickActionsOpen(false);
      },
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      icon: Receipt,
      label: 'Transações',
      action: () => {
        navigate('/transactions');
        setIsQuickActionsOpen(false);
      },
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: Target,
      label: t('nav.goals') || 'Metas',
      action: () => {
        navigate('/goals');
        setIsQuickActionsOpen(false);
      },
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: Calendar,
      label: 'Agendamentos',
      action: () => {
        navigate('/schedule');
        setIsQuickActionsOpen(false);
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      icon: FileText,
      label: 'Relatórios',
      action: () => {
        navigate('/reports');
        setIsQuickActionsOpen(false);
      },
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    { // 👈 Aqui está a nova seção do Agente IA
      icon: Bot,
      label: 'Agente IA',
      action: () => {
        navigate('/agente-ia');
        setIsQuickActionsOpen(false);
      },
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 hover:bg-violet-100'
    },
    {
      icon: Crown,
      label: 'Planos',
      action: () => {
        navigate('/plans');
        setIsQuickActionsOpen(false);
      },
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100'
    }
  ];

  // Se for admin na página de admin, mostrar apenas menu administrativo
  if (isAdmin && isAdminPage) {
    const adminMenuItems = [
      {
        icon: Shield,
        label: 'Admin',
        href: '/admin'
      },
      {
        icon: User,
        label: t('nav.profile'),
        href: '/profile'
      }
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <nav className="flex items-center justify-around py-2">
          {adminMenuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground min-w-0",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  // Menu padrão para usuários normais
  const defaultMenuItems = [
    {
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      href: '/dashboard'
    },
    {
      icon: Receipt,
      label: t('nav.transactions'),
      href: '/transactions'
    },
    {
      type: 'quick-actions',
      icon: Plus,
      label: '',
      href: '#'
    },
    {
      icon: Crown,
      label: t('nav.plans'),
      href: '/plans'
    },
    {
      icon: Settings,
      label: t('nav.settings'),
      href: '/settings'
    }
  ];
  
  // Determinar quais itens de menu mostrar
  let menuItems = defaultMenuItems;
  
  // Se for admin mas não estiver na página de admin, adicionar o item admin ao menu
  if (isAdmin && !isAdminPage) {
    const adminMenuItem = {
      icon: Shield,
      label: 'Admin',
      href: '/admin'
    };
    
    // Adicionar o item admin antes do último item (settings)
    menuItems = [...defaultMenuItems.slice(0, -1), adminMenuItem, defaultMenuItems[defaultMenuItems.length - 1]];
  }

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 10
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <nav className="flex items-center justify-around py-2">
        {menuItems.map((item, index) => {
          if (item.type === 'quick-actions') {
            return (
              <Popover key="quick-actions" open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
                <PopoverTrigger asChild>
                  <button className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors", "hover:bg-accent hover:text-accent-foreground min-w-0", isQuickActionsOpen ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                    <div className="rounded-full bg-primary text-primary-foreground p-1">
                      <Plus className="h-8 w-8 py-0" />
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 mb-2" align="center" side="top">
                  <AnimatePresence>
                    {isQuickActionsOpen && (
                      <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-1">
                        {quickActionItems.map(quickItem => (
                          <motion.div key={quickItem.label} variants={itemVariants}>
                            <Button variant="ghost" onClick={quickItem.action} className={`w-full justify-start gap-3 ${quickItem.bgColor} ${quickItem.color}`}>
                              <quickItem.icon className="h-4 w-4" />
                              <span>{quickItem.label}</span>
                            </Button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </PopoverContent>
              </Popover>
            );
          }
          return (
            <NavLink key={item.href} to={item.href} className={({
              isActive
            }) => cn("flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors", "hover:bg-accent hover:text-accent-foreground min-w-0", isActive ? "text-primary bg-primary/10" : "text-muted-foreground")}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavBar;
