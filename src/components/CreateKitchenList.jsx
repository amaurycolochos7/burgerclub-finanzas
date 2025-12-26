import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft, IconPlus, IconTrash } from './Icons'

export default function CreateKitchenList() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [title, setTitle] = useState('')
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState('')
    const [newQuantity, setNewQuantity] = useState('')
    const [saving, setSaving] = useState(false)

    // Default to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const [targetDate, setTargetDate] = useState(tomorrow.toISOString().split('T')[0])

    const addItem = () => {
        if (!newItem.trim()) return

        setItems(prev => [...prev, {
            id: Date.now(),
            name: newItem.trim(),
            quantity: newQuantity.trim() || '1'
        }])
        setNewItem('')
        setNewQuantity('')
    }

    const removeItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }

    const handleSubmit = async () => {
        if (!title.trim() || items.length === 0) return

        setSaving(true)

        try {
            const isAdmin = user?.role === 'admin'
            const status = isAdmin ? 'approved' : 'pending' // Auto-approve for admins
            const approvedAt = isAdmin ? new Date().toISOString() : null

            // 1. Create List
            const { data: listData, error: listError } = await supabase
                .from('kitchen_lists')
                .insert([{
                    user_id: user.id,
                    title: title.trim(),
                    target_date: targetDate,
                    status: status,
                    approved_at: approvedAt
                }])
                .select()
                .single()

            if (listError) throw listError

            // 2. Create List Items
            const listItems = items.map(item => ({
                list_id: listData.id,
                name: item.name,
                quantity: item.quantity
            }))

            const { error: itemsError } = await supabase
                .from('kitchen_list_items')
                .insert(listItems)

            if (itemsError) throw itemsError

            // 3. If Admin, ALSO create Shopping Items immediately
            if (isAdmin) {
                const shoppingItems = listItems.map(item => ({
                    name: `${item.name} (${item.quantity})`,
                    price: 0,
                    is_completed: false,
                    purchase_date: targetDate
                }))

                const { error: shoppingError } = await supabase
                    .from('shopping_items')
                    .insert(shoppingItems)

                if (shoppingError) throw shoppingError
            }

            navigate(isAdmin ? '/' : '/cocina') // Admin goes home to see movements, Cook stays in kitchen
        } catch (error) {
            console.error('Error creating list:', error)
            alert('Error al crear la lista')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="app-container">
            <div className="header">
                <button className="back-btn" onClick={() => navigate('/cocina')}>
                    <IconArrowLeft />
                </button>
                <h1 className="header-title">Nueva Lista</h1>
            </div>

            <div className="create-list-form">
                {/* Title & Date Section */}
                <div className="form-card">
                    <div className="form-group">
                        <label className="form-label">Título de la lista</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Ingredientes hamburguesas"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Para el día</label>
                        <input
                            type="date"
                            className="input"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Add Items Section */}
                <div className="form-card">
                    <label className="form-label">Agregar artículos</label>
                    <p className="form-hint">Indica cuánto hay disponible (0 = se necesita comprar)</p>
                    <div className="add-item-grid">
                        <div className="add-item-inputs">
                            <input
                                type="text"
                                className="input"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Producto"
                                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            />
                            <input
                                type="text"
                                className="input input-small"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                                placeholder="Hay"
                                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            />
                        </div>
                        <button
                            className="btn btn-primary btn-add"
                            onClick={addItem}
                            disabled={!newItem.trim()}
                        >
                            <IconPlus />
                        </button>
                    </div>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                    <div className="items-card">
                        <div className="items-header">
                            <span className="form-label">Artículos ({items.length})</span>
                        </div>
                        <div className="items-list">
                            {items.map(item => (
                                <div key={item.id} className="item-row">
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-qty">{item.quantity}</span>
                                    <button
                                        className="item-delete"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <IconTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-full btn-submit"
                    onClick={handleSubmit}
                    disabled={saving || !title.trim() || items.length === 0}
                >
                    {saving ? 'Guardando...' : 'Enviar Lista'}
                </button>
            </div>
        </div>
    )
}
