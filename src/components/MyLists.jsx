import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft, IconTrash, IconList } from './Icons'

export default function MyLists() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMyLists()
    }, [])

    const fetchMyLists = async () => {
        try {
            const { data, error } = await supabase
                .from('kitchen_lists')
                .select('*, kitchen_list_items(*)')
                .eq('user_id', user.id)
                .is('deleted_by_cook', null)
                .order('created_at', { ascending: false })

            if (error) throw error
            setLists(data || [])
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    const deleteList = async (listId) => {
        try {
            // Mark as deleted by cook (soft delete)
            await supabase
                .from('kitchen_lists')
                .update({ deleted_by_cook: new Date().toISOString() })
                .eq('id', listId)

            setLists(prev => prev.filter(l => l.id !== listId))
        } catch (error) {
            console.error('Error deleting list:', error)
        }
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const getStockStatus = (quantity) => {
        const qty = quantity?.toString().toLowerCase()
        if (qty === '0' || qty === 'no' || qty === 'nada') return 'critical'
        if (qty === 'poco' || qty === 'bajo' || qty === '1' || qty === '2') return 'low'
        return 'ok'
    }

    const getStatusInfo = (status) => {
        const statuses = {
            pending: { class: 'status-pending', text: 'Pendiente', icon: '⏳' },
            approved: { class: 'status-approved', text: 'Aprobada', icon: '✓' },
            rejected: { class: 'status-rejected', text: 'Rechazada', icon: '✗' }
        }
        return statuses[status] || statuses.pending
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
                <button className="back-btn" onClick={() => navigate('/cocina')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Mis Listas</h1>
            </div>

            {lists.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-icon">
                        <IconList />
                    </div>
                    <p className="empty-title">Sin listas</p>
                    <p className="empty-subtitle">Las listas que crees aparecerán aquí</p>
                </div>
            ) : (
                <div className="cook-lists-container">
                    {lists.map(list => {
                        const statusInfo = getStatusInfo(list.status)
                        return (
                            <div key={list.id} className="cook-list-card">
                                {/* Card Header */}
                                <div className="cook-list-header">
                                    <div className="cook-list-title-group">
                                        <h3 className="cook-list-title">{list.title}</h3>
                                        <p className="cook-list-date">{formatDate(list.target_date)}</p>
                                    </div>
                                    <div className={`cook-list-status ${statusInfo.class}`}>
                                        <span>{statusInfo.text}</span>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="cook-list-items">
                                    <div className="cook-list-table-header">
                                        <span>Producto</span>
                                        <span>Disponible</span>
                                    </div>
                                    {list.kitchen_list_items?.map(item => {
                                        const stockStatus = getStockStatus(item.quantity)
                                        return (
                                            <div key={item.id} className="cook-list-row">
                                                <span className="cook-list-item-name">{item.name}</span>
                                                <span className={`cook-list-item-qty ${stockStatus}`}>{item.quantity}</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Actions */}
                                {list.status === 'pending' && (
                                    <div className="cook-list-actions">
                                        <button
                                            className="cook-list-delete"
                                            onClick={() => deleteList(list.id)}
                                        >
                                            <IconTrash />
                                            <span>Eliminar lista</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
