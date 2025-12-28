-- =============================================
-- AGREGAR COLUMNA: deleted_at a users
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Esta columna permite "soft delete" de usuarios
-- En lugar de eliminar fisicamente (lo cual falla por foreign keys),
-- marcamos la fecha de eliminación

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para consultas más rápidas
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Ahora los usuarios con deleted_at = NULL son los activos
-- Los usuarios con deleted_at = fecha son los "eliminados"
