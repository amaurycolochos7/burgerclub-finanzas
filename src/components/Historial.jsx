import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconEmpty } from './Icons'

export default function Historial() {
    const navigate = useNavigate()
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedDates, setExpandedDates] = useState({})

    useEffect(() => {
        fetchPurchases()
    }, [])

    const fetchPurchases = async () => {
        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .select('*')
                .order('purchase_date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error

            const grouped = (data || []).reduce((acc, item) => {
                const date = item.purchase_date || 'Sin fecha'
                if (!acc[date]) {
                    acc[date] = []
                }
                acc[date].push(item)
                return acc
            }, {})

            setPurchases(grouped)
        } catch (error) {
            console.error('Error fetching purchases:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleDate = (date) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }))
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    const formatDateDisplay = (dateStr) => {
        if (dateStr === 'Sin fecha') return dateStr
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const getDayTotal = (items) => {
        return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    }

    const getTotalGeneral = () => {
        return Object.values(purchases).flat().reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    }

    const sortedDates = Object.keys(purchases).sort((a, b) => {
        if (a === 'Sin fecha') return 1
        if (b === 'Sin fecha') return -1
        return new Date(b) - new Date(a)
    })

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
                <h1 className="header-title">Historial de Gastos</h1>
            </div>

            {sortedDates.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <IconEmpty />
                    </div>
                    <p>No hay compras registradas</p>
                </div>
            ) : (
                <>
                    <div className="history-list">
                        {sortedDates.map(date => (
                            <div key={date} className="history-day">
                                <button
                                    className="history-day-header"
                                    onClick={() => toggleDate(date)}
                                >
                                    <div className="history-day-info">
                                        <span className="history-day-date">{formatDateDisplay(date)}</span>
                                        <span className="history-day-count">
                                            {purchases[date].length} artículo{purchases[date].length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="history-day-right">
                                        <span className="history-day-total">{formatCurrency(getDayTotal(purchases[date]))}</span>
                                        <span className="history-chevron">{expandedDates[date] ? '▲' : '▼'}</span>
                                    </div>
                                </button>

                                {expandedDates[date] && (
                                    <div className="history-items">
                                        {purchases[date].map(item => (
                                            <div
                                                key={item.id}
                                                className="history-item"
                                                onClick={() => navigate(`/lista?fecha=${date}`)}
                                            >
                                                <span className={`history-item-name ${item.is_completed ? 'completed-text' : ''}`}>
                                                    {item.name}
                                                </span>
                                                <span className="history-item-price">{formatCurrency(item.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="total-general">
                        <span className="total-general-label">Total General</span>
                        <span className="total-general-value">{formatCurrency(getTotalGeneral())}</span>
                    </div>
                </>
            )}
        </div>
    )
}
