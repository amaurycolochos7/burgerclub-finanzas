import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconArrowRight, IconEmpty } from './Icons'

export default function ResumenPeriodo() {
    const navigate = useNavigate()
    const { periodo } = useParams()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [capital, setCapital] = useState(0)

    const getPeriodConfig = () => {
        const now = new Date()
        switch (periodo) {
            case 'semanal':
                return {
                    title: 'Gastos Semanales',
                    startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                    label: 'Últimos 7 días'
                }
            case 'mensual':
                return {
                    title: 'Gastos Mensuales',
                    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
                    label: now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                }
            case 'anual':
                return {
                    title: 'Gastos Anuales',
                    startDate: new Date(now.getFullYear(), 0, 1),
                    label: now.getFullYear().toString()
                }
            default:
                return {
                    title: 'Gastos',
                    startDate: new Date(0),
                    label: 'Todo'
                }
        }
    }

    const config = getPeriodConfig()

    useEffect(() => {
        fetchData()
    }, [periodo])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: capitalData } = await supabase
                .from('capital')
                .select('amount')
                .limit(1)
                .single()

            if (capitalData) {
                setCapital(capitalData.amount)
            }

            const { data: itemsData, error } = await supabase
                .from('shopping_items')
                .select('*')
                .gte('purchase_date', config.startDate.toISOString().split('T')[0])
                .order('purchase_date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error

            const grouped = (itemsData || []).reduce((acc, item) => {
                const date = item.purchase_date
                if (!acc[date]) {
                    acc[date] = []
                }
                acc[date].push(item)
                return acc
            }, {})

            setItems(grouped)
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

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const getTotalGasto = () => {
        return Object.values(items).flat().reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    }

    const getDayTotal = (dayItems) => {
        return dayItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    }

    const handleItemClick = (item) => {
        navigate(`/lista?fecha=${item.purchase_date}`)
    }

    const totalGasto = getTotalGasto()
    const saldo = capital - totalGasto
    const isDeficit = saldo < 0

    const sortedDates = Object.keys(items).sort((a, b) => new Date(b) - new Date(a))

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
                <button className="back-btn" onClick={() => navigate('/resumen')}>
                    <IconArrowLeft />
                </button>
                <div>
                    <h1 className="header-title">{config.title}</h1>
                    <p className="header-subtitle">{config.label}</p>
                </div>
            </div>

            <div className="balance-summary">
                <div className="balance-item">
                    <p className="balance-item-label">Capital</p>
                    <p className="balance-item-value">{formatCurrency(capital)}</p>
                </div>
                <div className="balance-item">
                    <p className="balance-item-label">Gasto</p>
                    <p className="balance-item-value">{formatCurrency(totalGasto)}</p>
                </div>
                <div className="balance-item">
                    <p className="balance-item-label">Saldo</p>
                    <p className={`balance-item-value ${isDeficit ? 'balance-negative' : 'balance-positive'}`}>
                        {isDeficit ? '- ' : ''}{formatCurrency(Math.abs(saldo))}
                    </p>
                </div>
            </div>

            <div className="period-tabs">
                <button
                    className={`period-tab ${periodo === 'semanal' ? 'active' : ''}`}
                    onClick={() => navigate('/resumen/semanal')}
                >
                    Semanal
                </button>
                <button
                    className={`period-tab ${periodo === 'mensual' ? 'active' : ''}`}
                    onClick={() => navigate('/resumen/mensual')}
                >
                    Mensual
                </button>
                <button
                    className={`period-tab ${periodo === 'anual' ? 'active' : ''}`}
                    onClick={() => navigate('/resumen/anual')}
                >
                    Anual
                </button>
            </div>

            {sortedDates.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <IconEmpty />
                    </div>
                    <p>No hay gastos en este período</p>
                </div>
            ) : (
                <div className="period-list">
                    {sortedDates.map(date => (
                        <div key={date} className="period-day">
                            <div className="period-day-header">
                                <span className="period-day-date">{formatDateDisplay(date)}</span>
                                <span className="period-day-total">{formatCurrency(getDayTotal(items[date]))}</span>
                            </div>
                            <div className="period-day-items">
                                {items[date].map(item => (
                                    <button
                                        key={item.id}
                                        className="period-item clickable-item"
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <span className="period-item-name">{item.name}</span>
                                        <span className="period-item-price">{formatCurrency(item.price)}</span>
                                        <span className="period-item-arrow"><IconArrowRight /></span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
