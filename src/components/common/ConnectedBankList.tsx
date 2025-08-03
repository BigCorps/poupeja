import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, Link as LinkIcon, BanknoteIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define a interface para o banco conectado
interface ConnectedBank {
  id: string;
  name: string;
  icon?: string; // URL ou nome do ícone
}

interface ConnectedBankListProps {
  banks: ConnectedBank[];
  onConnectNewBank: () => void;
  onDisconnectBank: (bankId: string) => void;
}

const ConnectedBankList: React.FC<ConnectedBankListProps> = ({ banks, onConnectNewBank, onDisconnectBank }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bancos Conectados</CardTitle>
        <CardDescription>
          Gerencie suas contas bancárias para sincronização de transações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {banks.length > 0 ? (
          <div className="space-y-4">
            {banks.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  {bank.icon ? (
                    <img src={bank.icon} alt={`${bank.name} icon`} className="h-8 w-8" />
                  ) : (
                    <BanknoteIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-lg font-medium">{bank.name}</span>
                </div>
                <Button variant="destructive" onClick={() => onDisconnectBank(bank.id)}>
                  Desconectar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg border-2 border-dashed border-gray-300">
            <Banknote className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Você ainda não conectou nenhum banco. Conecte um banco para começar a importar suas transações.
            </p>
            <Button onClick={onConnectNewBank} className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Conectar Novo Banco
            </Button>
          </div>
        )}
        {banks.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button onClick={onConnectNewBank} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Conectar Novo Banco
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectedBankList;

// Exemplo de como importar e usar este componente em outra página
// import ConnectedBankList from '@/components/common/ConnectedBankList';
//
// const BancosConectadosPage = () => {
//   const connectedBanks = [
//     { id: '1', name: 'Banco Exemplo S.A.', icon: 'https://placehold.co/32x32/1a202c/ffffff?text=BE' },
//     { id: '2', name: 'Outro Banco Digital', icon: 'https://placehold.co/32x32/f6ad55/1a202c?text=OBD' },
//   ];
//
//   const handleConnect = () => {
//     alert('Botão para conectar um novo banco foi clicado!');
//   };
//
//   const handleDisconnect = (id: string) => {
//     alert(`Botão para desconectar o banco ${id} foi clicado!`);
//   };
//
//   return (
//     <div>
//       <ConnectedBankList
//         banks={connectedBanks}
//         onConnectNewBank={handleConnect}
//         onDisconnectBank={handleDisconnect}
//       />
//     </div>
//   );
// };
//
// export default BancosConectadosPage;
