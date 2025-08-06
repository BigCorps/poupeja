import React from 'react';
import AuthLayout from '@/components/layout/AuthLayout'; // ✅ Usando o novo layout
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const Privacy: React.FC = () => {
  return (
    <AuthLayout>
      <div className="container mx-auto py-6 md:py-12 w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Aviso de Privacidade</h1>
        <Card>
          <CardContent className="p-6 md:p-8">
            <ScrollArea className="h-[70vh]">
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  O Vixus, empresa proprietária do aplicativo, está comprometido em proteger a
                  sua privacidade. Este Aviso de Privacidade descreve como coletamos, usamos
                  e protegemos suas informações pessoais. Ao usar nosso serviço, você concorda
                  com a coleta e uso de informações de acordo com este aviso.
                </p>

                <h2>1. Informações que Coletamos</h2>
                <p>
                  Coletamos informações para fornecer e melhorar nosso serviço para você. As informações
                  coletadas podem incluir:
                </p>
                <ul>
                  <li>
                    <strong>Informações de Identificação Pessoal:</strong> Nome, endereço de e-mail,
                    e outras informações de contato que você nos fornece ao se registrar.
                  </li>
                  <li>
                    <strong>Dados Financeiros:</strong> Informações de transações, saldos de contas
                    e dados bancários que você nos permite acessar para fornecer os serviços de
                    gerenciamento financeiro.
                  </li>
                  <li>
                    <strong>Dados de Uso:</strong> Informações sobre como o serviço é acessado e
                    utilizado, como o seu endereço IP, tipo de navegador, páginas visitadas e
                    duração da visita.
                  </li>
                </ul>

                <h2>2. Como Usamos Suas Informações</h2>
                <p>
                  Utilizamos as informações coletadas para diversas finalidades, tais como:
                </p>
                <ul>
                  <li>Fornecer e manter o nosso serviço.</li>
                  <li>Gerenciar sua conta e fornecer suporte ao cliente.</li>
                  <li>Analisar o uso do serviço para melhorá-lo.</li>
                  <li>Detectar, prevenir e resolver problemas técnicos.</li>
                  <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>

                <h2>3. Proteção de Dados</h2>
                <p>
                  A segurança de seus dados é importante para nós. Empregamos medidas de segurança
                  físicas, eletrônicas e administrativas para proteger suas informações pessoais
                  contra acesso não autorizado, uso, alteração ou destruição. No entanto, lembre-se
                  que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico
                  é 100% seguro.
                </p>

                <h2>4. Compartilhamento de Dados</h2>
                <p>
                  Não vendemos, trocamos ou transferimos suas informações de identificação pessoal
                  para terceiros sem o seu consentimento, exceto quando necessário para o
                  funcionamento do serviço (por exemplo, com provedores de serviços de pagamento)
                  ou quando exigido por lei.
                </p>

                <h2>5. Seus Direitos</h2>
                <p>
                  Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de
                  suas informações pessoais a qualquer momento. Para exercer esses direitos,
                  entre em contato conosco através do nosso suporte.
                </p>
                
                <h2>6. Alterações a Este Aviso de Privacidade</h2>
                <p>
                  Podemos atualizar nosso Aviso de Privacidade periodicamente. Notificaremos você
                  sobre quaisquer alterações publicando o novo Aviso de Privacidade nesta página.
                </p>

                <h2>7. Contato</h2>
                <p>
                  Se você tiver alguma dúvida sobre este Aviso de Privacidade, entre em contato
                  conosco.
                </p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default Privacy;

