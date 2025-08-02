import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import Groq from 'groq-sdk';
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]"; // Ajuste o caminho se necessário

// Inicialize o cliente GROQ com a variável de ambiente (ou chave hardcoded para teste)
const groq = new Groq({ apiKey: 'SUA_CHAVE_DE_API_GROQ_AQUI' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: 'Missing userMessage' });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    console.error('API Error: User not authenticated');
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // ---- Ponto de Diagnóstico 1: Checando Supabase ----
    console.log('Fetching data from Supabase for user:', userId);

    const { data: transactions, error: transactionsError } = await supabase
      .from('poupeja_transactions')
      .select('*')
      .eq('user_id', userId)
      .limit(10);

    const { data: categories, error: categoriesError } = await supabase
      .from('poupeja_categories')
      .select('*')
      .eq('user_id', userId);

    if (transactionsError || categoriesError) {
      console.error('Supabase error:', transactionsError || categoriesError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    console.log('Supabase data fetched successfully.');
    console.log('Transactions:', transactions);
    console.log('Categories:', categories);

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

    // ---- Ponto de Diagnóstico 2: Checando Groq ----
    console.log('Making Groq API call...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama3-8b-8192',
    });
    console.log('Groq API call successful.');

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Não entendi. Pode reformular a pergunta?';

    // 4. Enviar a resposta de volta ao frontend
    res.status(200).json({ response: aiResponse });

  } catch (error) {
    // ---- Ponto de Diagnóstico 3: Erro detalhado ----
    console.error('Error in Agente IA API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
