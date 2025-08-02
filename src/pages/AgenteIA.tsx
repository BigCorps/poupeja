import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout'; // 👈 Importamos o layout principal
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard'; // 👈 Se necessário, para restringir o acesso
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AgenteIA = () => { // 👈 Mudamos para uma função de componente padrão
  const { addCategory } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(currentMessages => [...currentMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agente-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: input }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a IA.');
      }

      const data = await response.json();
      const aiResponseContent = data.response;

      try {
        const parsedResponse = JSON.parse(aiResponseContent);
        if (parsedResponse.action === 'addCategory') {
          await addCategory(parsedResponse.name, parsedResponse.type);
          setMessages(currentMessages => [
            ...currentMessages,
            { role: 'assistant', content: `Categoria "${parsedResponse.name}" adicionada com sucesso!` },
          ]);
        } else {
          setMessages(currentMessages => [
            ...currentMessages,
            { role: 'assistant', content: aiResponseContent },
          ]);
        }
      } catch (e) {
        setMessages(currentMessages => [
          ...currentMessages,
          { role: 'assistant', content: aiResponseContent },
        ]);
      }

    } catch (error) {
      setMessages(currentMessages => [
        ...currentMessages,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro.' },
      ]);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout> {/* 👈 Envolvendo o componente no layout principal */}
      <SubscriptionGuard feature="agente ia"> {/* 👈 Exemplo de como usar o SubscriptionGuard */}
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8 flex flex-col h-full">
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle>Agente IA</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-4 space-y-4">
              <ScrollArea className="flex-grow p-4 border rounded-md">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div
                      className={`max-w-xs p-2 rounded-lg ${
                        msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <div className="flex w-full space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Pergunte ao Agente IA..."
                  className="flex-grow"
                  disabled={isLoading}
                />
                <Button onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default AgenteIA;
