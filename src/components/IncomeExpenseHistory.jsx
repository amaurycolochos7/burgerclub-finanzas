import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft } from './Icons'

export default function IncomeExpenseHistory() {
    const navigate = useNavigate()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // 'all', 'income', 'expense'

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            // Fetch sales (income)
            const { data: salesData } = await supabase
                .from('sales')
                .select('*, users(name)')
                .order('created_at', { ascending: false })

            // Fetch expenses
            const { data: expensesData } = await supabase
                .from('shopping_items')
                .select('*')
                .order('created_at', { ascending: false })

            // Combine and format
            const income = (salesData || []).map(s => ({
                id: s.id,
                type: 'income',
                amount: parseFloat(s.amount),
                description: s.description,
                date: s.sale_date,
                user: s.users?.name || 'Admin',
                created_at: s.created_at
            }))

            const expenses = (expensesData || []).map(e => ({
                id: e.id,
                type: 'expense',
                amount: parseFloat(e.price),
                description: e.name,
                date: e.purchase_date,
                user: 'Admin',
                created_at: e.created_at
            }))

            const all = [...income, ...expenses].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            )

            setTransactions(all)
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
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
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true
        return t.type === filter
    })

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

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
                <h1 className="header-title">Historial</h1>
            </div>

            {/* Summary Cards */}
            <div className="history-summary">
                <div className="history-summary-card income">
                    <span className="history-summary-label">Ingresos</span>
                    <span className="history-summary-value">+{formatCurrency(totalIncome)}</span>
                </div>
                <div className="history-summary-card expense">
                    <span className="history-summary-label">Egresos</span>
                    <span className="history-summary-value">-{formatCurrency(totalExpense)}</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="history-tabs">
                <button
                    className={`history-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todos
                </button>
                <button
                    className={`history-tab ${filter === 'income' ? 'active' : ''}`}
                    onClick={() => setFilter('income')}
                >
                    Ingresos
                </button>
                <button
                    className={`history-tab ${filter === 'expense' ? 'active' : ''}`}
                    onClick={() => setFilter('expense')}
                >
                    Egresos
                </button>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                    <p>No hay transacciones</p>
                </div>
            ) : (
                <div className="transactions-list">
                    {filteredTransactions.map(t => (
                        <div key={`${t.type}-${t.id}`} className="transaction-item">
                            <div className="transaction-info">
                                <span className="transaction-desc">{t.description}</span>
                                <span className="transaction-meta">{formatDate(t.date)} • {t.user}</span>
                            </div>
                            <span className={`transaction-amount ${t.type}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
