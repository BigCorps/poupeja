-- supabase/migrations/20250808000004_add_pj_fields_to_transactions.sql

-- Migração: Adicionar campos para transações PJ
-- Data: 2025-08-08
-- Descrição: Adiciona colunas opcionais à tabela poupeja_transactions para
--            suportar informações detalhadas de Pessoa Jurídica (DFC/DRE).

DO $$
BEGIN
    -- Adicionar as colunas se elas ainda não existirem
    ALTER TABLE poupeja_transactions ADD COLUMN IF NOT EXISTS supplier TEXT;
    ALTER TABLE poupeja_transactions ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
    ALTER TABLE poupeja_transactions ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
    ALTER TABLE poupeja_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT; -- Enum ou simples texto, dependendo do design

    -- Adicionar ou renomear campos de valor, se necessário.
    -- Vamos assumir que 'amount' é o valor pago/recebido.
    -- Para os campos adicionais, podemos ter:
    ALTER TABLE poupeja_transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);
    ALTER TABLE poupeja_transactions ADD COLUMN IF NOT EXISTS late_interest_amount NUMERIC(10, 2);
    -- O 'valor pago' seria o próprio campo 'amount' já existente.

    -- Criar um novo tipo ENUM para o status de pagamento
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_type') THEN
        CREATE TYPE payment_status_type AS ENUM ('pending', 'paid', 'overdue', 'projected');
    END IF;

    -- Alterar a coluna payment_status para usar o novo ENUM
    ALTER TABLE poupeja_transactions
    ALTER COLUMN payment_status TYPE payment_status_type USING payment_status::payment_status_type;

END
$$;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_poupeja_transactions_due_date ON poupeja_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_poupeja_transactions_payment_status ON poupeja_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_poupeja_transactions_supplier ON poupeja_transactions(supplier);
