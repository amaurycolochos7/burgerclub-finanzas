import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft, IconCheck } from './Icons'

const INVENTORY_ITEMS = [
    { id: 1, name: 'Tocino crudo', category: 'Carnes' },
    { id: 2, name: 'Tocino cocido', category: 'Carnes' },
    { id: 3, name: 'Jamón', category: 'Carnes' },
    { id: 4, name: 'Carne cruda', category: 'Carnes' },
    { id: 5, name: 'Carne cocida', category: 'Carnes' },
    { id: 6, name: 'Queso A.', category: 'Lácteos' },
    { id: 7, name: 'Quesillo', category: 'Lácteos' },
    { id: 8, name: 'Lechuga', category: 'Verduras' },
    { id: 9, name: 'Lechuga picada', category: 'Verduras' },
    { id: 10, name: 'Tomate', category: 'Verduras' },
    { id: 11, name: 'Cebolla', category: 'Verduras' },
    { id: 12, name: 'Piña', category: 'Verduras' },
    { id: 13, name: 'Mayonesa', category: 'Salsas' },
    { id: 14, name: 'Chimichurri', category: 'Salsas' },
    { id: 15, name: 'Catsup', category: 'Salsas' },
    { id: 16, name: 'BBQ', category: 'Salsas' },
    { id: 17, name: 'Margarina', category: 'Otros' },
    { id: 18, name: 'Papel aluminio', category: 'Empaque' },
    { id: 19, name: 'Bolsas de oreja', category: 'Empaque' },
    { id: 20, name: 'Bolsas transparentes', category: 'Empaque' },
]

export default function InventoryChecklist() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [checkedItems, setCheckedItems] = useState({})
    const [lastSaved, setLastSaved] = useState(null)

    // Load saved checklist from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`inventory_${user?.id}_${getCurrentMonth()}`)
        if (saved) {
            setCheckedItems(JSON.parse(saved))
        }
        const savedDate = localStorage.getItem(`inventory_date_${user?.id}_${getCurrentMonth()}`)
        if (savedDate) {
            setLastSaved(new Date(savedDate))
        }
    }, [user?.id])

    const getCurrentMonth = () => {
        const now = new Date()
        return `${now.getFullYear()}-${now.getMonth() + 1}`
    }

    const toggleItem = (itemId) => {
        setCheckedItems(prev => {
            const updated = { ...prev, [itemId]: !prev[itemId] }
            // Auto-save to localStorage
            localStorage.setItem(`inventory_${user?.id}_${getCurrentMonth()}`, JSON.stringify(updated))
            localStorage.setItem(`inventory_date_${user?.id}_${getCurrentMonth()}`, new Date().toISOString())
            setLastSaved(new Date())
            return updated
        })
    }

    const clearAll = () => {
        if (confirm('¿Limpiar toda la checklist?')) {
            setCheckedItems({})
            localStorage.removeItem(`inventory_${user?.id}_${getCurrentMonth()}`)
            localStorage.removeItem(`inventory_date_${user?.id}_${getCurrentMonth()}`)
            setLastSaved(null)
        }
    }

    const checkedCount = Object.values(checkedItems).filter(Boolean).length
    const totalItems = INVENTORY_ITEMS.length
    const progress = Math.round((checkedCount / totalItems) * 100)

    // Group items by category
    const groupedItems = INVENTORY_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
    }, {})

    const formatDate = (date) => {
        if (!date) return ''
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="app-container">
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/cocina')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Inventario del Mes</h1>
            </div>

            {/* Progress Bar */}
            <div className="inventory-progress">
                <div className="inventory-progress-header">
                    <span className="inventory-progress-text">{checkedCount} de {totalItems} revisados</span>
                    <span className="inventory-progress-percent">{progress}%</span>
                </div>
                <div className="inventory-progress-bar">
                    <div
                        className="inventory-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {lastSaved && (
                    <span className="inventory-last-saved">
                        Guardado: {formatDate(lastSaved)}
                    </span>
                )}
            </div>

            {/* Checklist by Category */}
            <div className="inventory-list">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="inventory-category">
                        <h3 className="inventory-category-title">{category}</h3>
                        <div className="inventory-items">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className={`inventory-item ${checkedItems[item.id] ? 'checked' : ''}`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={`inventory-checkbox ${checkedItems[item.id] ? 'checked' : ''}`}>
                                        {checkedItems[item.id] && <IconCheck />}
                                    </div>
                                    <span className="inventory-item-name">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Clear Button */}
            <button
                className="btn btn-secondary btn-full"
                onClick={clearAll}
                style={{ marginTop: '1rem' }}
            >
                Limpiar Checklist
            </button>
        </div>
    )
}
