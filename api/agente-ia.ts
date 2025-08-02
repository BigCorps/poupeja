import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '@/integrations/supabase/client';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header not found' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const userId = user.id;

  try {
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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama3-8b-8192',
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Não entendi. Pode reformular a pergunta?';
    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Error in Agente IA API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
