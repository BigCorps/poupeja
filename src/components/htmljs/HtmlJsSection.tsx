import React from 'react';
import { HtmlJsSection } from '@/components/htmljs'; // Importe o componente

const CustomDashboard = () => {
  // Conteúdo HTML com um script que se comunica com o React
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
      <p>Este é um exemplo de conteúdo HTML dentro do seu dashboard. A função 'primeiro' irá enviar uma mensagem para o React ao clicar no botão abaixo.</p>
      <button class="action-button" onclick="primeiro()">Clique em mim!</button>
      <p id="mensagem"></p>
    </div>

    <script>
      function primeiro() {
        console.log('A função "primeiro" foi chamada com sucesso!');
        document.getElementById('mensagem').innerText = 'Ação realizada com sucesso!';
        
        // Esta é a forma correta de enviar mensagens para o componente React pai.
        // A API da solução já lida com o gerenciamento e previne loops de renderização.
        // Você deve usar 'window.HtmlJsSectionManager.sendMessageToSection'
        // ou o método 'sendMessage' disponível no namespace da seção.
        // Como o Manager já expõe um método global, podemos usá-lo diretamente.
        if (window.HtmlJsSectionManager) {
          window.HtmlJsSectionManager.sendMessageToSection("primeira-secao-id", {
            type: "button_click",
            timestamp: new Date().toISOString()
          });
          console.log('Mensagem enviada para o React.');
        } else {
          console.error('HtmlJsSectionManager não está disponível no objeto global window.');
        }
      }
    </script>
  `;

  return (
    <div>
      {/* O 'sectionId' é crucial para a comunicação. Ele deve ser único para cada seção. */}
      <HtmlJsSection sectionId="primeira-secao-id" htmlContent={htmlContent} />
    </div>
  );
};

export default CustomDashboard;
