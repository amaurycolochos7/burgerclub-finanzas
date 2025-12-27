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
                    title: `Pago Nómina: ${pay.users?.name}`,
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
                    title: `Envío de: ${sale.users?.name || 'Cocinero'}`,
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
        return new Date(dateStr).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
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

            <div className="movements-list">
                {movements.length === 0 ? (
                    <div className="empty-state">No hay movimientos registrados</div>
                ) : (
                    movements.map(mov => (
                        <div key={mov.id} className={`movement-card-wrapper ${expandedId === mov.id ? 'expanded' : ''}`}>
                            <div
                                className="movement-card"
                                onClick={() => toggleExpand(mov.id, mov.type, mov.date)}
                            >
                                <div className="movement-icon">
                                    {mov.type === 'shopping' ? <IconCart /> :
                                        mov.type === 'night_sale' ? <IconInbox /> : <IconCheck />}
                                </div>
                                <div className="movement-info">
                                    <span className="movement-title">{mov.title}</span>
                                    <span className="movement-date capitalize">{formatDate(mov.date)}</span>
                                </div>
                                <div className={`movement-amount ${mov.isIncome ? 'positive' : 'negative'}`}>
                                    {mov.isIncome ? '+' : '-'}{formatCurrency(mov.amount)}
                                </div>
                                {mov.type === 'payroll' && (
                                    <button
                                        className="delete-btn-small"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(mov.id)
                                        }}
                                        title="Eliminar movimiento"
                                    >
                                        <IconClose />
                                    </button>
                                )}
                            </div>

                            {/* Expanded Details Panel */}
                            {expandedId === mov.id && (
                                <div className="movement-details">
                                    <div className="movement-details-row">
                                        <span className="movement-details-label">Monto:</span>
                                        <span className={`movement-details-value ${mov.isIncome ? 'positive' : 'negative'}`}>
                                            {mov.isIncome ? '+' : '-'}{formatCurrency(mov.amount)}
                                        </span>
                                    </div>
                                    <div className="movement-details-row">
                                        <span className="movement-details-label">Fecha:</span>
                                        <span className="movement-details-value capitalize">{formatDate(mov.date)}</span>
                                    </div>
                                    {mov.details && (
                                        <div className="movement-details-notes">
                                            <span className="movement-details-label">Detalles:</span>
                                            <p className="movement-details-text">{mov.details}</p>
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
