import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, FileText, Download } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface FluxoCaixaData {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo_periodo: number;
  saldo_acumulado: number;
}

interface ResumoFluxoCaixa {
  atividades_operacionais: {
    entradas: number;
    saidas: number;
    saldo: number;
  };
  atividades_investimento: {
    entradas: number;
    saidas: number;
    saldo: number;
  };
  atividades_financiamento: {
    entradas: number;
    saidas: number;
    saldo: number;
  };
  saldo_inicial: number;
  saldo_final: number;
}

export default function FluxoCaixaPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('diario');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [fluxoDiario, setFluxoDiario] = useState<FluxoCaixaData[]>([]);
  const [fluxoMensal, setFluxoMensal] = useState<FluxoCaixaData[]>([]);
  const [fluxoAnual, setFluxoAnual] = useState<FluxoCaixaData[]>([]);
  const [resumoFluxo, setResumoFluxo] = useState<ResumoFluxoCaixa | null>(null);

  // Gerar anos disponíveis (últimos 5 anos + próximos 2)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  // Buscar dados do fluxo de caixa
  const fetchFluxoCaixa = useCallback(async () => {
    if (!user) return;
    
    try {
      // Aqui você implementaria a busca no Supabase
      // Por enquanto, vamos gerar dados de exemplo baseados na planilha
      
      // DFC Diário - dados do mês selecionado
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = endOfMonth(startDate);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const dadosDiarios: FluxoCaixaData[] = days.map((day, index) => {
        // Simulando dados baseados na planilha
        const entradas = Math.random() * 20000 + 5000; // Entre 5k e 25k
        const saidas = Math.random() * 15000 + 3000; // Entre 3k e 18k
        const saldo_periodo = entradas - saidas;
        const saldo_acumulado = index === 0 ? saldo_periodo : saldo_periodo + (index * 1000);
        
        return {
          periodo: format(day, 'dd/MM'),
          entradas,
          saidas,
          saldo_periodo,
          saldo_acumulado
        };
      });
      
      setFluxoDiario(dadosDiarios);

      // DFC Mensal - dados do ano selecionado
      const startYear = new Date(selectedYear, 0, 1);
      const endYear = endOfYear(startYear);
      const months = eachMonthOfInterval({ start: startYear, end: endYear });
      
      const dadosMensais: FluxoCaixaData[] = months.map((month, index) => {
        // Dados baseados na planilha CSV
        const monthData = [
          { entradas: 119673.01, saidas: 134060.00, saldo: -14386.99 },
          { entradas: 139192.05, saidas: 159303.43, saldo: -20111.38 },
          { entradas: 174001.78, saidas: 155061.96, saldo: 18939.82 },
          { entradas: 194933.29, saidas: 200442.15, saldo: -5508.86 },
          { entradas: 215852.41, saidas: 163346.51, saldo: 52505.90 },
          { entradas: 175060.95, saidas: 174557.24, saldo: 503.71 },
          { entradas: 0, saidas: 134119.45, saldo: -134119.45 },
          { entradas: 165270.00, saidas: 157090.00, saldo: 8180.00 },
          { entradas: 168960.00, saidas: 156508.49, saldo: 12451.52 },
          { entradas: 165140.00, saidas: 152226.98, saldo: 12913.02 },
          { entradas: 216600.00, saidas: 196204.45, saldo: 20395.55 },
          { entradas: 241270.00, saidas: 260803.22, saldo: -19533.22 }
        ];
        
        const data = dadosMensais[index] || { entradas: 0, saidas: 0, saldo: 0 };
        
        return {
          periodo: format(month, 'MMM/yyyy', { locale: ptBR }),
          entradas: data.entradas,
          saidas: data.saidas,
          saldo_periodo: data.saldo,
          saldo_acumulado: index === 0 ? data.saldo : data.saldo + (index * 5000)
        };
      });
      
      setFluxoMensal(dadosMensais);

      // DFC Anual - últimos 5 anos
      const dadosAnuais: FluxoCaixaData[] = availableYears.slice(-5).map((year, index) => {
        const entradas = 1975953.49 + (index * 100000); // Crescimento anual
        const saidas = 2043723.88 + (index * 95000);
        const saldo_periodo = entradas - saidas;
        
        return {
          periodo: year.toString(),
          entradas,
          saidas,
          saldo_periodo,
          saldo_acumulado: saldo_periodo + (index * 50000)
        };
      });
      
      setFluxoAnual(dadosAnuais);

      // Resumo DFC baseado na planilha
      const resumo: ResumoFluxoCaixa = {
        atividades_operacionais: {
          entradas: 1975953.49,
          saidas: 2043723.88,
          saldo: -67770.39
        },
        atividades_investimento: {
          entradas: 20598.90,
          saidas: 76543.21,
          saldo: -55944.31
        },
        atividades_financiamento: {
          entradas: 0.59,
          saidas: 95018.58,
          saldo: -95017.99
        },
        saldo_inicial: 8829.41,
        saldo_final: -58940.98
      };
      
      setResumoFluxo(resumo);
      
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
      toast({ title: "Erro", description: "Erro ao buscar dados do fluxo de caixa", variant: "destructive" });
    }
  }, [user, selectedYear, selectedMonth, toast]);

  useEffect(() => {
    fetchFluxoCaixa();
  }, [fetchFluxoCaixa]);

  // Função para exportar dados
  const handleExport = useCallback((tipo: string) => {
    toast({ title: "Exportação", description: `Exportando ${tipo}...` });
    // Aqui você implementaria a exportação para Excel/PDF
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground">
          Demonstrativo do Fluxo de Caixa (DFC) - Análise detalhada das movimentações financeiras
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diario" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>DFC Diário</span>
          </TabsTrigger>
          <TabsTrigger value="mensal" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>DFC Mensal</span>
          </TabsTrigger>
          <TabsTrigger value="anual" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>DFC Anual</span>
          </TabsTrigger>
          <TabsTrigger value="resumo" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Resumo DFC</span>
          </TabsTrigger>
        </TabsList>

        {/* DFC Diário */}
        <TabsContent value="diario" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Demonstrativo de Fluxo de Caixa Diário</CardTitle>
                  <CardDescription>
                    Movimentações diárias do período selecionado
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleExport('DFC Diário')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoDiario}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" stroke="#10B981" name="Entradas" strokeWidth={2} />
                    <Line type="monotone" dataKey="saidas" stroke="#EF4444" name="Saídas" strokeWidth={2} />
                    <Line type="monotone" dataKey="saldo_acumulado" stroke="#3B82F6" name="Saldo Acumulado" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Dia</th>
                      <th className="text-right p-2">Entradas</th>
                      <th className="text-right p-2">Saídas</th>
                      <th className="text-right p-2">Saldo do Dia</th>
                      <th className="text-right p-2">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxoDiario.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.periodo}</td>
                        <td className="p-2 text-right text-green-600">
                          R$ {item.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right ${item.saldo_periodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right font-semibold ${item.saldo_acumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DFC Mensal */}
        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Demonstrativo de Fluxo de Caixa Mensal</CardTitle>
                  <CardDescription>
                    Movimentações mensais do ano selecionado
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleExport('DFC Mensal')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fluxoMensal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="entradas" fill="#10B981" name="Entradas" />
                    <Bar dataKey="saidas" fill="#EF4444" name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Mês</th>
                      <th className="text-right p-2">Entradas</th>
                      <th className="text-right p-2">Saídas</th>
                      <th className="text-right p-2">Saldo do Mês</th>
                      <th className="text-right p-2">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxoMensal.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.periodo}</td>
                        <td className="p-2 text-right text-green-600">
                          R$ {item.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right ${item.saldo_periodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right font-semibold ${item.saldo_acumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DFC Anual */}
        <TabsContent value="anual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Demonstrativo de Fluxo de Caixa Anual</CardTitle>
                  <CardDescription>
                    Evolução anual das movimentações financeiras
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleExport('DFC Anual')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoAnual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" stroke="#10B981" name="Entradas" strokeWidth={3} />
                    <Line type="monotone" dataKey="saidas" stroke="#EF4444" name="Saídas" strokeWidth={3} />
                    <Line type="monotone" dataKey="saldo_acumulado" stroke="#3B82F6" name="Saldo Acumulado" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ano</th>
                      <th className="text-right p-2">Entradas</th>
                      <th className="text-right p-2">Saídas</th>
                      <th className="text-right p-2">Saldo do Ano</th>
                      <th className="text-right p-2">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxoAnual.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-semibold">{item.periodo}</td>
                        <td className="p-2 text-right text-green-600 font-semibold">
                          R$ {item.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right text-red-600 font-semibold">
                          R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right font-semibold ${item.saldo_periodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right font-bold ${item.saldo_acumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumo DFC */}
        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resumo do Fluxo de Caixa</CardTitle>
                  <CardDescription>
                    Demonstrativo consolidado por atividades (Operacionais, Investimento e Financiamento)
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleExport('Resumo DFC')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {resumoFluxo && (
                <div className="space-y-6">
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Saldo Inicial</span>
                        </div>
                        <div className={`text-xl font-bold ${resumoFluxo.saldo_inicial >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {resumoFluxo.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Ativ. Operacionais</span>
                        </div>
                        <div className={`text-xl font-bold ${resumoFluxo.atividades_operacionais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {resumoFluxo.atividades_operacionais.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Ativ. Investimento</span>
                        </div>
                        <div className={`text-xl font-bold ${resumoFluxo.atividades_investimento.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {resumoFluxo.atividades_investimento.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">Saldo Final</span>
                        </div>
                        <div className={`text-xl font-bold ${resumoFluxo.saldo_final >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {resumoFluxo.saldo_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela detalhada */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Atividades</th>
                          <th className="text-right p-3 font-semibold">Entradas</th>
                          <th className="text-right p-3 font-semibold">Saídas</th>
                          <th className="text-right p-3 font-semibold">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b bg-blue-50 dark:bg-blue-950/20">
                          <td className="p-3 font-semibold text-blue-700 dark:text-blue-300">
                            (A) SALDO INICIAL DO ANO
                          </td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className={`p-3 text-right font-bold ${resumoFluxo.saldo_inicial >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {resumoFluxo.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        
                        <tr className="border-b bg-green-50 dark:bg-green-950/20">
                          <td className="p-3 font-semibold text-green-700 dark:text-green-300">
                            (B) ATIVIDADES OPERACIONAIS
                          </td>
                          <td className="p-3 text-right text-green-600 font-semibold">
                            R$ {resumoFluxo.atividades_operacionais.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-red-600 font-semibold">
                            R$ {resumoFluxo.atividades_operacionais.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-bold ${resumoFluxo.atividades_operacionais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {resumoFluxo.atividades_operacionais.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        
                        <tr className="border-b bg-purple-50 dark:bg-purple-950/20">
                          <td className="p-3 font-semibold text-purple-700 dark:text-purple-300">
                            (C) ATIVIDADES DE INVESTIMENTO
                          </td>
                          <td className="p-3 text-right text-green-600 font-semibold">
                            R$ {resumoFluxo.atividades_investimento.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-red-600 font-semibold">
                            R$ {resumoFluxo.atividades_investimento.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-bold ${resumoFluxo.atividades_investimento.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {resumoFluxo.atividades_investimento.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        
                        <tr className="border-b bg-orange-50 dark:bg-orange-950/20">
                          <td className="p-3 font-semibold text-orange-700 dark:text-orange-300">
                            (D) ATIVIDADES DE FINANCIAMENTO
                          </td>
                          <td className="p-3 text-right text-green-600 font-semibold">
                            R$ {resumoFluxo.atividades_financiamento.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-red-600 font-semibold">
                            R$ {resumoFluxo.atividades_financiamento.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-bold ${resumoFluxo.atividades_financiamento.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {resumoFluxo.atividades_financiamento.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        
                        <tr className="border-b-2 border-primary bg-gray-100 dark:bg-gray-800">
                          <td className="p-3 font-bold text-lg">
                            (E) SALDO FINAL: A + B + C + D
                          </td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className={`p-3 text-right font-bold text-lg ${resumoFluxo.saldo_final >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {resumoFluxo.saldo_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

