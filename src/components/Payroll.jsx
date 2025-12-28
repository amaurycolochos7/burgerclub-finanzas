// Modern Payroll component with improved UI
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCheck, IconClose, IconMoney } from './Icons'
import { useToast } from './Toast'

export default function Payroll() {
    const navigate = useNavigate()
    const { showToast } = useToast()
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
            // Fetch cooks (excluding deleted ones)
            let { data: cooksData, error: cooksError } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'cook')
                .is('deleted_at', null)

            // Fallback if deleted_at column doesn't exist
            if (cooksError && cooksError.message && cooksError.message.includes('deleted_at')) {
                const result = await supabase
                    .from('users')
                    .select('*')
                    .eq('role', 'cook')
                cooksData = result.data
            }

            setCooks(cooksData || [])

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
            setSelectedCook('')
            setAmount('')
            setDaysWorked('')
            setNotes('')
            showToast('Pago registrado correctamente', 'success')
        } catch (error) {
            console.error('Error recording payment:', error)
            showToast('Error al registrar el pago', 'error')
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
            minimumFractionDigits: 0
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

    const getTotalPaidThisMonth = () => {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return payments
            .filter(p => new Date(p.payment_date) >= monthStart)
            .reduce((sum, p) => sum + (p.amount || 0), 0)
    }

    const getAvatarGradient = (name) => {
        const gradients = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#a18cd1', '#fbc2eb'],
            ['#30cfd0', '#330867'],
            ['#ff6b6b', '#ffa66b'],
        ]
        if (!name) return gradients[0]
        const index = name.charCodeAt(0) % gradients.length
        return gradients[index]
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

            {/* Stats Card */}
            <div className="payroll-summary-card">
                <div className="payroll-summary-icon">
                    <IconMoney />
                </div>
                <div className="payroll-summary-content">
                    <span className="payroll-summary-label">Pagado este mes</span>
                    <span className="payroll-summary-amount">{formatCurrency(getTotalPaidThisMonth())}</span>
                </div>
            </div>

            {/* Payment Form */}
            <div className="payroll-card">
                <h2 className="payroll-section-title">Nuevo Pago</h2>

                {/* Cook Selection - Horizontal Scroll */}
                <div className="payroll-cook-section">
                    <label className="payroll-label">Seleccionar Cocinero</label>
                    <div className="payroll-cook-scroll">
                        {cooks.length === 0 ? (
                            <p className="payroll-empty-msg">No hay cocineros</p>
                        ) : (
                            cooks.map(cook => {
                                const [color1, color2] = getAvatarGradient(cook.name)
                                const isSelected = selectedCook === cook.id
                                return (
                                    <button
                                        key={cook.id}
                                        type="button"
                                        className={`payroll-cook-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setSelectedCook(cook.id)}
                                    >
                                        <div
                                            className="payroll-cook-avatar-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${color1}, ${color2})`,
                                                boxShadow: isSelected ? `0 4px 20px ${color1}50` : 'none'
                                            }}
                                        >
                                            {cook.name.charAt(0).toUpperCase()}
                                            {isSelected && (
                                                <div className="payroll-cook-check-badge">
                                                    <IconCheck />
                                                </div>
                                            )}
                                        </div>
                                        <span className="payroll-cook-label">{cook.name.split(' ')[0]}</span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                <form onSubmit={handlePayment}>
                    {/* Amount & Days - Side by Side */}
                    <div className="payroll-inputs-container">
                        <div className="payroll-monto-field">
                            <label className="payroll-label">Monto</label>
                            <div className="payroll-amount-box">
                                <span className="payroll-dollar">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>
                        <div className="payroll-dias-field">
                            <label className="payroll-label">Días</label>
                            <input
                                type="number"
                                className="payroll-dias-input"
                                value={daysWorked}
                                onChange={(e) => setDaysWorked(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="payroll-field">
                        <input
                            type="text"
                            className="payroll-input payroll-input-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Agregar nota (opcional)..."
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="payroll-btn-submit"
                        disabled={submitting || !selectedCook || !amount}
                    >
                        {submitting ? 'Procesando...' : 'Realizar Pago'}
                        <IconCheck />
                    </button>
                </form>
            </div>

            {/* History */}
            <div className="section-divider"><span>HISTORIAL</span></div>

            <div className="payroll-list">
                {payments.length === 0 ? (
                    <div className="payroll-empty-state">
                        <IconMoney />
                        <p>No hay pagos registrados</p>
                    </div>
                ) : (
                    payments.map(payment => {
                        const [color1, color2] = getAvatarGradient(payment.users?.name)
                        return (
                            <div key={payment.id} className="payroll-item">
                                <div
                                    className="payroll-item-avatar"
                                    style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
                                >
                                    {payment.users?.name?.charAt(0) || '?'}
                                </div>
                                <div className="payroll-item-info">
                                    <span className="payroll-item-name">{payment.users?.name || 'Desconocido'}</span>
                                    <span className="payroll-item-meta">
                                        {formatDate(payment.payment_date)}
                                        {payment.days_worked > 0 && ` · ${payment.days_worked}d`}
                                    </span>
                                </div>
                                <div className="payroll-item-amount">-{formatCurrency(payment.amount)}</div>
                                <button
                                    className="payroll-item-delete"
                                    onClick={() => handleDelete(payment.id)}
                                >
                                    <IconClose />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
