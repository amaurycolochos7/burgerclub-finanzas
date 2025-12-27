import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconChart, IconCart, IconHistory, IconEdit, IconCheck, IconClose, IconList, IconMoney, IconSend, IconInbox } from './Icons'

export default function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, isAdmin } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    // Don't show menu on login page
    if (location.pathname === '/login' || !user) {
        return <>{children}</>
    }

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

    const navTo = (path) => {
        setMenuOpen(false)
        navigate(path)
    }

    const handleLogout = () => {
        setMenuOpen(false)
        logout()
        navigate('/login')
    }

    return (
        <div
            className="app-wrapper"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe Indicator */}
            <div className="swipe-indicator">
                <div className="swipe-line"></div>
            </div>

            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(false)}
            />

            {/* Sidebar Menu */}
            <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <button className="sidebar-close" onClick={() => setMenuOpen(false)}>
                    <IconClose />
                </button>

                <div className="sidebar-user">
                    <span className="sidebar-user-name">{user.name}</span>
                    <span className="sidebar-user-role">{isAdmin ? 'Administrador' : 'Cocinero'}</span>
                </div>

                <div className="sidebar-nav">
                    {isAdmin ? (
                        <>
                            <button onClick={() => navTo('/')}>
                                <IconChart />
                                <span>Inicio</span>
                            </button>
                            <button onClick={() => navTo('/pendientes')}>
                                <IconList />
                                <span>Listas de Cocina</span>
                            </button>
                            <button onClick={() => navTo('/lista')}>
                                <IconCart />
                                <span>Lista de Compras</span>
                            </button>
                            <button onClick={() => navTo('/tareas')}>
                                <IconCheck />
                                <span>Mis Pendientes</span>
                            </button>
                            <button onClick={() => navTo('/resumen')}>
                                <IconChart />
                                <span>Resumen de Gastos</span>
                            </button>
                            <button onClick={() => navTo('/nomina')}>
                                <IconMoney />
                                <span>Nómina</span>
                            </button>
                            <button onClick={() => navTo('/envios-dinero')}>
                                <IconInbox />
                                <span>Envíos de Dinero</span>
                            </button>
                            <button onClick={() => navTo('/usuarios')}>
                                <IconEdit />
                                <span>Gestionar Cocineros</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navTo('/cocina')}>
                                <IconChart />
                                <span>Inicio</span>
                            </button>
                            <button onClick={() => navTo('/cocina/nueva-lista')}>
                                <IconList />
                                <span>Nueva Lista</span>
                            </button>
                            <button onClick={() => navTo('/cocina/pagos')}>
                                <IconMoney />
                                <span>Mis Pagos</span>
                            </button>
                            <button onClick={() => navTo('/cocina/ventas-noche')}>
                                <IconSend />
                                <span>Ventas de la Noche</span>
                            </button>
                            <button onClick={() => navTo('/cocina/mis-listas')}>
                                <IconHistory />
                                <span>Mis Listas</span>
                            </button>
                        </>
                    )}
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Page Content */}
            {children}
        </div>
    )
}
