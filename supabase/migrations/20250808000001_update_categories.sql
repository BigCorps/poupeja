-- Migração: Atualizar categorias existentes para suportar tipos de fluxo de caixa
-- Data: 2025-08-08
-- Descrição: Adiciona novos tipos de categoria para classificação de fluxo de caixa

-- Primeiro, vamos verificar se o tipo enum existe e adicionar os novos valores
DO $$
BEGIN
    -- Adicionar novos valores ao enum category_type se ele existir
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
        -- Adicionar novos valores para fluxo de caixa
        ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'operational_inflow';
        ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'operational_outflow';
        ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'investment_inflow';
        ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'investment_outflow';
        ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'financing_inflow';
        ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'financing_outflow';
    ELSE
        -- Se o enum não existir, criar com todos os valores
        CREATE TYPE category_type AS ENUM (
            'income',
            'expense',
            'operational_inflow',
            'operational_outflow',
            'investment_inflow',
            'investment_outflow',
            'financing_inflow',
            'financing_outflow'
        );
    END IF;
END
$$;

-- Inserir categorias padrão para fluxo de caixa se não existirem
INSERT INTO poupeja_categories (id, user_id, name, type, color, icon, is_default, created_at)
VALUES 
    -- Atividades Operacionais - Entradas
    (gen_random_uuid(), NULL, 'Receita de Vendas', 'operational_inflow', '#10B981', 'TrendingUp', true, NOW()),
    (gen_random_uuid(), NULL, 'Receita de Serviços', 'operational_inflow', '#10B981', 'Briefcase', true, NOW()),
    (gen_random_uuid(), NULL, 'Recebimento de Clientes', 'operational_inflow', '#10B981', 'Users', true, NOW()),
    (gen_random_uuid(), NULL, 'Outras Receitas Operacionais', 'operational_inflow', '#10B981', 'Plus', true, NOW()),
    
    -- Atividades Operacionais - Saídas
    (gen_random_uuid(), NULL, 'Pagamento a Fornecedores', 'operational_outflow', '#EF4444', 'Truck', true, NOW()),
    (gen_random_uuid(), NULL, 'Salários e Encargos', 'operational_outflow', '#EF4444', 'Users', true, NOW()),
    (gen_random_uuid(), NULL, 'Aluguel', 'operational_outflow', '#EF4444', 'Home', true, NOW()),
    (gen_random_uuid(), NULL, 'Energia Elétrica', 'operational_outflow', '#EF4444', 'Zap', true, NOW()),
    (gen_random_uuid(), NULL, 'Telefone/Internet', 'operational_outflow', '#EF4444', 'Phone', true, NOW()),
    (gen_random_uuid(), NULL, 'Marketing e Publicidade', 'operational_outflow', '#EF4444', 'Megaphone', true, NOW()),
    (gen_random_uuid(), NULL, 'Impostos Operacionais', 'operational_outflow', '#EF4444', 'FileText', true, NOW()),
    (gen_random_uuid(), NULL, 'Outras Despesas Operacionais', 'operational_outflow', '#EF4444', 'Minus', true, NOW()),
    
    -- Atividades de Investimento - Entradas
    (gen_random_uuid(), NULL, 'Venda de Ativos Fixos', 'investment_inflow', '#3B82F6', 'Building', true, NOW()),
    (gen_random_uuid(), NULL, 'Recebimento de Dividendos', 'investment_inflow', '#3B82F6', 'DollarSign', true, NOW()),
    (gen_random_uuid(), NULL, 'Venda de Investimentos', 'investment_inflow', '#3B82F6', 'TrendingUp', true, NOW()),
    
    -- Atividades de Investimento - Saídas
    (gen_random_uuid(), NULL, 'Compra de Equipamentos', 'investment_outflow', '#F59E0B', 'Monitor', true, NOW()),
    (gen_random_uuid(), NULL, 'Compra de Móveis', 'investment_outflow', '#F59E0B', 'Package', true, NOW()),
    (gen_random_uuid(), NULL, 'Investimentos Financeiros', 'investment_outflow', '#F59E0B', 'PieChart', true, NOW()),
    (gen_random_uuid(), NULL, 'Outras Aplicações', 'investment_outflow', '#F59E0B', 'Target', true, NOW()),
    
    -- Atividades de Financiamento - Entradas
    (gen_random_uuid(), NULL, 'Empréstimos Recebidos', 'financing_inflow', '#8B5CF6', 'CreditCard', true, NOW()),
    (gen_random_uuid(), NULL, 'Aporte de Capital', 'financing_inflow', '#8B5CF6', 'Wallet', true, NOW()),
    (gen_random_uuid(), NULL, 'Financiamentos', 'financing_inflow', '#8B5CF6', 'Building2', true, NOW()),
    
    -- Atividades de Financiamento - Saídas
    (gen_random_uuid(), NULL, 'Pagamento de Empréstimos', 'financing_outflow', '#EC4899', 'CreditCard', true, NOW()),
    (gen_random_uuid(), NULL, 'Pagamento de Financiamentos', 'financing_outflow', '#EC4899', 'Building2', true, NOW()),
    (gen_random_uuid(), NULL, 'Distribuição de Lucros', 'financing_outflow', '#EC4899', 'Share', true, NOW()),
    (gen_random_uuid(), NULL, 'Juros Pagos', 'financing_outflow', '#EC4899', 'Percent', true, NOW())
ON CONFLICT DO NOTHING;

-- Criar índices para otimizar consultas de fluxo de caixa
CREATE INDEX IF NOT EXISTS idx_poupeja_categories_type ON poupeja_categories(type);
CREATE INDEX IF NOT EXISTS idx_poupeja_categories_is_default ON poupeja_categories(is_default);

-- Comentários para documentação
COMMENT ON COLUMN poupeja_categories.type IS 'Tipo da categoria: income, expense, operational_inflow, operational_outflow, investment_inflow, investment_outflow, financing_inflow, financing_outflow';
