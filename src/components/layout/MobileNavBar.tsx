import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LayoutDashboard, Receipt, Settings, Crown, Plus, Target, Calendar, Shield, User, FileText, Wallet, Bot } from 'lucide-react';
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

  // 1. Ações rápidas restantes no botão "+"
  const quickActionItems = [
    {
      icon: Target,
      label: t('nav.goals') || 'Metas',
      action: () => {
        navigate('/goals');
        setIsQuickActionsOpen(false);
      },
      // Estilos atualizados para ter fundo branco e letras verdes
      color: 'text-green-800 dark:text-green-200', 
      bgColor: 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700'
    },
    {
      icon: Calendar,
      label: 'Agendamentos',
      action: () => {
        navigate('/schedule');
        setIsQuickActionsOpen(false);
      },
      // Estilos atualizados
      color: 'text-green-800 dark:text-green-200',
      bgColor: 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700'
    },
    {
      icon: FileText,
      label: 'Relatórios',
      action: () => {
        navigate('/reports');
        setIsQuickActionsOpen(false);
      },
      // Estilos atualizados
      color: 'text-green-800 dark:text-green-200',
      bgColor: 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700'
    },
    {
      icon: Wallet,
      label: 'API Bancos',
      action: () => {
        navigate('/connected-banks'); // Adicionado o href para a nova página
        setIsQuickActionsOpen(false);
      },
      // Estilos atualizados
      color: 'text-green-800 dark:text-green-200',
      bgColor: 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700'
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

  // 2. Menu padrão atualizado para usuários normais
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
    { // 👈 "Saldo" no lugar de "Planos"
      icon: Wallet,
      label: 'Saldo',
      href: '/saldo'
    },
    { // 👈 "Agente IA" no lugar de "Configurações"
      icon: Bot,
      label: 'Agente IA',
      href: '/agente-ia'
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
    
    // Adicionar o item admin antes do último item (Agente IA)
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
            }) => cn("flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors", "hover:bg-accent hover:text-accent-foreground min-w-0", isActive ? "text-primary bg-primary/10 text-primary" : "text-muted-foreground")}>
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

