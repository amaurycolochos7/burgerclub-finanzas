import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft } from './Icons'

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
        return new Date(dateStr).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
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

            <div className="cook-sales-summary">
                <span className="cook-sales-label">Pagos recibidos este mes</span>
                <span className="cook-sales-amount">{formatCurrency(monthTotal)}</span>
            </div>

            <div className="payments-list">
                {payments.length === 0 ? (
                    <div className="empty-state">No tienes pagos registrados aún</div>
                ) : (
                    payments.map(payment => (
                        <div key={payment.id} className="payment-card">
                            <div className="payment-info">
                                <span className="payment-date capitalize">{formatDate(payment.payment_date)}</span>
                                {payment.days_worked > 0 && (
                                    <span className="payment-detail">Correspondiente a {payment.days_worked} días trabajados</span>
                                )}
                                {payment.notes && (
                                    <p className="payment-notes">"{payment.notes}"</p>
                                )}
                            </div>
                            <div className="payment-amount income">
                                +{formatCurrency(payment.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
