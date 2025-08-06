import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const Terms: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 md:py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Termos de Uso</h1>
        <Card>
          <CardContent className="p-6 md:p-8">
            <ScrollArea className="h-[70vh]">
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  Bem-vindo ao Vixus. Ao acessar ou usar nosso aplicativo, você concorda em cumprir e
                  estar vinculado aos seguintes termos e condições de uso. Se você não concordar com
                  qualquer parte dos termos, não deve usar nosso aplicativo.
                </p>

                <h2>1. Aceitação dos Termos</h2>
                <p>
                  O uso do serviço Vixus está sujeito a estes Termos de Uso. Podemos atualizar os
                  termos a qualquer momento. É sua responsabilidade verificar periodicamente as
                  alterações.
                </p>

                <h2>2. Descrição do Serviço</h2>
                <p>
                  O Vixus é uma plataforma de gerenciamento financeiro que permite aos usuários
                  acompanhar despesas, definir orçamentos, monitorar metas financeiras e utilizar
                  outras funcionalidades relacionadas, como cobranças, pagamentos e consultas de dados.
                </p>

                <h2>3. Registro e Conta do Usuário</h2>
                <p>
                  Para acessar a maioria das funcionalidades do Vixus, você deve se registrar e
                  criar uma conta. Você é responsável por manter a confidencialidade de sua senha
                  e por todas as atividades que ocorrem em sua conta.
                </p>

                <h2>4. Conduta do Usuário</h2>
                <p>Você concorda em não:</p>
                <ul>
                  <li>Usar o serviço para qualquer finalidade ilegal ou proibida por estes termos.</li>
                  <li>Tentar obter acesso não autorizado a outras contas, sistemas de computador ou redes.</li>
                  <li>Interferir ou interromper a segurança do serviço.</li>
                </ul>

                <h2>5. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo e materiais disponíveis no Vixus, incluindo, mas não se limitando a
                  textos, gráficos, logotipos, ícones, imagens e softwares, são de propriedade da Vixus
                  e estão protegidos por leis de direitos autorais e outras leis de propriedade
                  intelectual.
                </p>

                <h2>6. Limitação de Responsabilidade</h2>
                <p>
                  O Vixus não se responsabiliza por quaisquer danos diretos, indiretos, incidentais,
                  especiais, consequenciais ou exemplares, incluindo, mas não se limitando a, danos
                  por perda de lucros, dados ou outras perdas intangíveis.
                </p>
                
                <h2>7. Privacidade</h2>
                <p>
                  Sua privacidade é muito importante para nós. O uso do nosso serviço também é regido
                  pelo nosso Aviso de Privacidade, que detalha como coletamos, usamos e protegemos
                  suas informações pessoais.
                </p>

                <h2>8. Rescisão</h2>
                <p>
                  Podemos encerrar ou suspender seu acesso ao serviço, sem aviso prévio ou
                  responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar
                  os Termos de Uso.
                </p>

                <h2>9. Lei Aplicável</h2>
                <p>
                  Estes Termos de Uso serão regidos e interpretados de acordo com as leis do
                  Brasil, sem considerar suas disposições sobre conflitos de leis.
                </p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Terms;

