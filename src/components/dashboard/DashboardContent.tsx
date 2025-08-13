import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';
import { Landmark, Receipt, BarChart3 } from 'lucide-react';

interface DashboardContentProps {
  currentMonth: Date;
  hideValues: boolean;
  lancamentos: any[]; // Nova prop para lançamentos
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
    <>
      {/* Seção de gráficos */}
      <motion.div variants={itemVariants}>
        <DashboardCharts 
          currentMonth={currentMonth} 
          hideValues={hideValues}
          lancamentos={lancamentos} // Atualizado para usar lançamentos
        />
      </motion.div>
      
      {/* Link para a seção de Saldo */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Landmark size={24} className="mr-4 text-purple-600" />
                <h3 className="text-xl font-semibold">Saldo</h3>
              </div>
              <Button asChild>
                <Link to="/saldo">Ver Saldo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Link para Lançamentos - NOVA SEÇÃO */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Receipt size={24} className="mr-4 text-green-600" />
                <div>
                  <h3 className="text-xl font-semibold">Lançamentos</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie suas receitas e despesas
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/lancamentos">Gerenciar Lançamentos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Link para Fluxo de Caixa - NOVA SEÇÃO */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BarChart3 size={24} className="mr-4 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold">Fluxo de Caixa</h3>
                  <p className="text-sm text-muted-foreground">
                    Análise e demonstrativos financeiros
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/fluxo-caixa">Ver Análises</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lançamentos recentes - SUBSTITUINDO TransactionList */}
      {recentLancamentos.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Lançamentos Recentes</h3>
                <Button variant="outline" asChild>
                  <Link to="/lancamentos">Ver Todos</Link>
                </Button>
              </div>
              
              {/* Lista simplificada de lançamentos recentes */}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há lançamentos */}
      {recentLancamentos.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0">
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
    </>
  );
};

export default DashboardContent;
