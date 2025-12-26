-- =============================================
-- SUPABASE SQL SCRIPT - Shopping List App
-- =============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Tabla: capital
CREATE TABLE IF NOT EXISTS capital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar capital inicial
INSERT INTO capital (amount) VALUES (5000.00);

-- 2. Tabla: shopping_items
CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Habilitar Row Level Security
ALTER TABLE capital ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (acceso público para esta app simple)
CREATE POLICY "Allow all access to capital" ON capital
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to shopping_items" ON shopping_items
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para capital
CREATE TRIGGER update_capital_updated_at
    BEFORE UPDATE ON capital
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Índice para búsqueda por fecha
CREATE INDEX IF NOT EXISTS idx_shopping_items_purchase_date 
ON shopping_items(purchase_date);

-- =============================================
-- SI YA TIENES LA TABLA, EJECUTA ESTO PARA AGREGAR LA COLUMNA:
-- =============================================
-- ALTER TABLE shopping_items 
-- ADD COLUMN IF NOT EXISTS purchase_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
