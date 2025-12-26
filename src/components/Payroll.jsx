// Complete redesign of Payroll component
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCheck, IconClose } from './Icons'

export default function Payroll() {
    const navigate = useNavigate()
    const [cooks, setCooks] = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [selectedCook, setSelectedCook] = useState('')
    const [amount, setAmount] = useState('')
    const [daysWorked, setDaysWorked] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch cooks
            const { data: cooksData } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'cook')

            setCooks(cooksData || [])

            // Fetch recent payments
            const { data: paymentsData } = await supabase
                .from('payroll')
                .select('*, users(name)')
                .order('payment_date', { ascending: false })
                .limit(20)

            setPayments(paymentsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async (e) => {
        e.preventDefault()
        if (!selectedCook || !amount) return

        setSubmitting(true)
        try {
            const { data, error } = await supabase
                .from('payroll')
                .insert([{
                    employee_id: selectedCook,
                    amount: parseFloat(amount),
                    days_worked: parseInt(daysWorked) || 0,
                    notes: notes,
                    payment_date: new Date().toISOString()
                }])
                .select('*, users(name)')
                .single()

            if (error) throw error

            setPayments([data, ...payments])

            // Reset form
            setSelectedCook('')
            setAmount('')
            setDaysWorked('')
            setNotes('')

            alert('Pago registrado correctamente')
        } catch (error) {
            console.error('Error recording payment:', error)
            alert('Error al registrar el pago')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este pago?')) return

        try {
            const { error } = await supabase
                .from('payroll')
                .delete()
                .eq('id', id)

            if (error) throw error

            setPayments(payments.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting payment:', error)
            alert('Error al eliminar el pago')
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
            day: 'numeric',
            month: 'short',
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

    return (
        <div className="app-container">
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Nómina</h1>
            </div>

            {/* New Payment Card */}
            <div className="card-glass payment-form-card">
                <h2 className="card-title-sm">Nuevo Pago</h2>
                <form onSubmit={handlePayment} className="modern-form">

                    {/* Cook Selection - Visual Chips */}
                    <div className="form-group">
                        <label className="label-sm">Seleccionar Cocinero</label>
                        <div className="cook-chips">
                            {cooks.map(cook => (
                                <div
                                    key={cook.id}
                                    className={`cook-chip ${selectedCook === cook.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCook(cook.id)}
                                >
                                    <div className="cook-avatar-sm">
                                        {cook.name.charAt(0)}
                                    </div>
                                    <span className="cook-name">{cook.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-2">
                            <label className="label-sm">Monto ($)</label>
                            <input
                                type="number"
                                className="input-modern"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label className="label-sm">Días</label>
                            <input
                                type="number"
                                className="input-modern"
                                value={daysWorked}
                                onChange={(e) => setDaysWorked(e.target.value)}
                                placeholder="#"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <input
                            className="input-modern"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Agregar nota (opcional)..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-pay-action"
                        disabled={submitting || !selectedCook || !amount}
                    >
                        {submitting ? 'Procesando...' : 'Realizar Pago'}
                        <IconCheck />
                    </button>
                </form>
            </div>

            <div className="section-divider">Historial Reciente</div>

            <div className="payments-list-modern">
                {payments.length === 0 ? (
                    <div className="empty-state">No hay pagos recientes</div>
                ) : (
                    payments.map(payment => (
                        <div key={payment.id} className="payment-item-modern">
                            <div className="payment-avatar">
                                {payment.users?.name.charAt(0)}
                            </div>
                            <div className="payment-details">
                                <span className="payment-name">{payment.users?.name}</span>
                                <span className="payment-meta">
                                    {formatDate(payment.payment_date)} • {payment.days_worked} días
                                </span>
                            </div>
                            <div className="payment-right">
                                <div className="payment-amount-modern">
                                    -{formatCurrency(payment.amount)}
                                </div>
                                <button
                                    className="btn-delete-icon"
                                    onClick={() => handleDelete(payment.id)}
                                >
                                    <IconClose />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
