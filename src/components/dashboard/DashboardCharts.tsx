import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface DashboardChartsProps {
  currentMonth?: Date;
  hideValues?: boolean;
  lancamentos?: any[]; // Atualizado para usar lançamentos ao invés de transactions
}

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Calcular resumos por categoria baseado em lançamentos
const calculateCategorySummaries = (lancamentos: any[], classificacao: 'receita' | 'despesa') => {
  const categoryMap = new Map();
  
  lancamentos
    .filter(lancamento => lancamento.classificacao === classificacao)
    .forEach(lancamento => {
      const categoryName = lancamento.categoria?.name || 'Sem Categoria';
      const categoryColor = lancamento.categoria?.color || '#6B7280';
      const currentAmount = categoryMap.get(categoryName)?.amount || 0;
      
      categoryMap.set(categoryName, {
        category: categoryName,
        amount: currentAmount + lancamento.valor_pago,
        color: categoryColor
      });
    });
  
  return Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
};

// Gerar dados do gráfico baseado nos lançamentos
const generateChartData = (lancamentos: any[], month: Date) => {
  console.log("Generating chart data for month:", month, "with lancamentos:", lancamentos.length);
  
  // Criar um mapa para agrupar lançamentos por dia
  const lancamentosByDay = new Map();
  
  // Inicializar com todos os dias do mês
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    lancamentosByDay.set(i, {
      day: i,
      receitas: 0,
      despesas: 0,
      dateLabel: `${i}/${month.getMonth() + 1}`
    });
  }
  
  // Preencher com dados reais dos lançamentos
  lancamentos.forEach(lancamento => {
    const lancamentoDate = new Date(lancamento.data_referencia);
    const day = lancamentoDate.getDate();
    
    // Pular se não for do mês atual
    if (lancamentoDate.getMonth() !== month.getMonth() || 
        lancamentoDate.getFullYear() !== month.getFullYear()) {
      return;
    }
    
    const dayData = lancamentosByDay.get(day) || {
      day,
      receitas: 0, 
      despesas: 0,
      dateLabel: `${day}/${month.getMonth() + 1}`
    };
    
    if (lancamento.classificacao === 'receita') {
      dayData.receitas += lancamento.valor_pago;
    } else {
      dayData.despesas += lancamento.valor_pago;
    }
    
    lancamentosByDay.set(day, dayData);
  });
  
  // Converter mapa para array e calcular saldo
  const result = Array.from(lancamentosByDay.values());
  result.forEach(item => {
    item.saldo = item.receitas - item.despesas;
  });
  
  // Ordenar por dia
  result.sort((a, b) => a.day - b.day);
  
  // Se houver muitos dias, reduzir agrupando
  if (daysInMonth > 10) {
    const condensedData = [];
    const step = Math.ceil(daysInMonth / 10);
    
    for (let i = 0; i < daysInMonth; i += step) {
      const group = result.slice(i, i + step);
      if (group.length > 0) {
        const groupData = {
          day: group[0].day,
          dateLabel: `${group[0].day}-${group[group.length - 1].day}/${month.getMonth() + 1}`,
          receitas: group.reduce((sum, item) => sum + item.receitas, 0),
          despesas: group.reduce((sum, item) => sum + item.despesas, 0),
          saldo: group.reduce((sum, item) => sum + item.saldo, 0)
        };
        condensedData.push(groupData);
      }
    }
    
    return condensedData;
  }
  
  return result;
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  currentMonth = new Date(), 
  hideValues = false,
  lancamentos 
}) => {
  const { lancamentos: contextLancamentos } = useAppContext();
  const { t } = usePreferences();
  
  // Usar lançamentos fornecidos via props ou do contexto
  const lancamentosToUse = lancamentos || contextLancamentos || [];
  const despesaSummaries = calculateCategorySummaries(lancamentosToUse, 'despesa');
  
  console.log("Rendering charts with lancamentos:", lancamentosToUse.length, "for month:", currentMonth.toDateString());
  
  // Gerar dados para o mês atual usando os lançamentos fornecidos
  const monthData = generateChartData(lancamentosToUse, currentMonth);
  const monthName = format(currentMonth, 'MMMM', { locale: pt });
  
  // Tooltip customizado para gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'receitas' 
                ? 'Receitas' 
                : entry.name === 'despesas' 
                  ? 'Despesas'
                  : 'Saldo'}: {
                    hideValues 
                      ? '******' 
                      : formatCurrency(entry.value)
                  }
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico Mensal de Receitas/Despesas */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Receitas vs Despesas - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis tickFormatter={(value) => 
                    hideValues 
                      ? '***' 
                      : formatCurrency(value).split(',')[0]
                  } />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receitas" 
                    name="Receitas" 
                    stroke="#26DE81" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="despesas" 
                    name="Despesas" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza das Categorias de Despesas */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Despesas - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {despesaSummaries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={despesaSummaries}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                      label={({ category, percent }) => 
                        `${category}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {despesaSummaries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip 
                      formatter={(value) => 
                        hideValues 
                          ? '******' 
                          : formatCurrency(Number(value))
                      } 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Nenhuma despesa encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione lançamentos para ver os gráficos
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
