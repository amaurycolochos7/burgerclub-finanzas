import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCheck, IconClose } from './Icons'

export default function PendingLists() {
    const navigate = useNavigate()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchPendingLists()
    }, [])

    const fetchPendingLists = async () => {
        try {
            const { data, error } = await supabase
                .from('kitchen_lists')
                .select('*, users(name), kitchen_list_items(*)')
                .eq('status', 'pending')
                .order('target_date', { ascending: true })

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
            // Add items to shopping_items
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

            // Update list status
            const { error: updateError } = await supabase
                .from('kitchen_lists')
                .update({ status: 'approved', approved_at: new Date().toISOString() })
                .eq('id', list.id)

            if (updateError) throw updateError

            // Remove from local state
            setLists(prev => prev.filter(l => l.id !== list.id))
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

            setLists(prev => prev.filter(l => l.id !== listId))
        } catch (error) {
            console.error('Error rejecting list:', error)
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
                <h1 className="header-title">Listas Pendientes</h1>
            </div>

            <div className="form-group">
                <label className="form-label">Agregar a lista del día:</label>
                <input
                    type="date"
                    className="input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            {lists.length === 0 ? (
                <div className="empty-state">
                    <p>No hay listas pendientes</p>
                </div>
            ) : (
                <div className="pending-lists">
                    {lists.map(list => (
                        <div key={list.id} className="pending-card">
                            <div className="pending-header">
                                <div>
                                    <h3 className="pending-title">{list.title}</h3>
                                    <p className="pending-meta">
                                        Por: {list.users?.name} • Para: {formatDate(list.target_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="pending-items">
                                {list.kitchen_list_items?.map(item => (
                                    <div key={item.id} className="pending-item">
                                        <span>{item.name}</span>
                                        <span className="pending-qty">{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pending-actions">
                                <button
                                    className="btn btn-success btn-with-icon"
                                    onClick={() => approveList(list)}
                                >
                                    <IconCheck />
                                    <span>Aprobar</span>
                                </button>
                                <button
                                    className="btn btn-danger btn-with-icon"
                                    onClick={() => rejectList(list.id)}
                                >
                                    <IconClose />
                                    <span>Rechazar</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
