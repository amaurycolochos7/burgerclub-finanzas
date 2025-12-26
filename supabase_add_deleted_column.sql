-- =============================================
-- AGREGAR COLUMNA: deleted_by_cook
-- Ejecutar en Supabase SQL Editor
-- =============================================

ALTER TABLE kitchen_lists 
ADD COLUMN IF NOT EXISTS deleted_by_cook TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Esto permite que el cocinero "elimine" su lista
-- pero el admin todavía la puede ver marcada como eliminada
