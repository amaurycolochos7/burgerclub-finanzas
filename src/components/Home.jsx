import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconChart, IconCart, IconHistory, IconEdit, IconCheck, IconClose, IconList } from './Icons'

export default function Home() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [capital, setCapital] = useState(null)
    const [totalGasto, setTotalGasto] = useState(0)
    const [gastoHoy, setGastoHoy] = useState(0)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)

    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    useEffect(() => {
        fetchData()
    }, [])

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
        const swipeDistance = touchEndX.current - touchStartX.current
        if (swipeDistance > 50 && touchStartX.current < 50) {
            setMenuOpen(true)
        }
        if (swipeDistance < -50 && menuOpen) {
            setMenuOpen(false)
        }
    }

    const fetchData = async () => {
        try {
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

            const { data: itemsData } = await supabase
                .from('shopping_items')
                .select('price, purchase_date')

            if (itemsData) {
                const total = itemsData.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
                setTotalGasto(total)

                const today = new Date().toISOString().split('T')[0]
                const todayTotal = itemsData
                    .filter(item => item.purchase_date === today)
                    .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
                setGastoHoy(todayTotal)
            }
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

    const saldo = (capital?.amount || 0) - totalGasto
    const isDeficit = saldo < 0
    const percentUsed = capital?.amount ? ((totalGasto / capital.amount) * 100).toFixed(1) : 0

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
        <div
            className="app-wrapper"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="swipe-indicator">
                <div className="swipe-line"></div>
            </div>

            <div
                className={`sidebar-overlay ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(false)}
            />

            <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <button className="sidebar-close" onClick={() => setMenuOpen(false)}>
                    <IconClose />
                </button>

                <h2 className="sidebar-title">Menú</h2>

                <div className="sidebar-nav">
                    <button onClick={() => { setMenuOpen(false); navigate('/pendientes') }}>
                        <IconList />
                        <span>Listas Pendientes</span>
                    </button>
                    <button onClick={() => { setMenuOpen(false); navigate('/resumen') }}>
                        <IconChart />
                        <span>Resumen de Gastos</span>
                    </button>
                    <button onClick={() => { setMenuOpen(false); navigate('/lista') }}>
                        <IconCart />
                        <span>Lista de Compras</span>
                    </button>
                    <button onClick={() => { setMenuOpen(false); navigate('/historial') }}>
                        <IconHistory />
                        <span>Historial Completo</span>
                    </button>
                    <button onClick={() => { setMenuOpen(false); navigate('/usuarios') }}>
                        <IconEdit />
                        <span>Gestionar Cocineros</span>
                    </button>
                    <button className="sidebar-logout" onClick={() => { setMenuOpen(false); logout(); navigate('/login') }}>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            <div className="app-container trading-home">
                {/* Header */}
                <div className="trading-header">
                    <p className="trading-greeting">Mi Cartera</p>
                    <button
                        className="edit-btn-small"
                        onClick={() => setEditing(true)}
                    >
                        <IconEdit />
                    </button>
                </div>

                {/* Main Balance Card */}
                <div className="trading-balance">
                    {editing ? (
                        <div className="edit-capital-inline">
                            <input
                                type="number"
                                className="input trading-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                            />
                            <button className="icon-btn success" onClick={updateCapital}>
                                <IconCheck />
                            </button>
                            <button className="icon-btn" onClick={() => setEditing(false)}>
                                <IconClose />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="balance-label">Saldo Disponible</p>
                            <h1 className={`balance-amount ${isDeficit ? 'negative' : ''}`}>
                                {isDeficit ? '- ' : ''}{formatCurrency(Math.abs(saldo))}
                            </h1>
                            <div className={`balance-badge ${isDeficit ? 'negative' : 'positive'}`}>
                                {isDeficit ? '↓' : '↑'} {percentUsed}% usado
                            </div>
                        </>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-label">Capital</span>
                        <span className="stat-value">{formatCurrency(capital?.amount)}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Gastado</span>
                        <span className="stat-value expense">{formatCurrency(totalGasto)}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Hoy</span>
                        <span className="stat-value">{formatCurrency(gastoHoy)}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-section">
                    <div className="progress-header">
                        <span className="progress-label">Uso del presupuesto</span>
                        <span className="progress-percent">{percentUsed}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${parseFloat(percentUsed) > 80 ? 'warning' : ''} ${parseFloat(percentUsed) > 100 ? 'danger' : ''}`}
                            style={{ width: `${Math.min(parseFloat(percentUsed), 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <button
                        className="action-card primary"
                        onClick={() => navigate('/lista')}
                    >
                        <div className="action-icon">
                            <IconCart />
                        </div>
                        <div className="action-text">
                            <span className="action-title">Lista de Compras</span>
                            <span className="action-subtitle">Agregar gastos</span>
                        </div>
                    </button>

                    <button
                        className="action-card"
                        onClick={() => navigate('/resumen')}
                    >
                        <div className="action-icon">
                            <IconChart />
                        </div>
                        <div className="action-text">
                            <span className="action-title">Resumen</span>
                            <span className="action-subtitle">Ver análisis</span>
                        </div>
                    </button>
                </div>

                <p className="swipe-hint">← Desliza para menú</p>
            </div>
        </div>
    )
}
