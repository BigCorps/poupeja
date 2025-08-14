// src/pages/DemonstrativoPage.tsx - COMPONENTE COMPLETO DRE
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Calculator, Calendar } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ===================================================
// ✅ INTERFACES E TIPOS
// ===================================================

interface DRELine {
  id: string;
  label: string;
  level: number;
  isCalculated: boolean;
  formula?: string;
  values: { [month: string]: number };
  total: number;
  percentage?: number;
  color?: string;
  isBold?: boolean;
  isSubtotal?: boolean;
}

interface MonthlyData {
  month: string;
  monthName: string;
  receitas: number;
  despesas: number;
  resultado: number;
}

// ===================================================
// ✅ CONSTANTES
// ===================================================

const MONTHS = [
  { value: '01', label: 'Janeiro', short: 'Jan' },
  { value: '02', label: 'Fevereiro', short: 'Fev' },
  { value: '03', label: 'Março', short: 'Mar' },
  { value: '04', label: 'Abril', short: 'Abr' },
  { value: '05', label: 'Maio', short: 'Mai' },
  { value: '06', label: 'Junho', short: 'Jun' },
  { value: '07', label: 'Julho', short: 'Jul' },
  { value: '08', label: 'Agosto', short: 'Ago' },
  { value: '09', label: 'Setembro', short: 'Set' },
  { value: '10', label: 'Outubro', short: 'Out' },
  { value: '11', label: 'Novembro', short: 'Nov' },
  { value: '12', label: 'Dezembro', short: 'Dez' }
];

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// ===================================================
// ✅ COMPONENTE PRINCIPAL
// ===================================================

export const DemonstrativoPage = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const {
    dreData,
    categories,
    lancamentos,
    getDREData,
    isLoading,
    hideValues
  } = useAppContext();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Carregar dados do DRE
  useEffect(() => {
    getDREData(selectedYear);
  }, [selectedYear, getDREData]);

  // ===================================================
  // ✅ PROCESSAMENTO DE DADOS
  // ===================================================

  const processedDREData = useMemo(() => {
    if (!dreData || dreData.length === 0) {
      return { dreLines: [], monthlyData: [] };
    }

    // Agrupar dados por categoria e mês
    const dataByCategory = dreData.reduce((acc, item) => {
      if (!acc[item.categoria_nome]) {
        acc[item.categoria_nome] = {
          type: item.categoria_tipo,
          parent_id: item.parent_id,
          months: {}
        };
      }
      
      const monthKey = item.mes.toString().padStart(2, '0');
      acc[item.categoria_nome].months[monthKey] = {
        receitas: item.receitas,
        despesas: item.despesas
      };
      
      return acc;
    }, {} as any);

    // Criar linhas do DRE
    const dreLines: DRELine[] = [];
    
    // 1. RECEITAS BRUTAS
    dreLines.push({
      id: 'receitas_brutas',
      label: 'RECEITAS BRUTAS',
      level: 0,
      isCalculated: false,
      values: {},
      total: 0,
      isBold: true,
      color: '#10B981'
    });

    // Adicionar categorias de receita
    Object.entries(dataByCategory).forEach(([categoryName, data]: [string, any]) => {
      if (data.type === 'income' && !data.parent_id) {
        const values = {};
        let total = 0;
        
        MONTHS.forEach(month => {
          const monthData = data.months[month.value] || { receitas: 0, despesas: 0 };
          values[month.value] = monthData.receitas;
          total += monthData.receitas;
        });

        dreLines.push({
          id: `receita_${categoryName}`,
          label: categoryName,
          level: 1,
          isCalculated: false,
          values,
          total
        });
      }
    });

    // Calcular total de receitas brutas
    const receitasBrutasValues = {};
    let receitasBrutasTotal = 0;
    MONTHS.forEach(month => {
      const monthTotal = dreLines
        .filter(line => line.id.startsWith('receita_'))
        .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
      receitasBrutasValues[month.value] = monthTotal;
      receitasBrutasTotal += monthTotal;
    });
    
    dreLines[0].values = receitasBrutasValues;
    dreLines[0].total = receitasBrutasTotal;

    // 2. DEDUÇÕES DA RECEITA BRUTA
    dreLines.push({
      id: 'deducoes',
      label: 'DEDUÇÕES DA RECEITA BRUTA',
      level: 0,
      isCalculated: false,
      values: {},
      total: 0,
      isBold: true,
      color: '#EF4444'
    });

    // 3. RECEITA LÍQUIDA (calculada)
    dreLines.push({
      id: 'receita_liquida',
      label: 'RECEITA LÍQUIDA',
      level: 0,
      isCalculated: true,
      formula: 'receitas_brutas - deducoes',
      values: receitasBrutasValues, // Por enquanto igual às brutas
      total: receitasBrutasTotal,
      isBold: true,
      isSubtotal: true,
      color: '#3B82F6'
    });

    // 4. CUSTOS VARIÁVEIS
    dreLines.push({
      id: 'custos_variaveis',
      label: 'CUSTOS VARIÁVEIS',
      level: 0,
      isCalculated: false,
      values: {},
      total: 0,
      isBold: true,
      color: '#F59E0B'
    });

    // Adicionar categorias de custos variáveis (despesas operacionais)
    Object.entries(dataByCategory).forEach(([categoryName, data]: [string, any]) => {
      if (data.type === 'expense' && !data.parent_id) {
        const values = {};
        let total = 0;
        
        MONTHS.forEach(month => {
          const monthData = data.months[month.value] || { receitas: 0, despesas: 0 };
          values[month.value] = monthData.despesas;
          total += monthData.despesas;
        });

        dreLines.push({
          id: `custo_${categoryName}`,
          label: categoryName,
          level: 1,
          isCalculated: false,
          values,
          total
        });
      }
    });

    // Calcular total de custos variáveis
    const custosVariaveisValues = {};
    let custosVariaveisTotal = 0;
    MONTHS.forEach(month => {
      const monthTotal = dreLines
        .filter(line => line.id.startsWith('custo_'))
        .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
      custosVariaveisValues[month.value] = monthTotal;
      custosVariaveisTotal += monthTotal;
    });
    
    const custosVariaveisIndex = dreLines.findIndex(line => line.id === 'custos_variaveis');
    dreLines[custosVariaveisIndex].values = custosVariaveisValues;
    dreLines[custosVariaveisIndex].total = custosVariaveisTotal;

    // 5. MARGEM DE CONTRIBUIÇÃO (calculada)
    const margemContribuicaoValues = {};
    let margemContribuicaoTotal = 0;
    MONTHS.forEach(month => {
      const receita = receitasBrutasValues[month.value] || 0;
      const custos = custosVariaveisValues[month.value] || 0;
      const margem = receita - custos;
      margemContribuicaoValues[month.value] = margem;
      margemContribuicaoTotal += margem;
    });

    dreLines.push({
      id: 'margem_contribuicao',
      label: 'MARGEM DE CONTRIBUIÇÃO',
      level: 0,
      isCalculated: true,
      formula: 'receita_liquida - custos_variaveis',
      values: margemContribuicaoValues,
      total: margemContribuicaoTotal,
      isBold: true,
      isSubtotal: true,
      color: margemContribuicaoTotal >= 0 ? '#10B981' : '#EF4444'
    });

    // 6. RESULTADO OPERACIONAL (igual à margem por enquanto)
    dreLines.push({
      id: 'resultado_operacional',
      label: 'RESULTADO OPERACIONAL',
      level: 0,
      isCalculated: true,
      formula: 'margem_contribuicao',
      values: margemContribuicaoValues,
      total: margemContribuicaoTotal,
      isBold: true,
      isSubtotal: true,
      color: margemContribuicaoTotal >= 0 ? '#10B981' : '#EF4444'
    });

    // 7. RESULTADO LÍQUIDO (igual ao operacional por enquanto)
    dreLines.push({
      id: 'resultado_liquido',
      label: 'RESULTADO LÍQUIDO',
      level: 0,
      isCalculated: true,
      formula: 'resultado_operacional',
      values: margemContribuicaoValues,
      total: margemContribuicaoTotal,
      isBold: true,
      isSubtotal: true,
      color: margemContribuicaoTotal >= 0 ? '#10B981' : '#EF4444'
    });

    // Calcular percentuais
    dreLines.forEach(line => {
      if (receitasBrutasTotal > 0) {
        line.percentage = (line.total / receitasBrutasTotal) * 100;
      }
    });

    // Criar dados mensais para gráficos
    const monthlyData: MonthlyData[] = MONTHS.map(month => ({
      month: month.value,
      monthName: month.short,
      receitas: receitasBrutasValues[month.value] || 0,
      despesas: custosVariaveisValues[month.value] || 0,
      resultado: margemContribuicaoValues[month.value] || 0
    }));

    return { dreLines, monthlyData };
  }, [dreData]);

  // ===================================================
  // ✅ FUNÇÕES AUXILIARES
  // ===================================================

  const formatCurrency = (value: number): string => {
    if (hideValues) return '••••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    if (hideValues) return '••••';
    return `${value.toFixed(1)}%`;
  };

  const exportToPDF = () => {
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação para PDF será implementada em breve.",
    });
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  // ===================================================
  // ✅ COMPONENTES DE RENDERIZAÇÃO
  // ===================================================

  const renderDRETable = () => {
    const { dreLines } = processedDREData;

    if (dreLines.length === 0) {
      return (
        <div className="text-center py-12">
          <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Não há lançamentos para o ano selecionado ou os dados ainda não foram processados.
          </p>
          <Button onClick={() => getDREData(selectedYear)}>
            Recarregar Dados
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left p-3 font-semibold">Descrição</th>
              {MONTHS.map(month => (
                <th key={month.value} className="text-right p-3 font-semibold min-w-[100px]">
                  {month.short}
                </th>
              ))}
              <th className="text-right p-3 font-semibold min-w-[120px]">Total</th>
              <th className="text-right p-3 font-semibold min-w-[80px]">%</th>
            </tr>
          </thead>
          <tbody>
            {dreLines.map((line, index) => (
              <tr 
                key={line.id} 
                className={cn(
                  "border-b border-border hover:bg-muted/50",
                  line.isSubtotal && "bg-muted/30",
                  line.isBold && "font-semibold"
                )}
              >
                <td 
                  className={cn(
                    "p-3",
                    line.level === 0 ? "font-bold" : `pl-${3 + line.level * 4}`,
                    line.color && "border-l-4"
                  )}
                  style={line.color ? { borderLeftColor: line.color } : {}}
                >
                  {line.label}
                </td>
                {MONTHS.map(month => (
                  <td key={month.value} className="text-right p-3 font-mono text-sm">
                    {formatCurrency(line.values[month.value] || 0)}
                  </td>
                ))}
                <td className={cn(
                  "text-right p-3 font-mono text-sm font-semibold",
                  line.total >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(line.total)}
                </td>
                <td className="text-right p-3 font-mono text-sm">
                  {line.percentage ? formatPercentage(line.percentage) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCharts = () => {
    const { monthlyData } = processedDREData;

    if (monthlyData.length === 0) {
      return (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum dado disponível para gráficos</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Receitas vs Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Receitas vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
                <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Resultado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultado Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Resultado']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="resultado" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===================================================
  // ✅ RENDER PRINCIPAL
  // ===================================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <MainLayout title="Demonstrativo de Resultados (DRE)">
      <SubscriptionGuard feature="o demonstrativo de resultados">
        <div className="w-full p-6 md:p-8">
          <motion.div
            className={cn(isMobile ? "space-y-4" : "space-y-6")}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-foreground">Demonstrativo de Resultados</h2>
                <div className="flex items-center gap-4">
                  <Select
                    onValueChange={(value) => setSelectedYear(Number(value))}
                    value={selectedYear.toString()}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Selecione o Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                    className="flex items-center gap-2"
                  >
                    {viewMode === 'table' ? <BarChart className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {viewMode === 'table' ? 'Ver Gráficos' : 'Ver Tabela'}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={exportToPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Conteúdo Principal */}
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Carregando dados...</p>
                </div>
              ) : (
                viewMode === 'table' ? renderDRETable() : renderCharts()
              )}
            </motion.div>
          </motion.div>
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default DemonstrativoPage;


