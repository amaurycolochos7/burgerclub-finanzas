import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconPlus, IconTrash } from './Icons'

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
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'cook')
                .order('name')

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
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id)

            if (error) throw error
            setUsers(prev => prev.filter(u => u.id !== id))
        } catch (error) {
            console.error('Error deleting user:', error)
        }
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
            </div>

            {!showForm ? (
                <button
                    className="btn btn-primary btn-full btn-with-icon"
                    onClick={() => setShowForm(true)}
                >
                    <IconPlus />
                    <span>Agregar Cocinero</span>
                </button>
            ) : (
                <div className="user-form">
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            className="input"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre completo"
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
                    <div className="user-form-actions">
                        <button
                            className="btn btn-primary"
                            onClick={addUser}
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowForm(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="users-list">
                {users.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: '2rem' }}>
                        <p>No hay cocineros registrados</p>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="user-card">
                            <div className="user-info">
                                <span className="user-name">{user.name}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => deleteUser(user.id)}
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
