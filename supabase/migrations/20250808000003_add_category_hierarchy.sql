-- Migração OPCIONAL: Adicionar hierarquia de categorias (Abordagem 2)
-- Data: 2025-08-08
-- Descrição: Adiciona campo parent_id para criar hierarquia de categorias/subcategorias
-- NOTA: Esta migração é opcional. Use apenas se quiser implementar hierarquia real no banco.

-- Adicionar campo parent_id para criar hierarquia
ALTER TABLE poupeja_categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES poupeja_categories(id) ON DELETE SET NULL;

-- Criar índice para otimizar consultas hierárquicas
CREATE INDEX IF NOT EXISTS idx_poupeja_categories_parent_id ON poupeja_categories(parent_id);

-- Adicionar campo para ordenação dentro do mesmo nível
ALTER TABLE poupeja_categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_poupeja_categories_sort_order ON poupeja_categories(sort_order);

-- Função para buscar categorias com hierarquia (CTE recursiva)
CREATE OR REPLACE FUNCTION get_category_hierarchy(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    color TEXT,
    icon TEXT,
    parent_id UUID,
    level INTEGER,
    path TEXT,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Categorias raiz (sem parent_id)
        SELECT 
            c.id,
            c.name,
            c.type::TEXT,
            c.color,
            c.icon,
            c.parent_id,
            0 as level,
            c.name as path,
            c.sort_order
        FROM poupeja_categories c
        WHERE c.parent_id IS NULL
        AND (user_uuid IS NULL OR c.user_id = user_uuid OR c.is_default = true)
        
        UNION ALL
        
        -- Subcategorias (com parent_id)
        SELECT 
            c.id,
            c.name,
            c.type::TEXT,
            c.color,
            c.icon,
            c.parent_id,
            ct.level + 1,
            ct.path || ' > ' || c.name,
            c.sort_order
        FROM poupeja_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE (user_uuid IS NULL OR c.user_id = user_uuid OR c.is_default = true)
    )
    SELECT * FROM category_tree
    ORDER BY level, sort_order, name;
END;
$$ LANGUAGE plpgsql;

-- Exemplos de inserção de categorias hierárquicas
-- (Descomente e ajuste conforme necessário)

/*
-- Inserir categorias principais
INSERT INTO poupeja_categories (id, user_id, name, type, color, icon, is_default, sort_order, created_at)
VALUES 
    (gen_random_uuid(), NULL, 'EMBALAGENS', 'operational_outflow', '#FF6B6B', 'Package', true, 1, NOW()),
    (gen_random_uuid(), NULL, 'MARKETING', 'operational_outflow', '#4ECDC4', 'Megaphone', true, 2, NOW()),
    (gen_random_uuid(), NULL, 'DESPESA COM PESSOAL', 'operational_outflow', '#45B7D1', 'Users', true, 3, NOW())
ON CONFLICT DO NOTHING;

-- Inserir subcategorias de EMBALAGENS
INSERT INTO poupeja_categories (id, user_id, name, type, color, icon, is_default, parent_id, sort_order, created_at)
SELECT 
    gen_random_uuid(), 
    NULL, 
    subcategory_name, 
    'operational_outflow', 
    '#FF6B6B', 
    'Package', 
    true, 
    emb.id, 
    row_number() OVER (),
    NOW()
FROM (
    SELECT id FROM poupeja_categories WHERE name = 'EMBALAGENS' AND parent_id IS NULL LIMIT 1
) emb
CROSS JOIN (
    VALUES 
        ('ADESIVOS'),
        ('CAIXA E-COMMERCE'),
        ('LACRE (CORDÃO)'),
        ('PAPEL SEDA'),
        ('SACOLAS PONTO FÍSICO'),
        ('SAQUINHO ALGODÃO'),
        ('TAG/ETIQUETA')
) AS subcats(subcategory_name)
ON CONFLICT DO NOTHING;

-- Inserir subcategorias de MARKETING
INSERT INTO poupeja_categories (id, user_id, name, type, color, icon, is_default, parent_id, sort_order, created_at)
SELECT 
    gen_random_uuid(), 
    NULL, 
    subcategory_name, 
    'operational_outflow', 
    '#4ECDC4', 
    'Megaphone', 
    true, 
    mkt.id, 
    row_number() OVER (),
    NOW()
FROM (
    SELECT id FROM poupeja_categories WHERE name = 'MARKETING' AND parent_id IS NULL LIMIT 1
) mkt
CROSS JOIN (
    VALUES 
        ('CONSUMO CLIENTES'),
        ('BRINDES'),
        ('CAMPANHAS COMERCIAIS'),
        ('CRIAÇÃO DE CONTEÚDO'),
        ('EVENTOS COMERCIAIS'),
        ('GESTOR DE TRÁFEGO - FIXO'),
        ('TRÁFEGO PAGO - META, GOOGLE, MARKTPLACE'),
        ('OUTRAS DESPESAS COM MARKETING')
) AS subcats(subcategory_name)
ON CONFLICT DO NOTHING;

-- Inserir subcategorias de DESPESA COM PESSOAL
INSERT INTO poupeja_categories (id, user_id, name, type, color, icon, is_default, parent_id, sort_order, created_at)
SELECT 
    gen_random_uuid(), 
    NULL, 
    subcategory_name, 
    'operational_outflow', 
    '#45B7D1', 
    'Users', 
    true, 
    dp.id, 
    row_number() OVER (),
    NOW()
FROM (
    SELECT id FROM poupeja_categories WHERE name = 'DESPESA COM PESSOAL' AND parent_id IS NULL LIMIT 1
) dp
CROSS JOIN (
    VALUES 
        ('13º SALÁRIO'),
        ('CONFRATERNIZAÇÃO / OUTROS INCENTIVOS AOS COLABORADORES'),
        ('CONVÊNIO MÉDICO'),
        ('CURSOS/ TREINAMENTOS'),
        ('EXAME LABORATORIAIS'),
        ('FÉRIAS'),
        ('FGTS'),
        ('FGTS MULTA'),
        ('HORA EXTRA'),
        ('DARF PREVIDENCIÁRIO - INSS E IRRF'),
        ('PESSOAL TEMPORÁRIO'),
        ('PRÊMIO EQUIPE'),
        ('RESCISÃO'),
        ('SALÁRIOS'),
        ('SEGURO DE VIDA')
) AS subcats(subcategory_name)
ON CONFLICT DO NOTHING;
*/

-- Comentários para documentação
COMMENT ON COLUMN poupeja_categories.parent_id IS 'ID da categoria pai para criar hierarquia (NULL para categorias raiz)';
COMMENT ON COLUMN poupeja_categories.sort_order IS 'Ordem de exibição dentro do mesmo nível hierárquico';
COMMENT ON FUNCTION get_category_hierarchy IS 'Função para buscar categorias com hierarquia usando CTE recursiva';
