-- =============================================
-- SISTEMA DE VENTAS NOCTURNAS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla: night_sales (ventas nocturnas enviadas por cocineros)
CREATE TABLE IF NOT EXISTS night_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cook_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Políticas RLS
ALTER TABLE night_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for night_sales" ON night_sales FOR ALL USING (true) WITH CHECK (true);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_night_sales_cook_id ON night_sales(cook_id);
CREATE INDEX IF NOT EXISTS idx_night_sales_status ON night_sales(status);
CREATE INDEX IF NOT EXISTS idx_night_sales_created_at ON night_sales(created_at);
