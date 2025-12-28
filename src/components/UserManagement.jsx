import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconPlus, IconTrash, IconUser } from './Icons'

export default function UserManagement() {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            // Primero intentar con filtro de deleted_at
            let { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'cook')
                .is('deleted_at', null)
                .order('name')

            // Si la columna no existe, hacer query sin el filtro
            if (error && error.message && error.message.includes('deleted_at')) {
                const result = await supabase
                    .from('users')
                    .select('*')
                    .eq('role', 'cook')
                    .order('name')

                data = result.data
                error = result.error
            }

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const addUser = async () => {
        if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return

        setSaving(true)

        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    name: newUser.name.trim(),
                    email: newUser.email.trim().toLowerCase(),
                    password: newUser.password,
                    role: 'cook'
                }])
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    alert('Este correo ya está registrado')
                } else {
                    throw error
                }
                return
            }

            setUsers(prev => [...prev, data])
            setNewUser({ name: '', email: '', password: '' })
            setShowForm(false)
        } catch (error) {
            console.error('Error adding user:', error)
            alert('Error al agregar usuario')
        } finally {
            setSaving(false)
        }
    }

    const deleteUser = async (id) => {
        if (!confirm('¿Eliminar este cocinero?')) return

        try {
            // Primero intentar eliminar físicamente
            const { error: hardDeleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', id)

            if (hardDeleteError) {
                // Si hay error de foreign key (tiene ventas asociadas)
                if (hardDeleteError.code === '23503') {
                    // Intentar soft delete (marcar como eliminado)
                    const { error: softDeleteError } = await supabase
                        .from('users')
                        .update({ deleted_at: new Date().toISOString() })
                        .eq('id', id)

                    if (softDeleteError) {
                        // La columna deleted_at no existe, necesita ejecutar el script SQL
                        alert('Este cocinero tiene ventas registradas y no se puede eliminar.\n\nPara habilitar la eliminación, ejecuta el siguiente SQL en Supabase:\n\nALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;')
                        return
                    }
                    // Soft delete exitoso
                    setUsers(prev => prev.filter(u => u.id !== id))
                    return
                }
                throw hardDeleteError
            }

            // Hard delete exitoso
            setUsers(prev => prev.filter(u => u.id !== id))
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error al eliminar el cocinero')
        }
    }

    // Obtener iniciales del nombre
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    // Generar color basado en el nombre
    const getAvatarColor = (name) => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        ]
        const index = name.charCodeAt(0) % colors.length
        return colors[index]
    }

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="app-container">
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Cocineros</h1>
                <span className="header-badge">{users.length}</span>
            </div>

            {/* Stats Card */}
            <div className="cook-stats-card">
                <div className="cook-stats-icon">
                    <IconUser />
                </div>
                <div className="cook-stats-info">
                    <span className="cook-stats-number">{users.length}</span>
                    <span className="cook-stats-label">Cocineros activos</span>
                </div>
            </div>

            {/* Add Button or Form */}
            {!showForm ? (
                <button
                    className="btn btn-primary btn-full btn-with-icon add-cook-btn"
                    onClick={() => setShowForm(true)}
                >
                    <IconPlus />
                    <span>Agregar Cocinero</span>
                </button>
            ) : (
                <div className="cook-form-card">
                    <h3 className="cook-form-title">Nuevo Cocinero</h3>
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            className="input"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre completo"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Correo</label>
                        <input
                            type="email"
                            className="input"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={newUser.password}
                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="cook-form-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowForm(false)
                                setNewUser({ name: '', email: '', password: '' })
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={addUser}
                            disabled={saving || !newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()}
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Section Title */}
            <div className="section-divider">
                <span>LISTA DE COCINEROS</span>
            </div>

            {/* Users List */}
            <div className="cook-list">
                {users.length === 0 ? (
                    <div className="empty-state-card">
                        <div className="empty-state-icon">
                            <IconUser />
                        </div>
                        <p>No hay cocineros registrados</p>
                        <span className="empty-state-hint">Agrega tu primer cocinero usando el botón de arriba</span>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="cook-card">
                            <div
                                className="cook-avatar"
                                style={{ background: getAvatarColor(user.name) }}
                            >
                                {getInitials(user.name)}
                            </div>
                            <div className="cook-info">
                                <span className="cook-name">{user.name}</span>
                                <span className="cook-email">{user.email}</span>
                            </div>
                            <button
                                className="cook-delete-btn"
                                onClick={() => deleteUser(user.id)}
                                title="Eliminar cocinero"
                            >
                                <IconTrash />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
