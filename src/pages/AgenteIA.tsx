import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AgenteIA = () => {
  const { addCategory, session } = useApp(); // ✅ Obtenha a sessão do AppContext
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // ✅ Verifique se a sessão e o token de acesso existem antes de enviar
    if (!session || !session.access_token) {
      setMessages(currentMessages => [
        ...currentMessages,
        { role: 'assistant', content: 'Você precisa estar logado para usar o Agente IA.' },
      ]);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(currentMessages => [...currentMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agente-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // ✅ Adicionado o token de autenticação
        },
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
    <MainLayout>
      <SubscriptionGuard feature="agente ia">
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
