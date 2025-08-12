import React from 'react';
import { HtmlJsSection } from '@/components/htmljs'; // Importe o componente

const CustomDashboard = () => {
  // Exemplo de como o conteúdo HTML deve ser estruturado.
  // A função 'primeiro' está declarada no <script>.
  const htmlContent = `
    <style>
      .content-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background-color: #f8fafc;
      }
      .content-container h2 {
        font-size: 1.5rem;
        font-weight: bold;
        color: #1e293b;
      }
      .content-container p {
        color: #475569;
      }
      .action-button {
        background-color: #3b82f6;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .action-button:hover {
        background-color: #2563eb;
      }
    </style>
    <div class="content-container">
      <h2>Minha Seção Personalizada</h2>
      <p>Este é um exemplo de conteúdo HTML dentro do seu dashboard. A função 'primeiro' será chamada ao clicar no botão abaixo.</p>
      <button class="action-button" onclick="primeiro()">Clique em mim!</button>
      <p id="mensagem"></p>
    </div>

    <script>
      function primeiro() {
        console.log('A função "primeiro" foi chamada com sucesso!');
        document.getElementById('mensagem').innerText = 'Ação realizada com sucesso!';
        
        // ATENÇÃO: Se o seu site travar, verifique a linha abaixo!
        // A função `postMessage` pode causar um loop infinito de renderização
        // se o componente React pai reagir à mensagem e disparar uma nova renderização
        // que executa este script novamente. 
        // Use com cuidado e certifique-se de que o código React lida com a mensagem de forma assíncrona
        // e não causa uma nova renderização em loop.
        // parent.postMessage({ type: 'data_changed', data: 'nova mensagem' }, '*');
      }
    </script>
  `;

  return (
    <div>
      <HtmlJsSection htmlContent={htmlContent} />
    </div>
  );
};

export default CustomDashboard;
