import React from 'react';
// Importação do componente que gerencia todas as seções
import HtmlJsSectionManager from './components/htmljs/HtmlJsSectionManager';

// Este componente é a página do seu dashboard
const ExampleDashboardPage = () => {
  // A definição das seções é a parte central.
  // Cada objeto no array representa uma "janela" com seu próprio HTML e JS.
  const sections = [
    {
      id: 'financial-calculator',
      title: 'Calculadora Financeira',
      supabaseAccess: true,
      htmlContent: `
        <div class="financial-calculator">
          <h4>Calculadora de Juros Compostos</h4>
          <div class="form-group">
            <label for="principal">Valor Inicial (R$):</label>
            <input type="number" id="principal" value="1000" />
          </div>
          <div class="form-group">
            <label for="rate">Taxa de Juros (% ao mês):</label>
            <input type="number" id="rate" value="1" step="0.1" />
          </div>
          <div class="form-group">
            <label for="time">Período (meses):</label>
            <input type="number" id="time" value="12" />
          </div>
          <button onclick="calculateCompoundInterest()">Calcular</button>
          <div id="result" class="result"></div>
          <button onclick="saveAsGoal()" id="saveGoalBtn" style="display:none;">
            Salvar como Meta
          </button>
          <div id="message-box" class="message-box"></div>
        </div>
        
        <style>
          .financial-calculator {
            max-width: 400px;
            margin: 0 auto;
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .form-group {
            margin-bottom: 15px;
          }
          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #1e293b;
          }
          .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
          }
          button {
            background-color: #2563eb;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
            font-weight: 600;
            transition: background-color 0.2s;
          }
          button:hover {
            background-color: #1d4ed8;
          }
          .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #e2e8f0;
            border-radius: 6px;
            font-weight: bold;
            color: #1e293b;
          }
          .message-box {
            margin-top: 15px;
            padding: 10px;
            border-radius: 6px;
            font-weight: 500;
            color: white;
            display: none;
          }
          .message-box.success { background-color: #10b981; }
          .message-box.error { background-color: #ef4444; }
        </style>
      `,
      jsContent: `
        let calculationResult = null;
        
        function showMessage(text, type) {
          const messageBox = document.getElementById('message-box');
          messageBox.textContent = text;
          messageBox.className = 'message-box ' + type;
          messageBox.style.display = 'block';
        }

        function calculateCompoundInterest() {
          const principal = parseFloat(document.getElementById('principal').value);
          const rate = parseFloat(document.getElementById('rate').value) / 100;
          const time = parseInt(document.getElementById('time').value);
          
          if (isNaN(principal) || isNaN(rate) || isNaN(time)) {
            showMessage('Por favor, preencha todos os campos com valores válidos.', 'error');
            return;
          }
          
          const amount = principal * Math.pow(1 + rate, time);
          const interest = amount - principal;
          
          calculationResult = {
            principal,
            rate: rate * 100,
            time,
            amount,
            interest
          };
          
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = \`
            <strong>Resultado:</strong><br>
            Valor Final: \${section.utils.formatCurrency(amount)}<br>
            Juros Ganhos: \${section.utils.formatCurrency(interest)}<br>
            Rendimento: \${((interest / principal) * 100).toFixed(2)}%
          \`;
          
          document.getElementById('saveGoalBtn').style.display = 'inline-block';
          
          // Enviar resultado para o dashboard
          section.sendMessage({
            type: 'calculation_completed',
            data: calculationResult
          });
          showMessage('Cálculo realizado com sucesso!', 'success');
        }
        
        async function saveAsGoal() {
          if (!calculationResult) {
            showMessage('Faça um cálculo primeiro!', 'error');
            return;
          }
          
          try {
            const goalData = {
              name: \`Meta de Investimento - \${section.utils.formatCurrency(calculationResult.principal)}\`,
              description: \`Investimento com taxa de \${calculationResult.rate}% ao mês por \${calculationResult.time} meses\`,
              goal_amount: calculationResult.amount,
              current_amount: calculationResult.principal,
              target_date: new Date(Date.now() + calculationResult.time * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              category_id: null
            };
            
            await section.supabase.addGoal(goalData);
            
            showMessage('Meta salva com sucesso!', 'success');
            
            // Notificar o dashboard
            section.sendMessage({
              type: 'goal_created',
              data: goalData
            });
            
          } catch (error) {
            console.error('Erro ao salvar meta:', error);
            showMessage('Erro ao salvar meta. Tente novamente.', 'error');
          }
        }
        
        // Escutar mensagens do dashboard
        section.receiveMessage((message) => {
          console.log('Mensagem recebida na calculadora:', message);
          
          if (message.type === 'update_user_data') {
            // Atualizar dados do usuário se necessário
            console.log('Dados do usuário atualizados');
          }
        });
      `
    },
    {
      id: 'expense-tracker',
      title: 'Rastreador de Gastos Rápido',
      supabaseAccess: true,
      htmlContent: `
        <div class="expense-tracker">
          <h4>Adicionar Gasto Rápido</h4>
          <div class="quick-form">
            <input type="number" id="expenseAmount" placeholder="Valor (R$)" step="0.01" />
            <input type="text" id="expenseDescription" placeholder="Descrição" />
            <select id="expenseCategory">
              <option value="">Selecione uma categoria...</option>
            </select>
            <button onclick="addQuickExpense()">Adicionar Gasto</button>
          </div>
          <div id="recentExpenses" class="recent-expenses">
            <h5>Gastos Recentes</h5>
            <div id="expensesList"></div>
          </div>
          <div id="message-box" class="message-box"></div>
        </div>
        
        <style>
          .expense-tracker {
            max-width: 500px;
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .quick-form {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr auto;
            gap: 10px;
            margin-bottom: 20px;
            align-items: center;
          }
          .quick-form input, .quick-form select {
            padding: 10px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
          }
          .recent-expenses {
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          .expense-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #f1f5f9;
          }
          .expense-item:last-child {
            border-bottom: none;
          }
          .expense-amount {
            font-weight: bold;
            color: #dc2626;
          }
          .expense-description {
            flex-grow: 1;
            margin: 0 10px;
          }
          .expense-date {
            font-size: 0.8em;
            color: #64748b;
          }
          .message-box {
            margin-top: 15px;
            padding: 10px;
            border-radius: 6px;
            font-weight: 500;
            color: white;
            display: none;
          }
          .message-box.success { background-color: #10b981; }
          .message-box.error { background-color: #ef4444; }
        </style>
      `,
      jsContent: `
        let recentExpenses = [];
        
        function showMessage(text, type) {
          const messageBox = document.getElementById('message-box');
          messageBox.textContent = text;
          messageBox.className = 'message-box ' + type;
          messageBox.style.display = 'block';
        }
        
        // Carregar categorias ao inicializar
        async function loadCategories() {
          try {
            const categories = section.appData.categories.filter(cat => 
              cat.type === 'expense' || cat.type === 'operational_outflow'
            );
            
            const select = document.getElementById('expenseCategory');
            select.innerHTML = '<option value="">Selecione uma categoria...</option>';
            
            categories.forEach(category => {
              const option = document.createElement('option');
              option.value = category.id;
              option.textContent = category.name;
              select.appendChild(option);
            });
          } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            showMessage('Erro ao carregar categorias. Verifique a conexão com o Supabase.', 'error');
          }
        }
        
        async function addQuickExpense() {
          const amount = parseFloat(document.getElementById('expenseAmount').value);
          const description = document.getElementById('expenseDescription').value.trim();
          const categoryId = document.getElementById('expenseCategory').value;
          
          if (!amount || amount <= 0) {
            showMessage('Por favor, insira um valor válido.', 'error');
            return;
          }
          
          if (!description) {
            showMessage('Por favor, insira uma descrição.', 'error');
            return;
          }
          
          if (!categoryId) {
            showMessage('Por favor, selecione uma categoria.', 'error');
            return;
          }
          
          try {
            const transactionData = {
              amount: -Math.abs(amount), // Negativo para despesa
              description,
              category_id: categoryId,
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              is_paid: true,
              account_type: section.appData.accountType
            };
            
            await section.supabase.addTransaction(transactionData);
            
            // Adicionar à lista local
            recentExpenses.unshift({
              ...transactionData,
              id: Date.now().toString(),
              created_at: new Date().toISOString()
            });
            
            // Limitar a 5 itens recentes
            recentExpenses = recentExpenses.slice(0, 5);
            
            // Atualizar interface
            updateExpensesList();
            clearForm();
            
            // Notificar o dashboard
            section.sendMessage({
              type: 'expense_added',
              data: transactionData
            });
            
            showMessage('Gasto adicionado com sucesso!', 'success');
            
          } catch (error) {
            console.error('Erro ao adicionar gasto:', error);
            showMessage('Erro ao adicionar gasto. Tente novamente.', 'error');
          }
        }
        
        function updateExpensesList() {
          const list = document.getElementById('expensesList');
          
          if (recentExpenses.length === 0) {
            list.innerHTML = '<p class="text-gray-500">Nenhum gasto recente.</p>';
            return;
          }
          
          list.innerHTML = recentExpenses.map(expense => \`
            <div class="expense-item">
              <span class="expense-amount">\${section.utils.formatCurrency(Math.abs(expense.amount))}</span>
              <span class="expense-description">\${expense.description}</span>
              <span class="expense-date">\${section.utils.formatDate(expense.date)}</span>
            </div>
          \`).join('');
        }
        
        function clearForm() {
          document.getElementById('expenseAmount').value = '';
          document.getElementById('expenseDescription').value = '';
          document.getElementById('expenseCategory').value = '';
        }
        
        // Inicializar
        loadCategories();
        updateExpensesList();
        
        // Escutar atualizações do dashboard
        section.receiveMessage((message) => {
          if (message.type === 'categories_updated') {
            loadCategories();
          }
        });
      `
    },
    {
      id: 'dashboard-summary',
      title: 'Resumo Personalizado',
      supabaseAccess: false, // Apenas leitura dos dados do contexto
      htmlContent: `
        <div class="dashboard-summary">
          <h4>Meu Resumo Financeiro</h4>
          <div class="summary-grid">
            <div class="summary-card income">
              <h5>Receitas do Mês</h5>
              <div class="amount" id="monthlyIncome">R$ 0,00</div>
            </div>
            <div class="summary-card expense">
              <h5>Gastos do Mês</h5>
              <div class="amount" id="monthlyExpense">R$ 0,00</div>
            </div>
            <div class="summary-card balance">
              <h5>Saldo do Mês</h5>
              <div class="amount" id="monthlyBalance">R$ 0,00</div>
            </div>
            <div class="summary-card goals">
              <h5>Metas Ativas</h5>
              <div class="amount" id="activeGoals">0</div>
            </div>
          </div>
          <div class="quick-insights">
            <h5>Insights Rápidos</h5>
            <ul id="insightsList">
              <li>Carregando insights...</li>
            </ul>
          </div>
        </div>
        
        <style>
          .dashboard-summary {
            max-width: 600px;
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .summary-card {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            color: white;
            transition: transform 0.2s;
          }
          .summary-card:hover {
            transform: translateY(-5px);
          }
          .summary-card.income {
            background: linear-gradient(135deg, #16a34a, #22c55e);
          }
          .summary-card.expense {
            background: linear-gradient(135deg, #dc2626, #ef4444);
          }
          .summary-card.balance {
            background: linear-gradient(135deg, #2563eb, #3b82f6);
          }
          .summary-card.goals {
            background: linear-gradient(135deg, #f97316, #f59e0b);
          }
          .summary-card h5 {
            margin: 0 0 10px 0;
            font-size: 0.9em;
            opacity: 0.9;
          }
          .summary-card .amount {
            font-size: 1.5em;
            font-weight: bold;
          }
          .quick-insights {
            background: #e2e8f0;
            padding: 20px;
            border-radius: 12px;
          }
          .quick-insights h5 {
            margin-top: 0;
            color: #1e293b;
            font-size: 1.25em;
          }
          .quick-insights ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: disc;
          }
          .quick-insights li {
            margin-bottom: 8px;
            color: #475569;
          }
        </style>
      `,
      jsContent: `
        function calculateMonthlySummary() {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const transactions = section.appData.transactions || [];
          
          // Filtrar transações do mês atual
          const monthlyTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
          });
          
          // Calcular totais
          let income = 0;
          let expense = 0;
          
          monthlyTransactions.forEach(transaction => {
            if (transaction.amount > 0) {
              income += transaction.amount;
            } else {
              expense += Math.abs(transaction.amount);
            }
          });
          
          const balance = income - expense;
          
          // Atualizar interface
          document.getElementById('monthlyIncome').textContent = section.utils.formatCurrency(income);
          document.getElementById('monthlyExpense').textContent = section.utils.formatCurrency(expense);
          document.getElementById('monthlyBalance').textContent = section.utils.formatCurrency(balance);
          
          // Colorir o saldo baseado no valor
          const balanceElement = document.getElementById('monthlyBalance');
          const balanceCard = balanceElement.closest('.summary-card');
          if (balance >= 0) {
            balanceCard.style.background = 'linear-gradient(135deg, #16a34a, #22c55e)';
          } else {
            balanceCard.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
          }
          
          return { income, expense, balance, transactionCount: monthlyTransactions.length };
        }
        
        function updateGoalsInfo() {
          const goals = section.appData.goals || [];
          const activeGoals = goals.filter(goal => {
            const targetDate = new Date(goal.target_date);
            return targetDate >= new Date();
          });
          
          document.getElementById('activeGoals').textContent = activeGoals.length;
          
          return activeGoals;
        }
        
        function generateInsights() {
          const summary = calculateMonthlySummary();
          const activeGoals = updateGoalsInfo();
          const insights = [];
          
          // Insight sobre saldo
          if (summary.balance > 0) {
            insights.push(\`Parabéns! Você teve um saldo positivo de \${section.utils.formatCurrency(summary.balance)} este mês.\`);
          } else if (summary.balance < 0) {
            insights.push(\`Atenção: Você gastou \${section.utils.formatCurrency(Math.abs(summary.balance))} a mais do que ganhou este mês.\`);
          } else {
            insights.push('Você equilibrou perfeitamente suas receitas e gastos este mês.');
          }
          
          // Insight sobre transações
          if (summary.transactionCount === 0) {
            insights.push('Nenhuma transação registrada este mês. Que tal começar a registrar seus gastos?');
          } else if (summary.transactionCount < 5) {
            insights.push('Poucas transações registradas. Registrar mais movimentações ajuda no controle financeiro.');
          } else {
            insights.push(\`Você registrou \${summary.transactionCount} transações este mês. Ótimo controle!\`);
          }
          
          // Insight sobre metas
          if (activeGoals.length === 0) {
            insights.push('Você não tem metas ativas. Que tal criar uma meta financeira?');
          } else {
            const completedGoals = activeGoals.filter(goal => goal.current_amount >= goal.goal_amount);
            if (completedGoals.length > 0) {
              insights.push(\`Parabéns! Você completou \${completedGoals.length} meta(s)!\`);
            } else {
              insights.push(\`Você tem \${activeGoals.length} meta(s) ativa(s). Continue focado!\`);
            }
          }
          
          // Atualizar lista de insights
          const insightsList = document.getElementById('insightsList');
          insightsList.innerHTML = insights.map(insight => \`<li>\${insight}</li>\`).join('');
        }
        
        // Atualizar dados a cada 30 segundos
        function updateDashboard() {
          generateInsights();
          
          // Enviar estatísticas para o dashboard principal
          section.sendMessage({
            type: 'summary_updated',
            data: {
              summary: calculateMonthlySummary(),
              activeGoals: updateGoalsInfo()
            }
          });
        }
        
        // Inicializar
        updateDashboard();
        
        // Atualizar periodicamente
        setInterval(updateDashboard, 30000);
        
        // Escutar atualizações do dashboard
        section.receiveMessage((message) => {
          if (message.type === 'data_updated') {
            updateDashboard();
          }
        });
      `
    }
  ];

  const handleSectionMessage = (sectionId, message) => {
    console.log(`Mensagem da seção ${sectionId}:`, message);
    
    // Adicione a lógica de reação à mensagem aqui
    switch (message.type) {
      case 'calculation_completed':
        console.log('Cálculo completado na calculadora.');
        break;
      case 'expense_added':
        console.log('Despesa adicionada no rastreador.');
        break;
      case 'goal_created':
        console.log('Nova meta criada na calculadora.');
        break;
      case 'summary_updated':
        console.log('Resumo atualizado.');
        break;
    }
  };

  return (
    <div className="dashboard-page p-8 bg-gray-50 min-h-screen">
      <div className="dashboard-header mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">Dashboard Personalizado</h1>
        <p className="text-gray-600 mt-2">Suas ferramentas financeiras personalizadas</p>
      </div>

      <HtmlJsSectionManager
        sections={sections}
        onSectionMessage={handleSectionMessage}
        className="dashboard-sections grid md:grid-cols-2 lg:grid-cols-3 gap-8"
      />
    </div>
  );
};

export default ExampleDashboardPage;
