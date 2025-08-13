import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Substituindo os imports com aliases por implementações simples
// Em um ambiente de desenvolvimento real, você precisaria configurar o
// seu bundler (como Webpack ou Vite) para resolver esses aliases.
// Para este exemplo, estamos usando placeholders para que o código seja compilado.
const DashboardCharts = ({ currentMonth, hideValues, lancamentos, chartType }) => {
  // Simplesmente retorna um placeholder para os gráficos
  return (
    <div className="flex justify-center items-center h-[200px] text-muted-foreground">
      <p>
        Gráfico {chartType === 'pie' ? 'de Pizza' : 'de Linha'} Placeholder<br />
        Adicione lançamentos para ver os gráficos
      </p>
    </div>
  );
};
const usePreferences = () => ({ t: (key) => key });

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
