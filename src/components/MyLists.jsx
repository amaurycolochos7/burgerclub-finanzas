import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft } from './Icons'

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
                .order('created_at', { ascending: false })

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
            weekday: 'long',
            day: 'numeric',
            month: 'long'
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
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/cocina')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Mis Listas</h1>
            </div>

            {lists.length === 0 ? (
                <div className="empty-state">
                    <p>No has creado listas aún</p>
                </div>
            ) : (
                <div className="my-lists">
                    {lists.map(list => {
                        const badge = getStatusBadge(list.status)
                        return (
                            <div key={list.id} className="my-list-card">
                                <div className="my-list-header">
                                    <div>
                                        <h3 className="my-list-title">{list.title}</h3>
                                        <p className="my-list-date">{formatDate(list.target_date)}</p>
                                    </div>
                                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                                </div>
                                <div className="my-list-items">
                                    {list.kitchen_list_items?.map(item => (
                                        <div key={item.id} className="my-list-item">
                                            <span>{item.name}</span>
                                            <span className="item-qty">{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
