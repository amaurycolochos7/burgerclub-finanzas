import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconPlus, IconList, IconSend, IconCheck } from './Icons'

export default function CookDashboard() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [salesTotal, setSalesTotal] = useState(0)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch recent lists
            const { data: listsData } = await supabase
                .from('kitchen_lists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            setLists(listsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount || 0)
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
                <button className="btn-text" onClick={() => { logout(); navigate('/login') }}>
                    Salir
                </button>
            </div>

            {/* Quick Actions */}
            <div className="cook-actions">
                <button
                    className="cook-action-btn primary"
                    onClick={() => navigate('/cocina/nueva-lista')}
                >
                    <IconList />
                    <span>Nueva Lista</span>
                </button>
                <button
                    className="cook-action-btn sales"
                    onClick={() => navigate('/cocina/ventas-noche')}
                >
                    <IconSend />
                    <span>Enviar Ventas</span>
                </button>
                <button
                    className="cook-action-btn inventory"
                    onClick={() => navigate('/cocina/inventario')}
                >
                    <IconCheck />
                    <span>Inventario</span>
                </button>
            </div>

            {/* Recent Lists */}
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
                    <div className="empty-state-banking">
                        <IconList style={{ opacity: 0.3, width: 32, height: 32 }} />
                        <p style={{ marginTop: 10 }}>No has creado listas aún</p>
                    </div>
                ) : (
                    <div className="dashboard-list-container">
                        {lists.map(list => {
                            const badge = getStatusBadge(list.status)
                            return (
                                <div key={list.id} className="dashboard-list-item" onClick={() => navigate(`/cocina/lista/${list.id}`)}>
                                    <div className="dashboard-icon-box">
                                        <IconList />
                                    </div>
                                    <div className="dashboard-item-details">
                                        <span className="dashboard-item-title">{list.title}</span>
                                        <span className="dashboard-item-subtitle">{formatDate(list.target_date)}</span>
                                    </div>
                                    <div className="dashboard-item-status">
                                        <span className={`status-pill ${badge.class}`}>
                                            {badge.text}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
