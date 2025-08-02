import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgenteIA() {
  const { addCategory } = useApp(); // Pegamos a função de adicionar categoria do nosso contexto
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

      // ⚠️ Lógica para tratar a resposta da IA (passo 5)
      try {
        const parsedResponse = JSON.parse(aiResponseContent);
        if (parsedResponse.action === 'addCategory') {
          // A IA instruiu a adicionar uma categoria. Chamamos a função do AppContext.
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
        // A resposta não era um JSON de ação, trate como texto normal
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Agente IA</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow p-4 space-y-4">
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
  );
}
