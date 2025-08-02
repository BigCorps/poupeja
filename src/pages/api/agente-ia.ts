import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import Groq from 'groq-sdk';
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

console.log('Status da GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Presente' : 'Ausente');

// 1. Verificação explícita da chave de API
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables.');
  throw new Error('GROQ_API_KEY is not set');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: 'Missing userMessage' });
  }

  // Obter o usuário logado para buscar dados específicos
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // 1. Buscar dados do usuário no Supabase
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .limit(10); // Limite para evitar prompts muito longos

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (transactionsError || categoriesError) {
      console.error('Supabase error:', transactionsError || categoriesError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // 2. Construir um prompt robusto para o GROQ
    const systemPrompt = `
      Você é o Agente IA da Vixus, um assistente financeiro pessoal.
      Sua função é analisar as transações e categorias do usuário para responder perguntas e realizar ações.
      As informações do usuário são as seguintes:
      - Transações recentes: ${JSON.stringify(transactions)}
      - Categorias existentes: ${JSON.stringify(categories)}

      Você pode responder perguntas sobre as finanças do usuário (ex: "quanto gastei com comida este mês?").
      Além disso, você tem a capacidade de adicionar novas categorias. Para isso, se o usuário pedir para adicionar uma categoria, responda com uma mensagem específica no formato JSON:
      {
        "action": "addCategory",
        "name": "nome_da_categoria",
        "type": "income" | "expense"
      }
      Mantenha a resposta concisa e sempre em português.
    `;

    // 3. Chamar a API GROQ
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama3-8b-8192', // Use o melhor modelo disponível
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Não entendi. Pode reformular a pergunta?';

    // 4. Enviar a resposta de volta ao frontend
    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Error in Agente IA API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
