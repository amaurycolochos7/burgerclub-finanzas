import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCheck, IconClose, IconList, IconTrash, IconPlus } from './Icons'

export default function PendingLists() {
    const navigate = useNavigate()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [filter, setFilter] = useState('all')
    const [deleteModal, setDeleteModal] = useState(null) // holds the list to delete

    useEffect(() => {
        fetchLists()
    }, [])

    const fetchLists = async () => {
        try {
            const { data, error } = await supabase
                .from('kitchen_lists')
                .select('*, users(name), kitchen_list_items(*)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLists(data || [])
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    const approveList = async (list) => {
        try {
            const shoppingItems = list.kitchen_list_items.map(item => ({
                name: `${item.name} (${item.quantity})`,
                price: item.estimated_price || 0,
                is_completed: false,
                purchase_date: selectedDate
            }))

            const { error: itemsError } = await supabase
                .from('shopping_items')
                .insert(shoppingItems)

            if (itemsError) throw itemsError

            const { error: updateError } = await supabase
                .from('kitchen_lists')
                .update({ status: 'approved', approved_at: new Date().toISOString() })
                .eq('id', list.id)

            if (updateError) throw updateError

            setLists(prev => prev.map(l =>
                l.id === list.id ? { ...l, status: 'approved', approved_at: new Date().toISOString() } : l
            ))
        } catch (error) {
            console.error('Error approving list:', error)
            alert('Error al aprobar la lista')
        }
    }

    const rejectList = async (listId) => {
        try {
            const { error } = await supabase
                .from('kitchen_lists')
                .update({ status: 'rejected' })
                .eq('id', listId)

            if (error) throw error

            setLists(prev => prev.map(l =>
                l.id === listId ? { ...l, status: 'rejected' } : l
            ))
        } catch (error) {
            console.error('Error rejecting list:', error)
        }
    }

    const handleDeleteOption = async (option) => {
        if (!deleteModal) return

        if (option === 'readd') {
            // Re-add items to shopping list then delete
            const shoppingItems = deleteModal.kitchen_list_items.map(item => ({
                name: `${item.name} (${item.quantity})`,
                price: item.estimated_price || 0,
                is_completed: false,
                purchase_date: selectedDate
            }))

            await supabase.from('shopping_items').insert(shoppingItems)
        }

        // Delete from database
        await supabase.from('kitchen_list_items').delete().eq('list_id', deleteModal.id)
        await supabase.from('kitchen_lists').delete().eq('id', deleteModal.id)

        setLists(prev => prev.filter(l => l.id !== deleteModal.id))
        setDeleteModal(null)
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const getStockStatus = (quantity) => {
        const qty = quantity?.toString().toLowerCase()
        if (qty === '0' || qty === 'no' || qty === 'nada') return 'critical'
        if (qty === 'poco' || qty === 'bajo' || qty === '1' || qty === '2') return 'low'
        return 'ok'
    }

    const filteredLists = lists.filter(list => {
        if (filter === 'all') return true
        return list.status === filter
    })

    const pendingCount = lists.filter(l => l.status === 'pending').length

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
            {/* Delete Modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">¿Qué quieres hacer?</h3>
                        <p className="modal-subtitle">Lista: {deleteModal.title}</p>

                        <div className="modal-options">
                            <button
                                className="modal-option readd"
                                onClick={() => handleDeleteOption('readd')}
                            >
                                <IconPlus />
                                <div>
                                    <span className="option-title">Agregar a compras y eliminar</span>
                                    <span className="option-desc">Los items se agregarán a la lista de compras</span>
                                </div>
                            </button>

                            <button
                                className="modal-option delete"
                                onClick={() => handleDeleteOption('delete')}
                            >
                                <IconTrash />
                                <div>
                                    <span className="option-title">Eliminar definitivamente</span>
                                    <span className="option-desc">La lista se borrará sin agregar nada</span>
                                </div>
                            </button>
                        </div>

                        <button className="modal-cancel" onClick={() => setDeleteModal(null)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Listas de Cocina</h1>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pendientes {pendingCount > 0 && <span className="filter-count">{pendingCount}</span>}
                </button>
                <button
                    className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Aprobadas
                </button>
            </div>

            {/* Date Picker */}
            <div className="date-picker-card">
                <div className="date-picker-info">
                    <span className="date-picker-label">Agregar a compras del</span>
                    <input
                        type="date"
                        className="date-picker-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {filteredLists.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-icon">
                        <IconList />
                    </div>
                    <p className="empty-title">Sin listas</p>
                    <p className="empty-subtitle">Las listas de cocina aparecerán aquí</p>
                </div>
            ) : (
                <div className="pending-list-container">
                    {filteredLists.map(list => (
                        <div key={list.id} className={`pending-card-new status-${list.status}`}>
                            {/* Status Banner */}
                            {list.status === 'approved' && (
                                <div className="status-banner approved">
                                    <IconCheck />
                                    <span>Aprobada y agregada a lista de compras</span>
                                </div>
                            )}
                            {list.status === 'rejected' && (
                                <div className="status-banner rejected">
                                    <IconClose />
                                    <span>Lista rechazada</span>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="pending-card-header">
                                <div className="pending-card-title-group">
                                    <h3 className="pending-card-title">{list.title}</h3>
                                    <div className="pending-card-meta">
                                        <span className="pending-card-author">{list.users?.name}</span>
                                        <span className="pending-card-separator">•</span>
                                        <span className="pending-card-date">{formatDate(list.target_date)}</span>
                                    </div>
                                </div>
                                <span className="pending-card-count">{list.kitchen_list_items?.length} items</span>
                            </div>

                            {/* Items Table */}
                            <div className="pending-items-table">
                                <div className="pending-items-header-row">
                                    <span>Producto</span>
                                    <span>Disponible</span>
                                </div>
                                {list.kitchen_list_items?.map(item => {
                                    const status = getStockStatus(item.quantity)
                                    return (
                                        <div key={item.id} className="pending-item-row">
                                            <span className="pending-item-name">{item.name}</span>
                                            <span className={`pending-item-stock ${status}`}>{item.quantity}</span>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Actions */}
                            <div className="pending-card-actions">
                                {list.status === 'pending' ? (
                                    <>
                                        <button className="pending-btn approve" onClick={() => approveList(list)}>
                                            <IconCheck />
                                            <span>Aprobar</span>
                                        </button>
                                        <button className="pending-btn reject" onClick={() => rejectList(list.id)}>
                                            <IconClose />
                                            <span>Rechazar</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="pending-btn delete-list"
                                        onClick={() => setDeleteModal(list)}
                                    >
                                        <IconTrash />
                                        <span>Eliminar de la lista</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
