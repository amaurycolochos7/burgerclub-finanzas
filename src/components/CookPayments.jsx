import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft, IconMoney, IconCalendar } from './Icons'

export default function CookPayments() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const { data } = await supabase
                .from('payroll')
                .select('*')
                .eq('employee_id', user.id)
                .order('payment_date', { ascending: false })

            setPayments(data || [])
        } catch (error) {
            console.error('Error fetching payments:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(val || 0)
    }

    const formatDate = (dateStr) => {
        // Example: "sábado, 27 de diciembre"
        return new Date(dateStr).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        )
    }

    // Calculate total received this month
    const currentMonth = new Date().getMonth()
    const monthTotal = payments
        .filter(p => new Date(p.payment_date).getMonth() === currentMonth)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    return (
        <div className="app-container">
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/cocina')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Mis Pagos</h1>
            </div>

            {/* Banking Style Summary */}
            <div className="banking-summary-card">
                <span className="banking-label">Saldo recibido este mes</span>
                <h1 className="banking-amount">{formatCurrency(monthTotal)}</h1>
            </div>

            <div className="banking-list-container">
                <div className="banking-list-header">Movimientos Recientes</div>

                {payments.length === 0 ? (
                    <div className="empty-state-banking">
                        <p>No hay movimientos registrados</p>
                    </div>
                ) : (
                    payments.map((payment, index) => {
                        // Logic to show date separators if needed, or just clean list
                        // For BBVA style, usually it's a clean list with date on the left or under title
                        const isFirst = index === 0
                        const prevDate = !isFirst ? new Date(payments[index - 1].payment_date).toDateString() : null
                        const currDate = new Date(payment.payment_date).toDateString()
                        const showDateSeparator = prevDate !== currDate

                        return (
                            <div key={payment.id} className="banking-item-wrapper">
                                {showDateSeparator && (
                                    <div className="banking-date-separator">
                                        {formatDate(payment.payment_date)}
                                    </div>
                                )}
                                <div className="banking-item">
                                    <div className="banking-icon-circle">
                                        <IconMoney />
                                    </div>
                                    <div className="banking-details">
                                        <span className="banking-concept">Abono de Nómina</span>
                                        <span className="banking-meta">
                                            {payment.days_worked > 0 ? `${payment.days_worked} días trabajados` : 'Pago recibido'}
                                            {payment.notes && ` • ${payment.notes}`}
                                        </span>
                                    </div>
                                    <div className="banking-right">
                                        <span className="banking-value positive">+{formatCurrency(payment.amount)}</span>
                                        <span className="banking-time">{formatTime(payment.payment_date)}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
