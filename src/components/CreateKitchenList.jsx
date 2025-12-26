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
            // Create the list
            const { data: listData, error: listError } = await supabase
                .from('kitchen_lists')
                .insert([{
                    user_id: user.id,
                    title: title.trim(),
                    target_date: targetDate,
                    status: 'pending'
                }])
                .select()
                .single()

            if (listError) throw listError

            // Create list items
            const listItems = items.map(item => ({
                list_id: listData.id,
                name: item.name,
                quantity: item.quantity
            }))

            const { error: itemsError } = await supabase
                .from('kitchen_list_items')
                .insert(listItems)

            if (itemsError) throw itemsError

            navigate('/cocina')
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

            <div className="form-group">
                <label className="form-label">Artículos</label>
                <div className="add-item-row">
                    <input
                        type="text"
                        className="input"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Nombre del artículo"
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                    <input
                        type="text"
                        className="input input-quantity"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="Cantidad"
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                    <button className="btn btn-primary btn-icon-only" onClick={addItem}>
                        <IconPlus />
                    </button>
                </div>
            </div>

            {items.length > 0 && (
                <div className="kitchen-items-list">
                    {items.map(item => (
                        <div key={item.id} className="kitchen-item">
                            <div className="kitchen-item-info">
                                <span className="kitchen-item-name">{item.name}</span>
                                <span className="kitchen-item-qty">{item.quantity}</span>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => removeItem(item.id)}
                            >
                                <IconTrash />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={saving || !title.trim() || items.length === 0}
                style={{ marginTop: 'auto' }}
            >
                {saving ? 'Guardando...' : 'Enviar Lista'}
            </button>
        </div>
    )
}
