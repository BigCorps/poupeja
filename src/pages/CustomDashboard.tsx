import React from 'react';
import { HtmlJsSection } from '@/components/htmljs/HtmlJsSection';

// A página CustomDashboard, que renderizará o conteúdo HTML/JS
const CustomDashboard = () => {
  // Exemplo de como usar o componente HtmlJsSection
  // Você pode passar props, como um ID único, para gerenciar diferentes seções
  // O conteúdo HTML e JS pode vir de um estado ou de uma API, conforme o seu guia
  const htmlContent = `
    <div class="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4 text-primary">Minha Seção Personalizada</h2>
      <p class="text-muted-foreground">Este é um exemplo de conteúdo HTML dentro do seu dashboard.</p>
      <button id="my-button" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg">Clique em mim!</button>
    </div>
    <script>
      document.getElementById('my-button').addEventListener('click', () => {
        alert('Botão clicado!');
      });
    </script>
  `;

  return (
    <div className="p-6">
      <HtmlJsSection
        sectionId="meu-primeiro-dashboard"
        htmlContent={htmlContent}
        jsCode={''} // Você pode colocar o JS aqui ou dentro do htmlContent
      />
    </div>
  );
};

export default CustomDashboard;
