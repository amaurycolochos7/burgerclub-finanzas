import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconCalendarWeek, IconCalendarMonth, IconCalendarYear } from './Icons'

export default function Resumen() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [capital, setCapital] = useState(0)
    const [gastoSemanal, setGastoSemanal] = useState(0)
    const [gastoMensual, setGastoMensual] = useState(0)
    const [gastoAnual, setGastoAnual] = useState(0)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: capitalData } = await supabase
                .from('capital')
                .select('amount')
                .limit(1)
                .single()

            if (capitalData) {
                setCapital(capitalData.amount)
            }

            const { data: itemsData } = await supabase
                .from('shopping_items')
                .select('price, purchase_date')

            if (itemsData) {
                const now = new Date()
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
                const yearAgo = new Date(now.getFullYear(), 0, 1)

                let weekly = 0, monthly = 0, yearly = 0
                itemsData.forEach(item => {
                    const itemDate = new Date(item.purchase_date + 'T12:00:00')
                    const price = parseFloat(item.price) || 0

                    if (itemDate >= weekAgo) weekly += price
                    if (itemDate >= monthAgo) monthly += price
                    if (itemDate >= yearAgo) yearly += price
                })

                setGastoSemanal(weekly)
                setGastoMensual(monthly)
                setGastoAnual(yearly)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
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
                <h1 className="header-title">Resumen de Gastos</h1>
            </div>

            <div className="resumen-cards">
                <button
                    className="resumen-card"
                    onClick={() => navigate('/resumen/semanal')}
                >
                    <div className="resumen-card-header">
                        <span className="resumen-card-icon">
                            <IconCalendarWeek />
                        </span>
                        <span className="resumen-card-label">Semanal</span>
                    </div>
                    <span className="resumen-card-sublabel">Últimos 7 días</span>
                    <span className="resumen-card-amount">{formatCurrency(gastoSemanal)}</span>
                </button>

                <button
                    className="resumen-card"
                    onClick={() => navigate('/resumen/mensual')}
                >
                    <div className="resumen-card-header">
                        <span className="resumen-card-icon">
                            <IconCalendarMonth />
                        </span>
                        <span className="resumen-card-label">Mensual</span>
                    </div>
                    <span className="resumen-card-sublabel">Este mes</span>
                    <span className="resumen-card-amount">{formatCurrency(gastoMensual)}</span>
                </button>

                <button
                    className="resumen-card"
                    onClick={() => navigate('/resumen/anual')}
                >
                    <div className="resumen-card-header">
                        <span className="resumen-card-icon">
                            <IconCalendarYear />
                        </span>
                        <span className="resumen-card-label">Anual</span>
                    </div>
                    <span className="resumen-card-sublabel">Este año</span>
                    <span className="resumen-card-amount">{formatCurrency(gastoAnual)}</span>
                </button>
            </div>

            <div className="resumen-total">
                <span className="resumen-total-label">Capital Disponible</span>
                <span className="resumen-total-value">{formatCurrency(capital)}</span>
            </div>
        </div>
    )
}
