import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LayoutDashboard, Receipt, Settings, Crown, Plus, Target, Calendar, Shield, User, FileText, Wallet, Landmark, PiggyBank, Briefcase } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/contexts/AppContext';

interface MobileNavBarProps {
  onAddTransaction?: (type: 'income' | 'expense') => void;
  onAddGoal?: () => void;
  onAddScheduledTransaction?: () => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({
  onAddTransaction,
  onAddGoal,
  onAddScheduledTransaction
}) => {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const { toast } = useToast();
  const { getTransactions } = useAppContext();

  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === '/admin';

  // Animação para o popover
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
    exit: { opacity: 0, scale: 0.9, transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  };

  // 1. Ações rápidas restantes no botão "+"
  const quickActionItems = [
    {
      icon: Receipt,
      label: 'Transação',
      action: () => {
        if (onAddTransaction) onAddTransaction('expense');
        setIsQuickActionsOpen(false);
      },
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      icon: Target,
      label: t('nav.goals') || 'Metas',
      action: () => {
        if (onAddGoal) onAddGoal();
        setIsQuickActionsOpen(false);
      },
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: Calendar,
      label: 'Agendamentos',
      action: () => {
        if (onAddScheduledTransaction) onAddScheduledTransaction();
        setIsQuickActionsOpen(false);
      },
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      icon: Landmark,
      label: 'Conectar Banco',
      action: () => {
        navigate('/bancos-conectados');
        setIsQuickActionsOpen(false);
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    }
  ];

  // 2. Itens de navegação da barra de navegação
  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard') || 'Dashboard', href: '/dashboard' },
    { icon: Wallet, label: t('nav.transactions') || 'Transações', href: '/transactions' },
    { icon: Plus, label: t('nav.add') || 'Adicionar', href: '#quick-actions' }, // Botão de ação rápida
    { icon: BarChart3, label: t('nav.reports') || 'Relatórios', href: '/reports' },
    { icon: Settings, label: t('nav.settings') || 'Configurações', href: '/settings' },
  ];

  // Se for admin na página de admin, mostrar menu administrativo
  if (isAdmin && isAdminPage) {
    const adminNavItems = [
      { icon: Crown, label: 'Admin', href: '/admin' },
      { icon: Settings, label: 'Config', href: '/admin/config' },
    ];
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-2">
        <nav className="flex justify-around items-center">
          {adminNavItems.map(item => (
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-2 md:hidden">
      <nav className="flex justify-around items-center">
        {navItems.map(item => {
          if (item.href === '#quick-actions') {
            return (
              <Popover open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen} key={item.label}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-full h-14 w-14 shadow-lg transition-transform duration-300",
                      isQuickActionsOpen ? "bg-primary text-primary-foreground rotate-45" : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="sr-only">Adicionar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 mb-20 bg-card border shadow-xl rounded-xl">
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
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavBar;
