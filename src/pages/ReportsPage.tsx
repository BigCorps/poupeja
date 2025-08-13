import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';
import { ReportFormat } from '@/types';
import { generateReportData, downloadCSV, downloadPDF } from '@/utils/reportUtils';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportSummary from '@/components/reports/ReportSummary';
import TransactionsTable from '@/components/reports/TransactionsTable';

const ReportsPage = () => {
  const { t } = usePreferences();
  const { lancamentos } = useAppContext();
  const [reportType, setReportType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleDownload = (format: ReportFormat) => {
    // Generate the report data based on lançamentos
    const reportData = generateReportData(lancamentos, reportType, startDate, endDate);
    
    if (format === 'csv') {
      downloadCSV(reportData);
    } else if (format === 'pdf') {
      downloadPDF(reportData);
    }
  };
  
  // Generate filtered lançamentos for display
  const filteredLancamentos = generateReportData(lancamentos, reportType, startDate, endDate);
  
  // Calculate summary statistics based on lançamentos
  const calculateTotalIncome = (data: any[]) => {
    return data
      .filter(item => item.classificacao === 'receita')
      .reduce((sum, item) => sum + (item.valor_pago || 0), 0);
  };

  const calculateTotalExpenses = (data: any[]) => {
    return data
      .filter(item => item.classificacao === 'despesa')
      .reduce((sum, item) => sum + (item.valor_pago || 0), 0);
  };

  const totalIncome = calculateTotalIncome(filteredLancamentos);
  const totalExpenses = calculateTotalExpenses(filteredLancamentos);
  const balance = totalIncome - totalExpenses;

  return (
    <MainLayout>
      <SubscriptionGuard feature="relatórios detalhados">
        <div className="w-full max-w-full px-4 py-6 lg:py-8 overflow-hidden">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">{t('reports.title')}</h1>
          
          <ReportFilters 
            reportType={reportType}
            setReportType={setReportType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onDownload={handleDownload}
          />
          
          <ReportSummary 
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
          />
          
          <TransactionsTable transactions={filteredLancamentos} />
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default ReportsPage;
