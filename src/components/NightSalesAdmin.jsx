import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCheck, IconTrash, IconInbox } from './Icons'

export default function NightSalesAdmin() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [pendingSales, setPendingSales] = useState([])
    const [acceptedSales, setAcceptedSales] = useState([])
    const [processing, setProcessing] = useState(null)

    useEffect(() => {
        fetchSales()
    }, [])

    const fetchSales = async () => {
        try {
            // Fetch pending sales
            const { data: pending, error: pendingError } = await supabase
                .from('night_sales')
                .select('*, users:cook_id(name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (pendingError) throw pendingError

            // Fetch accepted sales from last 7 days
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { data: accepted, error: acceptedError } = await supabase
                .from('night_sales')
                .select('*, users:cook_id(name)')
                .eq('status', 'accepted')
                .gte('accepted_at', sevenDaysAgo.toISOString())
                .order('accepted_at', { ascending: false })

            if (acceptedError) throw acceptedError

            setPendingSales(pending || [])
            setAcceptedSales(accepted || [])
        } catch (error) {
            console.error('Error fetching sales:', error)
        } finally {
            setLoading(false)
        }
    }

    const acceptSale = async (sale) => {
        const confirmText = `¿Aceptar envío de ${formatCurrency(sale.total_amount)} de ${sale.users?.name}?`
        if (!confirm(confirmText)) return

        setProcessing(sale.id)

        try {
            // 1. Update sale status
            const { error: saleError } = await supabase
                .from('night_sales')
                .update({
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .eq('id', sale.id)

            if (saleError) throw saleError

            // 2. Get current capital
            const { data: capitalData, error: capitalFetchError } = await supabase
                .from('capital')
                .select('*')
                .limit(1)
                .single()

            if (capitalFetchError) throw capitalFetchError

            // 3. Add amount to capital
            const newAmount = (parseFloat(capitalData.amount) || 0) + parseFloat(sale.total_amount)

            const { error: capitalUpdateError } = await supabase
                .from('capital')
                .update({ amount: newAmount })
                .eq('id', capitalData.id)

            if (capitalUpdateError) throw capitalUpdateError

            // Refresh the list
            await fetchSales()
            alert('¡Envío aceptado! El saldo ha sido actualizado.')

        } catch (error) {
            console.error('Error accepting sale:', error)
            alert('Error al aceptar el envío')
        } finally {
            setProcessing(null)
        }
    }

    const deleteSale = async (sale) => {
        const isAccepted = sale.status === 'accepted'
        const confirmText = isAccepted
            ? `¿Eliminar envío ACEPTADO de ${formatCurrency(sale.total_amount)}? Esto RESTARÁ del capital.`
            : `¿Eliminar envío de ${formatCurrency(sale.total_amount)} de ${sale.users?.name}?`

        if (!confirm(confirmText)) return

        setProcessing(sale.id)

        try {
            // If the sale was already accepted, we need to subtract from capital
            if (isAccepted) {
                // 1. Get current capital
                const { data: capitalData, error: capitalFetchError } = await supabase
                    .from('capital')
                    .select('*')
                    .limit(1)
                    .single()

                if (capitalFetchError) throw capitalFetchError

                // 2. Subtract amount from capital
                const newAmount = (parseFloat(capitalData.amount) || 0) - parseFloat(sale.total_amount)

                const { error: capitalUpdateError } = await supabase
                    .from('capital')
                    .update({ amount: newAmount })
                    .eq('id', capitalData.id)

                if (capitalUpdateError) throw capitalUpdateError
            }

            // 3. Delete the sale record
            const { error } = await supabase
                .from('night_sales')
                .delete()
                .eq('id', sale.id)

            if (error) throw error

            await fetchSales()

            if (isAccepted) {
                alert('Envío eliminado y capital actualizado.')
            }
        } catch (error) {
            console.error('Error deleting sale:', error)
            alert('Error al eliminar el envío')
        } finally {
            setProcessing(null)
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
                <h1 className="header-title">Envíos de Dinero</h1>
            </div>

            {/* Pending Sales */}
            <div className="night-sales-section">
                <h2 className="section-title">
                    <IconInbox />
                    <span>Pendientes de Aceptar</span>
                    {pendingSales.length > 0 && (
                        <span className="badge badge-pending">{pendingSales.length}</span>
                    )}
                </h2>

                {pendingSales.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay envíos pendientes</p>
                    </div>
                ) : (
                    <div className="night-sales-list">
                        {pendingSales.map(sale => (
                            <div key={sale.id} className="night-sale-card pending">
                                <div className="night-sale-header">
                                    <span className="night-sale-cook">{sale.users?.name || 'Cocinero'}</span>
                                    <span className="night-sale-date">{formatDate(sale.created_at)}</span>
                                </div>

                                <div className="night-sale-amount">
                                    {formatCurrency(sale.total_amount)}
                                </div>

                                {sale.description && (
                                    <div className="night-sale-description">
                                        {sale.description}
                                    </div>
                                )}

                                <div className="night-sale-actions">
                                    <button
                                        className="btn btn-success btn-with-icon"
                                        onClick={() => acceptSale(sale)}
                                        disabled={processing === sale.id}
                                    >
                                        <IconCheck />
                                        <span>{processing === sale.id ? 'Procesando...' : 'Aceptar'}</span>
                                    </button>
                                    <button
                                        className="btn btn-danger-outline"
                                        onClick={() => deleteSale(sale)}
                                        disabled={processing === sale.id}
                                    >
                                        <IconTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Accepted History */}
            <div className="night-sales-section" style={{ marginTop: '2rem' }}>
                <h2 className="section-title">
                    <IconCheck />
                    <span>Historial Aceptados</span>
                </h2>

                {acceptedSales.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay envíos aceptados recientes</p>
                    </div>
                ) : (
                    <div className="night-sales-list">
                        {acceptedSales.map(sale => (
                            <div key={sale.id} className="night-sale-card accepted">
                                <div className="night-sale-header">
                                    <span className="night-sale-cook">{sale.users?.name || 'Cocinero'}</span>
                                    <span className="night-sale-date">{formatDate(sale.accepted_at)}</span>
                                </div>

                                <div className="night-sale-amount positive">
                                    +{formatCurrency(sale.total_amount)}
                                </div>

                                {sale.description && (
                                    <div className="night-sale-description">
                                        {sale.description}
                                    </div>
                                )}

                                <div className="night-sale-actions">
                                    <button
                                        className="btn btn-danger-outline btn-small"
                                        onClick={() => deleteSale(sale)}
                                        disabled={processing === sale.id}
                                    >
                                        <IconTrash />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
