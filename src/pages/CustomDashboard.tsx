import { HtmlJsSection } from '@/components/htmljs';

const MyAdvancedPage = () => {
  const htmlContent = `
    <div>
      <h3>Calculadora com Supabase</h3>
      <input type="number" id="value" placeholder="Digite um valor" />
      <button onclick="saveToSupabase()">Salvar no Supabase</button>
      <div id="result"></div>
    </div>
  `;

  const jsContent = `
    async function saveToSupabase() {
      const value = document.getElementById('value').value;
      
      try {
        const user = await section.supabase.getCurrentUser();
        if (!user) {
          alert('Usuário não logado');
          return;
        }

        // Exemplo: salvar em uma tabela personalizada
        const result = await section.supabase.insertData('my_custom_table', {
          user_id: user.id,
          value: parseFloat(value),
          created_at: new Date().toISOString()
        });

        document.getElementById('result').innerHTML = 
          'Salvo com sucesso! ID: ' + result[0].id;
          
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar: ' + error.message);
      }
    }
  `;

  return (
    <HtmlJsSection
      sectionId="advanced-section"
      htmlContent={htmlContent}
      jsContent={jsContent}
      supabaseAccess={true}
    />
  );
};
