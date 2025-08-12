import React, { useEffect, useRef } from 'react';

// Componente simples para testar a injeção de HTML e JS
const SimpleDashboard = () => {
  const containerRef = useRef(null);

  // O useEffect garante que o script seja executado após a renderização do DOM.
  useEffect(() => {
    // Conteúdo HTML injetado. Removendo o script inline para evitar problemas de CSP.
    const htmlContent = `
      <div style="
          background-color: #f0f4f8;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
          font-family: 'Inter', sans-serif;
      ">
        <h1 style="color: #1e293b; font-size: 2.5rem; font-weight: bold;">Olá Mundo!</h1>
        <p style="color: #475569; font-size: 1.25rem;">Esta é a sua primeira seção HTML/JS.</p>
        <button id="test-button" style="
            margin-top: 1.5rem;
            padding: 1rem 2rem;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        ">
            Clique para testar o JavaScript
        </button>
        <div id="status-message" style="
            margin-top: 1.5rem;
            padding: 1rem;
            background-color: #d1fae5;
            color: #065f46;
            border-radius: 8px;
            font-weight: 500;
            display: none;
        ">
        </div>
      </div>
    `;

    // Acessa o elemento DOM e injeta o HTML.
    if (containerRef.current) {
      containerRef.current.innerHTML = htmlContent;

      // Adicionar o evento de clique após a injeção do HTML.
      // Isso evita o problema de scripts inline e é uma forma mais segura.
      const testButton = document.getElementById('test-button');
      if (testButton) {
        testButton.addEventListener('click', () => {
          const statusElement = document.getElementById('status-message');
          if (statusElement) {
            statusElement.textContent = 'O JavaScript foi executado com sucesso!';
            statusElement.style.backgroundColor = '#6ee7b7';
            statusElement.style.color = '#065f46';
            statusElement.style.display = 'block';
          }
        });
      }
    }
  }, []);

  return (
    <div className="dashboard-page p-8 bg-gray-50 min-h-screen">
      <div className="dashboard-header mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">Dashboard de Teste</h1>
        <p className="text-gray-600 mt-2">Uma abordagem simplificada para carregar HTML/JS</p>
      </div>

      {/* Container para o HTML/JS injetado */}
      <div ref={containerRef} />
    </div>
  );
};

export default SimpleDashboard;
