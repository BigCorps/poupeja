// src/pages/DemonstrativoPage.tsx - DEMONSTRATIVO DE RESULTADOS
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Calculator, Calendar } from 'lucide-react';
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
  Line
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
  isPercentageLine?: boolean;
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

// Estrutura padrão do DRE baseada no PDF
const DEFAULT_DRE_STRUCTURE = [
  // RECEITAS BRUTAS
  { id: 'receitas_brutas', label: '(+) Receitas Brutas', level: 0, isBold: true, isCalculated: false },
  { id: 'importacoes', label: 'Importações', level: 1, isBold: false, isCalculated: false },
  { id: 'receita_vendas', label: 'Receita com Vendas', level: 1, isBold: false, isCalculated: false },
  
  // DEDUÇÕES
  { id: 'deducoes_vendas', label: '(-) Deduções sobre Vendas', level: 0, isBold: true, isCalculated: false },
  { id: 'impostos_vendas', label: 'Impostos Sobre Vendas', level: 1, isBold: false, isCalculated: false },
  { id: 'outras_deducoes', label: 'Outras Deduções', level: 1, isBold: false, isCalculated: false },
  
  // RECEITA LÍQUIDA
  { id: 'receita_liquida', label: '(=) Receita Líquida', level: 0, isBold: true, isCalculated: true, isSubtotal: true },
  
  // CUSTOS VARIÁVEIS
  { id: 'custos_variaveis', label: '(-) Custos Variáveis', level: 0, isBold: true, isCalculated: false },
  { id: 'custos_variaveis_item', label: 'Custos Variáveis', level: 1, isBold: false, isCalculated: false },
  
  // MARGEM DE CONTRIBUIÇÃO
  { id: 'margem_contribuicao', label: '(=) Margem de Contribuição', level: 0, isBold: true, isCalculated: true, isSubtotal: true },
  { id: 'margem_contribuicao_percent', label: '(=) % Margem Contribuição', level: 0, isBold: true, isCalculated: true, isPercentageLine: true },
  
  // CUSTOS FIXOS
  { id: 'custos_fixos', label: '(-) Custos Fixos', level: 0, isBold: true, isCalculated: false },
  { id: 'gastos_marketing', label: 'Gastos com Marketing', level: 1, isBold: false, isCalculated: false },
  { id: 'gastos_ocupacao', label: 'Gastos com Ocupação', level: 1, isBold: false, isCalculated: false },
  { id: 'gastos_pessoal', label: 'Gastos com Pessoal', level: 1, isBold: false, isCalculated: false },
  { id: 'gastos_terceiros', label: 'Gastos com Serviços de Terceiros', level: 1, isBold: false, isCalculated: false },
  
  // RESULTADO OPERACIONAL
  { id: 'resultado_operacional', label: '(=) Resultado Operacional', level: 0, isBold: true, isCalculated: true, isSubtotal: true },
  { id: 'margem_operacional_percent', label: '(=) % Margem Operacional', level: 0, isBold: true, isCalculated: true, isPercentageLine: true },
  
  // RESULTADO FINANCEIRO
  { id: 'receita_financeira', label: 'Receita Financeira', level: 1, isBold: false, isCalculated: false },
  { id: 'despesa_financeira', label: 'Despesa Financeira', level: 1, isBold: false, isCalculated: false },
  
  // RESULTADO NÃO OPERACIONAL
  { id: 'resultado_nao_operacional', label: 'Resultado Não Operacional', level: 1, isBold: false, isCalculated: false },
  { id: 'receitas_nao_operacionais', label: 'Receitas não Operacionais', level: 1, isBold: false, isCalculated: false },
  { id: 'gastos_nao_operacionais', label: 'Gastos não Operacionais', level: 1, isBold: false, isCalculated: false },
  
  // LUCRO ANTES DO IMPOSTO
  { id: 'lair', label: '(=) Lucro Antes do Imposto de Renda (LAIR)', level: 0, isBold: true, isCalculated: true, isSubtotal: true },
  
  // IMPOSTOS
  { id: 'impostos_ir_csll', label: '(-) Imposto de Renda e CSLL', level: 0, isBold: true, isCalculated: false },
  { id: 'ir_csll', label: 'Imposto de Renda e CSLL', level: 1, isBold: false, isCalculated: false },
  
  // LUCRO LÍQUIDO
  { id: 'lucro_liquido', label: '(=) Lucro Líquido', level: 0, isBold: true, isCalculated: true, isSubtotal: true },
  { id: 'lucro_liquido_percent', label: '(=) % Lucro Líquido', level: 0, isBold: true, isCalculated: true, isPercentageLine: true }
];

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
    // Criar estrutura padrão com valores zerados
    const dreLines: DRELine[] = DEFAULT_DRE_STRUCTURE.map(item => ({
      ...item,
      values: MONTHS.reduce((acc, month) => ({ ...acc, [month.value]: 0 }), {}),
      total: 0,
      percentage: 0
    }));

    // Se há dados do Supabase, processar e integrar
    if (dreData && dreData.length > 0) {
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

      // Mapear categorias do Supabase para a estrutura do DRE
      Object.entries(dataByCategory).forEach(([categoryName, data]: [string, any]) => {
        // Encontrar linha correspondente ou adicionar nova
        let targetLineId = '';
        
        if (data.type === 'income') {
          // Mapear receitas para receita com vendas
          targetLineId = 'receita_vendas';
        } else if (data.type === 'expense') {
          // Mapear despesas baseado no nome da categoria
          const categoryLower = categoryName.toLowerCase();
          if (categoryLower.includes('marketing')) {
            targetLineId = 'gastos_marketing';
          } else if (categoryLower.includes('ocupação') || categoryLower.includes('aluguel')) {
            targetLineId = 'gastos_ocupacao';
          } else if (categoryLower.includes('pessoal') || categoryLower.includes('salário')) {
            targetLineId = 'gastos_pessoal';
          } else if (categoryLower.includes('terceiros') || categoryLower.includes('serviço')) {
            targetLineId = 'gastos_terceiros';
          } else {
            targetLineId = 'custos_variaveis_item';
          }
        }

        // Atualizar valores na linha correspondente
        const lineIndex = dreLines.findIndex(line => line.id === targetLineId);
        if (lineIndex !== -1) {
          MONTHS.forEach(month => {
            const monthData = data.months[month.value] || { receitas: 0, despesas: 0 };
            const value = data.type === 'income' ? monthData.receitas : monthData.despesas;
            dreLines[lineIndex].values[month.value] += value;
            dreLines[lineIndex].total += value;
          });
        }
      });

      // Adicionar categorias personalizadas do usuário que não foram mapeadas
      if (categories && categories.length > 0) {
        categories.forEach(category => {
          // Verificar se a categoria já foi mapeada
          const categoryData = dataByCategory[category.name];
          if (!categoryData) {
            // Adicionar nova linha para categoria personalizada
            const newLine: DRELine = {
              id: `custom_${category.id}`,
              label: category.name,
              level: 1,
              isCalculated: false,
              values: MONTHS.reduce((acc, month) => ({ ...acc, [month.value]: 0 }), {}),
              total: 0,
              percentage: 0,
              isBold: false
            };
            
            // Inserir na posição apropriada baseado no tipo
            if (category.type === 'income') {
              const insertIndex = dreLines.findIndex(line => line.id === 'deducoes_vendas');
              dreLines.splice(insertIndex, 0, newLine);
            } else {
              const insertIndex = dreLines.findIndex(line => line.id === 'margem_contribuicao');
              dreLines.splice(insertIndex, 0, newLine);
            }
          }
        });
      }
    }

    // Calcular totais e percentuais
    const receitasBrutas = dreLines.find(line => line.id === 'receitas_brutas');
    const deducoesVendas = dreLines.find(line => line.id === 'deducoes_vendas');
    const receitaLiquida = dreLines.find(line => line.id === 'receita_liquida');
    const custosVariaveis = dreLines.find(line => line.id === 'custos_variaveis');
    const margemContribuicao = dreLines.find(line => line.id === 'margem_contribuicao');
    const custosFixos = dreLines.find(line => line.id === 'custos_fixos');
    const resultadoOperacional = dreLines.find(line => line.id === 'resultado_operacional');
    const lair = dreLines.find(line => line.id === 'lair');
    const impostosIrCsll = dreLines.find(line => line.id === 'impostos_ir_csll');
    const lucroLiquido = dreLines.find(line => line.id === 'lucro_liquido');

    // Calcular receitas brutas (soma das receitas)
    if (receitasBrutas) {
      MONTHS.forEach(month => {
        const receitas = dreLines
          .filter(line => line.level === 1 && line.id.includes('receita') || line.id === 'importacoes')
          .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
        receitasBrutas.values[month.value] = receitas;
      });
      receitasBrutas.total = Object.values(receitasBrutas.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular deduções (soma das deduções)
    if (deducoesVendas) {
      MONTHS.forEach(month => {
        const deducoes = dreLines
          .filter(line => line.level === 1 && (line.id.includes('impostos') || line.id.includes('deducoes')))
          .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
        deducoesVendas.values[month.value] = deducoes;
      });
      deducoesVendas.total = Object.values(deducoesVendas.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular receita líquida
    if (receitaLiquida && receitasBrutas && deducoesVendas) {
      MONTHS.forEach(month => {
        receitaLiquida.values[month.value] = 
          (receitasBrutas.values[month.value] || 0) - (deducoesVendas.values[month.value] || 0);
      });
      receitaLiquida.total = Object.values(receitaLiquida.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular custos variáveis
    if (custosVariaveis) {
      MONTHS.forEach(month => {
        const custos = dreLines
          .filter(line => line.level === 1 && line.id.includes('custos_variaveis'))
          .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
        custosVariaveis.values[month.value] = custos;
      });
      custosVariaveis.total = Object.values(custosVariaveis.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular margem de contribuição
    if (margemContribuicao && receitaLiquida && custosVariaveis) {
      MONTHS.forEach(month => {
        margemContribuicao.values[month.value] = 
          (receitaLiquida.values[month.value] || 0) - (custosVariaveis.values[month.value] || 0);
      });
      margemContribuicao.total = Object.values(margemContribuicao.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular custos fixos
    if (custosFixos) {
      MONTHS.forEach(month => {
        const custos = dreLines
          .filter(line => line.level === 1 && line.id.includes('gastos_'))
          .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
        custosFixos.values[month.value] = custos;
      });
      custosFixos.total = Object.values(custosFixos.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular resultado operacional
    if (resultadoOperacional && margemContribuicao && custosFixos) {
      MONTHS.forEach(month => {
        resultadoOperacional.values[month.value] = 
          (margemContribuicao.values[month.value] || 0) - (custosFixos.values[month.value] || 0);
      });
      resultadoOperacional.total = Object.values(resultadoOperacional.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular LAIR (igual ao resultado operacional por enquanto)
    if (lair && resultadoOperacional) {
      MONTHS.forEach(month => {
        lair.values[month.value] = resultadoOperacional.values[month.value] || 0;
      });
      lair.total = resultadoOperacional.total;
    }

    // Calcular impostos
    if (impostosIrCsll) {
      MONTHS.forEach(month => {
        const impostos = dreLines
          .filter(line => line.level === 1 && line.id.includes('ir_csll'))
          .reduce((sum, line) => sum + (line.values[month.value] || 0), 0);
        impostosIrCsll.values[month.value] = impostos;
      });
      impostosIrCsll.total = Object.values(impostosIrCsll.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular lucro líquido
    if (lucroLiquido && lair && impostosIrCsll) {
      MONTHS.forEach(month => {
        lucroLiquido.values[month.value] = 
          (lair.values[month.value] || 0) - (impostosIrCsll.values[month.value] || 0);
      });
      lucroLiquido.total = Object.values(lucroLiquido.values).reduce((sum, val) => sum + val, 0);
    }

    // Calcular percentuais
    const receitaBrutaTotal = receitasBrutas?.total || 0;
    dreLines.forEach(line => {
      if (line.isPercentageLine) {
        // Linhas de percentual
        const baseLineId = line.id.replace('_percent', '');
        const baseLine = dreLines.find(l => l.id === baseLineId);
        if (baseLine && receitaBrutaTotal > 0) {
          MONTHS.forEach(month => {
            const baseValue = baseLine.values[month.value] || 0;
            const receitaBase = receitasBrutas?.values[month.value] || 0;
            line.values[month.value] = receitaBase > 0 ? (baseValue / receitaBase) * 100 : 0;
          });
          line.total = receitaBrutaTotal > 0 ? (baseLine.total / receitaBrutaTotal) * 100 : 0;
        }
      } else if (receitaBrutaTotal > 0) {
        line.percentage = (line.total / receitaBrutaTotal) * 100;
      }
    });

    // Criar dados mensais para gráficos
    const monthlyData: MonthlyData[] = MONTHS.map(month => ({
      month: month.value,
      monthName: month.short,
      receitas: receitasBrutas?.values[month.value] || 0,
      despesas: (custosVariaveis?.values[month.value] || 0) + (custosFixos?.values[month.value] || 0),
      resultado: lucroLiquido?.values[month.value] || 0
    }));

    return { dreLines, monthlyData };
  }, [dreData, categories]);

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
    return `${value.toFixed(2)}%`;
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
                    {line.isPercentageLine 
                      ? formatPercentage(line.values[month.value] || 0)
                      : formatCurrency(line.values[month.value] || 0)
                    }
                  </td>
                ))}
                <td className={cn(
                  "text-right p-3 font-mono text-sm font-semibold",
                  line.total >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {line.isPercentageLine 
                    ? formatPercentage(line.total || 0)
                    : formatCurrency(line.total || 0)
                  }
                </td>
                <td className="text-right p-3 font-mono text-sm">
                  {line.isPercentageLine 
                    ? '-' 
                    : (line.percentage ? formatPercentage(line.percentage) : '0,00%')
                  }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Demonstrativo de Resultados (DRE)</h1>
          
          {/* Seletor de Ano */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                "text-xs",
                viewMode === 'table' ? "" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Tabela
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('chart')}
              className={cn(
                "text-xs",
                viewMode === 'chart' ? "" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Ver Gráficos
            </Button>
          </div>

          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Carregando dados...</span>
            </div>
          ) : viewMode === 'table' ? (
            renderDRETable()
          ) : (
            renderCharts()
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DemonstrativoPage;

