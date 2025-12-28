import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCart, IconCheck, IconClose, IconInbox } from './Icons'

export default function Movements() {
    const navigate = useNavigate()
    const [movements, setMovements] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMovements()
    }, [])

    const fetchMovements = async () => {
        try {
            // 2. Fetch Shopping Items
            const { data: itemsData } = await supabase
                .from('shopping_items')
                .select('*')
                .order('purchase_date', { ascending: false })

            // 3. Fetch Payroll
            const { data: payrollData } = await supabase
                .from('payroll')
                .select('*, users(name)')
                .order('payment_date', { ascending: false })

            // 4. Build Unified Movements List
            const combinedMovements = []

            // A. Group shopping items by date
            const safeItems = Array.isArray(itemsData) ? itemsData : []

            const itemsByDate = safeItems.reduce((acc, item) => {
                const date = item.purchase_date
                if (!acc[date]) {
                    acc[date] = { count: 0, total: 0, items: [] }
                }
                acc[date].count += 1
                acc[date].total += parseFloat(item.price) || 0
                acc[date].items.push(item)
                return acc
            }, {})

            if (itemsByDate && typeof itemsByDate === 'object') {
                Object.keys(itemsByDate).forEach(date => {
                    combinedMovements.push({
                        type: 'shopping',
                        id: `shopping-${date}`,
                        date: date,
                        title: 'Lista de Compras',
                        amount: itemsByDate[date].total,
                        details: `${itemsByDate[date].count} items`
                    })
                })
            }

            // B. Add payroll records
            const safePayroll = Array.isArray(payrollData) ? payrollData : []

            safePayroll.forEach(pay => {
                combinedMovements.push({
                    type: 'payroll',
                    id: pay.id,
                    date: pay.payment_date,
                    title: pay.users?.name || 'Nómina', // Simplified title
                    amount: parseFloat(pay.amount),
                    details: pay.notes || 'Sin notas',
                    isIncome: false
                })
            })

            // C. Fetch accepted night sales (income)
            const { data: nightSalesData } = await supabase
                .from('night_sales')
                .select('*, users:cook_id(name)')
                .eq('status', 'accepted')
                .order('accepted_at', { ascending: false })

            const safeNightSales = Array.isArray(nightSalesData) ? nightSalesData : []

            safeNightSales.forEach(sale => {
                combinedMovements.push({
                    type: 'night_sale',
                    id: sale.id,
                    date: sale.accepted_at,
                    title: sale.users?.name || 'Venta Nocturna', // Simplified title
                    amount: parseFloat(sale.total_amount),
                    details: sale.description || 'Sin detalles',
                    isIncome: true
                })
            })

            // Sort by date desc
            combinedMovements.sort((a, b) => new Date(b.date) - new Date(a.date))
            setMovements(combinedMovements)
        } catch (error) {
            console.error('Error fetching movements:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este movimiento?')) return

        try {
            const { error } = await supabase
                .from('payroll')
                .delete()
                .eq('id', id)

            if (error) throw error

            setMovements(movements.filter(m => m.id !== id))
        } catch (error) {
            console.error('Error deleting movement:', error)
            alert('Error al eliminar el movimiento')
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    const formatDate = (dateStr) => {
        // Short format: "28 Dic"
        const date = new Date(dateStr)
        const day = date.getDate()
        const month = date.toLocaleDateString('es-MX', { month: 'short' })
        // Capitalize month
        const monthCap = month.charAt(0).toUpperCase() + month.slice(1)
        return `${day} ${monthCap}`
    }

    const formatTime = (dateStr) => {
        // If it looks like a date-only string (YYYY-MM-DD), don't show specific time or show 00:00 if desired.
        // But assuming most have timestamps.
        const date = new Date(dateStr)
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toLowerCase()
    }

    const [expandedId, setExpandedId] = useState(null)

    const toggleExpand = (id, type, date) => {
        if (type === 'shopping') {
            navigate(`/lista?fecha=${date}`)
        } else {
            setExpandedId(expandedId === id ? null : id)
        }
    }

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        )
    }

    return (
        <div className="app-container">
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Movimientos</h1>
            </div>

            <div className="movements-list-refined">
                {movements.length === 0 ? (
                    <div className="empty-state-banking">
                        <p>No hay movimientos registrados</p>
                    </div>
                ) : (
                    movements.map(mov => (
                        <div key={mov.id} className={`movement-card-refined ${expandedId === mov.id ? 'expanded' : ''}`}>
                            <div
                                className="refined-card-content"
                                onClick={() => toggleExpand(mov.id, mov.type, mov.date)}
                            >
                                <div className="refined-icon-box">
                                    {mov.type === 'shopping' ? <IconCart /> :
                                        mov.type === 'night_sale' ? <IconInbox /> : <IconCheck />}
                                </div>

                                <div className="refined-info">
                                    <span className="refined-title">{mov.title}</span>
                                    <span className="refined-date">
                                        {formatDate(mov.date)} • {formatTime(mov.date)}
                                    </span>
                                </div>

                                <div className="refined-amount-box">
                                    <span className={`refined-amount ${mov.isIncome ? 'positive' : 'negative'}`}>
                                        {mov.isIncome ? '+' : '-'}{formatCurrency(mov.amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === mov.id && (
                                <div className="refined-details-panel">
                                    <div className="refined-detail-row">
                                        <span>Fecha:</span>
                                        <span className="capitalize">{formatDate(mov.date)}</span>
                                    </div>
                                    <div className="refined-detail-row">
                                        <span>Hora:</span>
                                        <span className="capitalize">{formatTime(mov.date)}</span>
                                    </div>
                                    {mov.details && (
                                        <div className="refined-detail-note">
                                            "{mov.details}"
                                        </div>
                                    )}

                                    {mov.type === 'payroll' && (
                                        <div className="refined-actions-row">
                                            <button
                                                className="link-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(mov.id)
                                                }}
                                            >
                                                Eliminar registro
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
