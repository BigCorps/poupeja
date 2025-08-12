import React, { useEffect, useRef } from 'react';

// Componente simples para testar a injeção de HTML e JS
const SimpleDashboard = () => {
  const containerRef = useRef(null);

  // O useEffect garante que o script seja executado após a renderização do DOM.
  useEffect(() => {
    // Conteúdo HTML e JavaScript para ser injetado.
    // Usamos `dangerouslySetInnerHTML` para renderizar o HTML.
    // O script `inline` é a forma mais direta de testar a execução.
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
        <div id="status-message" style="
            margin-top: 1.5rem; 
            padding: 1rem; 
            background-color: #d1fae5; 
            color: #065f46; 
            border-radius: 8px;
            font-weight: 500;
        ">
            Verificando a execução do JavaScript...
        </div>
      </div>

      <script>
        // Este script será executado assim que o HTML for carregado.
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
          statusElement.textContent = 'O JavaScript foi executado com sucesso!';
          statusElement.style.backgroundColor = '#6ee7b7';
          statusElement.style.color = '#065f46';
        }
      </script>
    `;

    // Acessa o elemento DOM e injeta o HTML.
    if (containerRef.current) {
      containerRef.current.innerHTML = htmlContent;
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
