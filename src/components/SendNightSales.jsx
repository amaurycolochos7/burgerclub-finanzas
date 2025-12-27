import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft, IconSend, IconCheck, IconHistory } from './Icons'

export default function SendNightSales() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [history, setHistory] = useState([])

    const [formData, setFormData] = useState({
        total_amount: '',
        description: ''
    })

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            // Get sales from last 48 hours that were accepted, plus all pending ones
            const twoDaysAgo = new Date()
            twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

            const { data, error } = await supabase
                .from('night_sales')
                .select('*')
                .eq('cook_id', user.id)
                .or(`status.eq.pending,and(status.eq.accepted,accepted_at.gte.${twoDaysAgo.toISOString()})`)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            setHistory(data || [])
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
            alert('Por favor ingresa un monto válido')
            return
        }

        setSaving(true)

        try {
            const { error } = await supabase
                .from('night_sales')
                .insert([{
                    cook_id: user.id,
                    total_amount: parseFloat(formData.total_amount),
                    description: formData.description.trim() || null,
                    status: 'pending'
                }])

            if (error) throw error

            // Reset form and refresh history
            setFormData({
                total_amount: '',
                description: ''
            })

            await fetchHistory()
            alert('¡Ventas enviadas correctamente!')

        } catch (error) {
            console.error('Error sending sales:', error)
            alert('Error al enviar las ventas')
        } finally {
            setSaving(false)
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
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-pending', text: 'Pendiente' },
            accepted: { class: 'badge-approved', text: 'Aceptado' },
            rejected: { class: 'badge-rejected', text: 'Rechazado' }
        }
        return badges[status] || badges.pending
    }

    const [expandedId, setExpandedId] = useState(null)

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id)
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
                <h1 className="header-title">Ventas de la Noche</h1>
            </div>

            {/* Sales Form */}
            <form onSubmit={handleSubmit} className="night-sales-form">
                <div className="form-group">
                    <label className="form-label">Monto Total *</label>
                    <input
                        type="number"
                        className="input"
                        value={formData.total_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                        placeholder="$0.00"
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Detalles de la Venta</label>
                    <textarea
                        className="input textarea"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ej: 15 hamburguesas grandes, 8 chicas. Gastos: $50 gas, $30 ingredientes extra..."
                        rows="4"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-full btn-with-icon"
                    disabled={saving}
                >
                    <IconSend />
                    <span>{saving ? 'Enviando...' : 'Enviar Ventas'}</span>
                </button>
            </form>

            {/* History */}
            <div className="cook-section" style={{ marginTop: '2rem' }}>
                <div className="cook-section-header">
                    <h2 className="cook-section-title">
                        <IconHistory />
                        <span style={{ marginLeft: '0.5rem' }}>Mis Envíos</span>
                    </h2>
                </div>

                {history.length === 0 ? (
                    <div className="cook-empty">
                        <p>No has enviado ventas aún</p>
                    </div>
                ) : (
                    <div className="sales-history">
                        {history.map(sale => {
                            const badge = getStatusBadge(sale.status)
                            const isExpanded = expandedId === sale.id

                            return (
                                <div
                                    key={sale.id}
                                    className={`sales-history-item ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleExpand(sale.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="sales-history-info">
                                        <div className="sales-history-top">
                                            <span className="sales-history-amount">
                                                {formatCurrency(sale.total_amount)}
                                            </span>
                                            <span className={`badge ${badge.class}`}>{badge.text}</span>
                                        </div>

                                        <span className="sales-history-date">
                                            {formatDate(sale.created_at)}
                                        </span>

                                        {sale.description && (
                                            <div className="sales-history-detail-container">
                                                <span className={`sales-history-detail ${isExpanded ? 'full' : 'truncated'}`}>
                                                    {isExpanded
                                                        ? sale.description
                                                        : (sale.description.length > 40
                                                            ? sale.description.substring(0, 40) + '...'
                                                            : sale.description)}
                                                </span>
                                                {sale.description.length > 40 && !isExpanded && (
                                                    <span className="expand-hint">(ver más)</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Arrow icon could go here if needed */}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
