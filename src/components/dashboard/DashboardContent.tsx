import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
} from 'lucide-react';

// Substituindo os imports com aliases por placeholders
// Em um ambiente de desenvolvimento real, você precisaria configurar o
// seu bundler (como Webpack ou Vite) para resolver esses aliases.
// Para este exemplo, estamos usando placeholders.
const Button = ({ children, variant, asChild }) => <button>{children}</button>;
const Card = ({ children, className }) => <div className={`border rounded-lg ${className}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`p-6 ${className}`}>{children}</div>;
const DashboardCharts = ({ currentMonth, hideValues, lancamentos }) => {
  return (
    <div className="flex justify-center items-center h-[200px] text-muted-foreground">
      <p>Gráfico Placeholder</p>
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

  const totalReceita = lancamentos
    .filter(l => l.classificacao === 'receita')
    .reduce((sum, l) => sum + l.valor_pago, 0);

  const totalDespesa = lancamentos
    .filter(l => l.classificacao === 'despesa')
    .reduce((sum, l) => sum + l.valor_pago, 0);

  const saldoTotal = totalReceita - totalDespesa;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Saldo Total */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Saldo Total
                  </h3>
                  <div className={`text-3xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {hideValues ? '***' :
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(saldoTotal)
                    }
                  </div>
                </div>
                <div className={`p-3 rounded-full ${saldoTotal >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <DollarSign size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card Receita */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Receita
                  </h3>
                  <div className="text-3xl font-bold text-green-600">
                    {hideValues ? '***' :
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalReceita)
                    }
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <ArrowUpCircle size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card Despesa */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Despesa
                  </h3>
                  <div className="text-3xl font-bold text-red-600">
                    {hideValues ? '***' :
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalDespesa)
                    }
                  </div>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <ArrowDownCircle size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card Fluxo de Caixa */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Fluxo de Caixa
                  </h3>
                  <div className="text-3xl font-bold">
                    {hideValues ? '***' : 'R$ 11.500,00'}
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <DollarSign size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Seção de gráficos */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <Card className="shadow-lg border h-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Receitas vs Despesas - agosto</h3>
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
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Distribuição de Despesas - agosto</h3>
              <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                <p>Nenhuma despesa encontrada<br />Adicione lançamentos para ver os gráficos</p>
              </div>
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
