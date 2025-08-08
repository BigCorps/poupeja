-- Migração: Criar sistema de planos
-- Data: 2025-08-08
-- Descrição: Cria tabelas para gerenciar planos e suas funcionalidades

-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS poupeja_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10,2) DEFAULT 0,
    price_annual NUMERIC(10,2) DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_annual TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de funcionalidades dos planos
CREATE TABLE IF NOT EXISTS poupeja_plan_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES poupeja_plans(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- Adicionar campo trial_end à tabela poupeja_subscriptions se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'poupeja_subscriptions' 
                   AND column_name = 'trial_end') THEN
        ALTER TABLE poupeja_subscriptions ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Inserir planos padrão
INSERT INTO poupeja_plans (slug, name, description, price_monthly, price_annual, is_active)
VALUES 
    ('free', 'Plano Gratuito', 'Funcionalidades básicas para controle pessoal', 0.00, 0.00, true),
    ('basic', 'Plano Básico', 'Ideal para pessoas físicas com necessidades intermediárias', 19.90, 199.00, true),
    ('premium', 'Plano Premium', 'Completo para empresas e profissionais', 79.90, 799.00, true)
ON CONFLICT (slug) DO NOTHING;

-- Inserir funcionalidades do Plano Gratuito
INSERT INTO poupeja_plan_features (plan_id, feature_key, value)
SELECT 
    p.id,
    feature_key,
    value
FROM poupeja_plans p
CROSS JOIN (
    VALUES 
        ('max_transactions_per_month', '50'),
        ('max_history_months', '3'),
        ('access_dashboard', 'true'),
        ('access_transactions', 'true'),
        ('access_categories', 'true'),
        ('access_goals', 'false'),
        ('access_dfc_daily', 'false'),
        ('access_dfc_monthly', 'false'),
        ('access_dfc_annual', 'false'),
        ('access_dfc_summary', 'false'),
        ('access_reports', 'false'),
        ('access_bank_integration', 'false'),
        ('priority_support', 'false')
) AS features(feature_key, value)
WHERE p.slug = 'free'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Inserir funcionalidades do Plano Básico
INSERT INTO poupeja_plan_features (plan_id, feature_key, value)
SELECT 
    p.id,
    feature_key,
    value
FROM poupeja_plans p
CROSS JOIN (
    VALUES 
        ('max_transactions_per_month', 'unlimited'),
        ('max_history_months', 'unlimited'),
        ('access_dashboard', 'true'),
        ('access_transactions', 'true'),
        ('access_categories', 'true'),
        ('access_goals', 'true'),
        ('access_dfc_daily', 'true'),
        ('access_dfc_monthly', 'true'),
        ('access_dfc_annual', 'false'),
        ('access_dfc_summary', 'false'),
        ('access_reports', 'true'),
        ('access_bank_integration', 'false'),
        ('priority_support', 'false')
) AS features(feature_key, value)
WHERE p.slug = 'basic'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Inserir funcionalidades do Plano Premium
INSERT INTO poupeja_plan_features (plan_id, feature_key, value)
SELECT 
    p.id,
    feature_key,
    value
FROM poupeja_plans p
CROSS JOIN (
    VALUES 
        ('max_transactions_per_month', 'unlimited'),
        ('max_history_months', 'unlimited'),
        ('access_dashboard', 'true'),
        ('access_transactions', 'true'),
        ('access_categories', 'true'),
        ('access_goals', 'true'),
        ('access_dfc_daily', 'true'),
        ('access_dfc_monthly', 'true'),
        ('access_dfc_annual', 'true'),
        ('access_dfc_summary', 'true'),
        ('access_reports', 'true'),
        ('access_bank_integration', 'true'),
        ('priority_support', 'true')
) AS features(feature_key, value)
WHERE p.slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_poupeja_plans_slug ON poupeja_plans(slug);
CREATE INDEX IF NOT EXISTS idx_poupeja_plans_is_active ON poupeja_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_poupeja_plan_features_plan_id ON poupeja_plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_plan_features_feature_key ON poupeja_plan_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_poupeja_subscriptions_plan_type ON poupeja_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_poupeja_subscriptions_status ON poupeja_subscriptions(status);

-- Habilitar RLS nas novas tabelas
ALTER TABLE poupeja_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE poupeja_plan_features ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para poupeja_plans (leitura pública)
CREATE POLICY "Plans are viewable by everyone" ON poupeja_plans
    FOR SELECT USING (is_active = true);

-- Políticas RLS para poupeja_plan_features (leitura pública)
CREATE POLICY "Plan features are viewable by everyone" ON poupeja_plan_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM poupeja_plans 
            WHERE id = plan_id AND is_active = true
        )
    );

-- Comentários para documentação
COMMENT ON TABLE poupeja_plans IS 'Tabela de planos disponíveis no sistema';
COMMENT ON TABLE poupeja_plan_features IS 'Funcionalidades disponíveis para cada plano';
COMMENT ON COLUMN poupeja_plans.slug IS 'Identificador único do plano (free, basic, premium)';
COMMENT ON COLUMN poupeja_plan_features.feature_key IS 'Chave da funcionalidade (ex: access_dfc_daily, max_transactions_per_month)';
COMMENT ON COLUMN poupeja_plan_features.value IS 'Valor da funcionalidade (true/false, número, unlimited)';
