-- =============================================
-- SISTEMA MULTI-USUARIO: TABLAS ADICIONALES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla: users (usuarios del sistema)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cook' CHECK (role IN ('admin', 'cook')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla: kitchen_lists (listas de cocina)
CREATE TABLE IF NOT EXISTS kitchen_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- 3. Tabla: kitchen_list_items (items de lista de cocina)
CREATE TABLE IF NOT EXISTS kitchen_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES kitchen_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity TEXT,
    estimated_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Políticas RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_list_items ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para esta app simple
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for kitchen_lists" ON kitchen_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for kitchen_list_items" ON kitchen_list_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_kitchen_lists_user_id ON kitchen_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_lists_status ON kitchen_lists(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_list_items_list_id ON kitchen_list_items(list_id);

-- 6. Insertar usuario admin por defecto
INSERT INTO users (email, password, name, role) 
VALUES ('admin@burgerclub.com', 'admin123', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;
