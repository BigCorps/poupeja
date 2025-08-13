import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Simplesmente para o código compilar, pois não temos o contexto completo
const usePreferences = () => ({ t: (key) => key });
const useAppContext = () => ({ lancamentos: [] });

// Função para formatar valores monetários
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Calcular resumos por categoria baseado em lançamentos
const calculateCategorySummaries = (lancamentos, classificacao) => {
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
const generateChartData = (lancamentos, month) => {
  const lancamentosByDay = new Map();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    lancamentosByDay.set(i, {
      day: i,
      receitas: 0,
      despesas: 0,
      dateLabel: `${i}/${month.getMonth() + 1}`
    });
  }

  lancamentos.forEach(lancamento => {
    const lancamentoDate = new Date(lancamento.data_referencia);
    const day = lancamentoDate.getDate();

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

  const result = Array.from(lancamentosByDay.values());
  result.forEach(item => {
    item.saldo = item.receitas - item.despesas;
  });

  result.sort((a, b) => a.day - b.day);

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

// Componente DashboardCharts completo
const DashboardCharts = ({ currentMonth = new Date(), hideValues = false, lancamentos }) => {
  const { lancamentos: contextLancamentos } = useAppContext();
  const lancamentosToUse = lancamentos || contextLancamentos || [];
  const despesaSummaries = calculateCategorySummaries(lancamentosToUse, 'despesa');
  const monthData = generateChartData(lancamentosToUse, currentMonth);
  const monthName = format(currentMonth, 'MMMM', { locale: pt });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
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


interface DashboardContentProps {
  currentMonth: Date;
  hideValues: boolean;
  lancamentos: any[];
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  currentMonth,
  hideValues,
  lancamentos
}) => {
  const { t } = usePreferences();

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

  // Filtrar lançamentos recentes (últimos 5)
  const recentLancamentos = lancamentos.slice(0, 5);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      {/* Seção de gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants} className="md:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardHeader>
              <CardTitle className="text-lg">Receitas vs Despesas - {currentMonth.toLocaleString('pt-BR', { month: 'long' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardCharts
                currentMonth={currentMonth}
                hideValues={hideValues}
                lancamentos={lancamentos}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuição de Despesas */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Despesas - {currentMonth.toLocaleString('pt-BR', { month: 'long' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardCharts
                currentMonth={currentMonth}
                hideValues={hideValues}
                lancamentos={lancamentos}
                chartType="pie"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {recentLancamentos.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Lançamentos Recentes</h3>
                <Button variant="outline" asChild>
                  <Link to="/lancamentos">Ver Todos</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentLancamentos.map((lancamento) => (
                  <div key={lancamento.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        lancamento.classificacao === 'receita' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {lancamento.descricao || `${lancamento.classificacao} - ${lancamento.categoria?.name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(lancamento.data_referencia).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        lancamento.classificacao === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {hideValues ? '***' :
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(lancamento.valor_pago)
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lancamento.status_pagamento}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {lancamentos.length > 5 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" asChild>
                    <Link to="/lancamentos">Ver Todos os Lançamentos</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {recentLancamentos.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border">
            <CardContent className="p-6 text-center">
              <Receipt size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum lançamento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro lançamento financeiro
              </p>
              <Button asChild>
                <Link to="/lancamentos">Criar Lançamento</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardContent;
