import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconPlus, IconList, IconArrowRight } from './Icons'

export default function CookDashboard() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMyLists()
    }, [])

    const fetchMyLists = async () => {
        try {
            const { data, error } = await supabase
                .from('kitchen_lists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (error) throw error
            setLists(data || [])
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-pending', text: 'Pendiente' },
            approved: { class: 'badge-approved', text: 'Aprobada' },
            rejected: { class: 'badge-rejected', text: 'Rechazada' }
        }
        return badges[status] || badges.pending
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
            <div className="cook-header">
                <div>
                    <p className="cook-greeting">Hola, {user.name}</p>
                    <p className="cook-role">Cocinero</p>
                </div>
                <button className="btn-text" onClick={logout}>
                    Salir
                </button>
            </div>

            <button
                className="cook-main-action"
                onClick={() => navigate('/cocina/nueva-lista')}
            >
                <div className="cook-action-icon">
                    <IconPlus />
                </div>
                <div className="cook-action-text">
                    <span className="cook-action-title">Nueva Lista</span>
                    <span className="cook-action-subtitle">Crear lista para mañana</span>
                </div>
            </button>

            <div className="cook-section">
                <div className="cook-section-header">
                    <h2 className="cook-section-title">Mis Listas</h2>
                    <button
                        className="btn-text-small"
                        onClick={() => navigate('/cocina/mis-listas')}
                    >
                        Ver todas
                    </button>
                </div>

                {lists.length === 0 ? (
                    <div className="cook-empty">
                        <p>No has creado listas aún</p>
                    </div>
                ) : (
                    <div className="cook-lists">
                        {lists.map(list => {
                            const badge = getStatusBadge(list.status)
                            return (
                                <div key={list.id} className="cook-list-item">
                                    <div className="cook-list-info">
                                        <span className="cook-list-title">{list.title}</span>
                                        <span className="cook-list-date">{formatDate(list.target_date)}</span>
                                    </div>
                                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
