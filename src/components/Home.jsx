import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconChart, IconCart, IconEdit, IconCheck, IconClose, IconArrowRight, IconList } from './Icons'

export default function Home() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [capital, setCapital] = useState(null)
    const [totalGasto, setTotalGasto] = useState(0)
    const [gastoHoy, setGastoHoy] = useState(0)
    const [incomeTotal, setIncomeTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState('')

    // Unified movements state
    const [movements, setMovements] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // 1. Fetch Capital
            const { data: capitalData, error: capitalError } = await supabase
                .from('capital')
                .select('*')
                .limit(1)
                .single()

            if (capitalError && capitalError.code === 'PGRST116') {
                await createInitialCapital()
            } else if (capitalData) {
                setCapital(capitalData)
                setEditValue(capitalData?.amount?.toString() || '0')
            }

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

            // Calculate Totals
            const shoppingTotal = (itemsData || []).reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
            const payrollTotal = (payrollData || []).reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0)

            const totalSpent = shoppingTotal + payrollTotal
            setTotalGasto(totalSpent)

            const today = new Date().toISOString().split('T')[0]
            const shoppingToday = (itemsData || [])
                .filter(item => item.purchase_date === today)
                .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)

            // Note: Payroll is typically not "daily expense" in the same way, but if needed we can add it.
            // For now keeping "Hoy" as shopping expenses which is more relevant for daily operations.
            setGastoHoy(shoppingToday)

            // 5. Fetch accepted night sales from last 35 hours (income)
            const thirtyFiveHoursAgo = new Date()
            thirtyFiveHoursAgo.setHours(thirtyFiveHoursAgo.getHours() - 35)

            const { data: incomeData } = await supabase
                .from('night_sales')
                .select('total_amount, accepted_at')
                .eq('status', 'accepted')
                .gte('accepted_at', thirtyFiveHoursAgo.toISOString())
                .order('accepted_at', { ascending: true })

            const totalIncome = (incomeData || []).reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0)
            setIncomeTotal(totalIncome)

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
                    details: pay.notes || 'Sin notas'
                })
            })

            // Sort by date desc
            combinedMovements.sort((a, b) => new Date(b.date) - new Date(a.date))
            setMovements(combinedMovements)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const createInitialCapital = async () => {
        const { data, error } = await supabase
            .from('capital')
            .insert([{ amount: 5000.00 }])
            .select()
            .single()

        if (!error) {
            setCapital(data)
            setEditValue('5000')
        }
    }

    const updateCapital = async () => {
        const newAmount = parseFloat(editValue) || 0

        try {
            const { error } = await supabase
                .from('capital')
                .update({ amount: newAmount })
                .eq('id', capital.id)

            if (error) throw error

            setCapital({ ...capital, amount: newAmount })
            setEditing(false)
        } catch (error) {
            console.error('Error updating capital:', error)
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
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const saldo = (capital?.amount || 0) - totalGasto
    const isDeficit = saldo < 0
    const percentUsed = capital?.amount ? Math.min((totalGasto / capital.amount) * 100, 100) : 0

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
        <div className="app-container trader-home">
            {/* Header */}
            <div className="trader-header">
                <div>
                    <p className="trader-welcome">Hola, {user?.name || 'Ismerai'}</p>
                    <p className="trader-date">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button
                    className="trader-edit-btn"
                    onClick={() => setEditing(true)}
                >
                    <IconEdit />
                </button>
            </div>

            {/* Main Balance Card */}
            <div className="trader-balance-card">
                {editing ? (
                    <div className="edit-capital-modal">
                        <p className="edit-label">Editar Capital</p>
                        <input
                            type="number"
                            className="edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                        <div className="edit-actions">
                            <button className="edit-btn cancel" onClick={() => setEditing(false)}>
                                <IconClose />
                            </button>
                            <button className="edit-btn save" onClick={updateCapital}>
                                <IconCheck />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="trader-balance-label">Saldo Disponible</p>
                        <h1 className={`trader-balance-amount ${isDeficit ? 'negative' : ''}`}>
                            {formatCurrency(saldo)}
                        </h1>
                    </>
                )}
            </div>

            {/* Stats Row - Simplified */}
            <div className="trader-stats-row simple">
                <div className="trader-stat">
                    <span className="trader-stat-label">DISPONIBLE</span>
                    <span className={`trader-stat-value ${isDeficit ? 'negative' : 'positive'}`}>{formatCurrency(saldo)}</span>
                </div>
                <div className="trader-stat">
                    <span className="trader-stat-label">GASTADO</span>
                    <span className="trader-stat-value negative">{formatCurrency(totalGasto)}</span>
                </div>
                <div className="trader-stat income-stat">
                    <span className="trader-stat-label">INGRESOS 35H</span>
                    <div className="income-display">
                        <span className="trader-stat-value positive">{formatCurrency(incomeTotal)}</span>
                        {incomeTotal > 0 && <span className="income-indicator">↑</span>}
                    </div>
                </div>
            </div>

            {/* Circular Progress */}
            <div className="budget-gauge">
                <div className="gauge-circle">
                    <svg viewBox="0 0 100 100">
                        <circle
                            className="gauge-bg"
                            cx="50"
                            cy="50"
                            r="42"
                        />
                        <circle
                            className={`gauge-fill ${percentUsed > 80 ? 'warning' : ''} ${percentUsed >= 100 ? 'danger' : ''}`}
                            cx="50"
                            cy="50"
                            r="42"
                            strokeDasharray={`${percentUsed * 2.64} 264`}
                        />
                    </svg>
                    <div className="gauge-center">
                        <span className={`gauge-percent ${percentUsed > 80 ? 'warning' : ''} ${percentUsed >= 100 ? 'danger' : ''}`}>
                            {percentUsed.toFixed(0)}%
                        </span>
                        <span className="gauge-label">usado</span>
                    </div>
                </div>
                <div className="gauge-info">
                    <div className="gauge-row">
                        <span className="gauge-dot available"></span>
                        <span className="gauge-text">Disponible</span>
                        <span className="gauge-value">{formatCurrency(saldo)}</span>
                    </div>
                    <div className="gauge-row">
                        <span className="gauge-dot spent"></span>
                        <span className="gauge-text">Gastado</span>
                        <span className="gauge-value">{formatCurrency(totalGasto)}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="trader-actions">
                <button className="trader-action-btn primary action-full-height" onClick={() => navigate('/lista')}>
                    <IconCart />
                    <span>Lista de Compras</span>
                </button>
                <div className="split-action-column">
                    <button className="trader-action-btn secondary small" onClick={() => navigate('/movimientos')}>
                        <IconChart />
                        <span>Movimientos</span>
                    </button>
                    <button className="trader-action-btn secondary small" onClick={() => navigate('/resumen')}>
                        <IconList />
                        <span>Resumen</span>
                    </button>
                </div>
            </div>

            <p className="swipe-hint">← Desliza para menú</p>
        </div>
    )
}
