import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppProvider } from "@/contexts/AppContext";
import { SaldoProvider } from "@/contexts/SaldoContext";
import { SupabaseInitializer } from "@/components/common/SupabaseInitializer";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CadastroPage from "./pages/CadastroPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterWithPlanPage from "./pages/RegisterWithPlanPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import SaldoDashboard from "./pages/SaldoDashboard";
import ExpensesPage from "./pages/ExpensesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import PlansPage from "./pages/PlansPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminDashboard from "./pages/AdminDashboard";
import AchievementsPage from "./pages/AchievementsPage";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/admin/AdminRoute";
import ConnectedBanksPage from "./pages/ConnectedBanksPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

// ✅ CORREÇÃO: O caminho de importação correto para MainLayout
import MainLayout from "./components/layout/MainLayout"; 

// ✅ ADIÇÃO: Novos imports para as páginas reestruturadas
import LancamentosPage from "./pages/LancamentosPage";
import FluxoCaixaPage from "./pages/FluxoCaixaPage";
import DemonstrativoPage from '@/pages/DemonstrativoPage';

import "./App.css";

import React, { Suspense, lazy } from 'react';

const LazyAgenteIA = lazy(() => import('./pages/AgenteIA'));
const LazyCobranca = lazy(() => import('./pages/Cobranca'));
const LazyPagamentos = lazy(() => import('./pages/Pagamentos'));
const LazyConsultas = lazy(() => import('./pages/Consultas'));

import PagamentosEmLote from './pages/PagamentosEmLote';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrandingProvider>
            <PreferencesProvider>
              <SubscriptionProvider>
                <AppProvider>
                  <SaldoProvider>
                    <SupabaseInitializer>
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/dashboard" element={<Index />} />
                          <Route path="/landing" element={<LandingPage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />
                          <Route path="/register/:planType" element={<RegisterWithPlanPage />} />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/reset-password" element={<ResetPasswordPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          
                          <Route path="/cadastros" element={<MainLayout><CadastroPage /></MainLayout>} />
                          
                          {/* ✅ CORREÇÃO: Novas rotas envolvidas com MainLayout */}
                          <Route path="/lancamentos" element={<MainLayout><LancamentosPage /></MainLayout>} />
                          <Route path="/fluxo-caixa" element={<MainLayout><FluxoCaixaPage /></MainLayout>} />
                          <Route path="/demonstrativo" element={<MainLayout><DemonstrativoPage /></MainLayout>} />
                          <Route path="/saldo" element={<SaldoDashboard />} />
                          <Route path="/expenses" element={<ExpensesPage />} />
                          <Route path="/reports" element={<ReportsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          
                          <Route path="/cobranca" element={
                            <Suspense fallback={<div>Carregando Cobrança...</div>}>
                              <LazyCobranca />
                            </Suspense>
                          } />
                          <Route path="/pagamentos" element={
                            <Suspense fallback={<div>Carregando Pagamentos...</div>}>
                              <LazyPagamentos />
                            </Suspense>
                          } />
                          <Route path="/pagamentos-em-lote" element={<PagamentosEmLote />} />
                          
                          <Route path="/consultas" element={
                            <Suspense fallback={<div>Carregando Consultas...</div>}>
                              <LazyConsultas />
                            </Suspense>
                          } />

                          <Route path="/agente-ia" element={
                            <Suspense fallback={<div>Carregando Agente IA...</div>}>
                              <LazyAgenteIA />
                            </Suspense>
                          } />
                          
                          <Route path="/connected-banks" element={<ConnectedBanksPage />} />
                          <Route path="/plans" element={<PlansPage />} />
                          <Route path="/checkout/:planType" element={<CheckoutPage />} />
                          <Route path="/payment-success" element={<PaymentSuccessPage />} />
                          <Route path="/thank-you" element={<ThankYouPage />} />
                          <Route path="/achievements" element={<AchievementsPage />} />
                          <Route path="/admin" element={
                            <AdminRoute>
                              <AdminDashboard />
                            </AdminRoute>
                          } />

                          <Route path="/terms" element={<Terms />} />
                          <Route path="/privacy" element={<Privacy />} />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                      <Toaster />
                      <Sonner />
                    </SupabaseInitializer>
                  </SaldoProvider>
                </AppProvider>
              </SubscriptionProvider>
            </PreferencesProvider>
          </BrandingProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
