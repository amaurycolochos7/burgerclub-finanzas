import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { IconArrowLeft, IconCheck } from './Icons'

export default function AddSale() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!amount || parseFloat(amount) <= 0) return

        setSaving(true)

        try {
            // Add sale record
            const { error: saleError } = await supabase
                .from('sales')
                .insert([{
                    user_id: user.id,
                    amount: parseFloat(amount),
                    description: description.trim() || 'Venta del día',
                    sale_date: new Date().toISOString().split('T')[0]
                }])

            if (saleError) throw saleError

            // Update capital (add to existing)
            const { data: capitalData } = await supabase
                .from('capital')
                .select('*')
                .limit(1)
                .single()

            if (capitalData) {
                await supabase
                    .from('capital')
                    .update({ amount: capitalData.amount + parseFloat(amount) })
                    .eq('id', capitalData.id)
            }

            navigate('/cocina')
        } catch (error) {
            console.error('Error adding sale:', error)
            alert('Error al registrar la venta')
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
                <h1 className="header-title">Agregar Venta</h1>
            </div>

            <form onSubmit={handleSubmit} className="sale-form">
                <div className="form-group">
                    <label className="form-label">Monto de la venta</label>
                    <input
                        type="number"
                        className="input input-large"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="$0.00"
                        step="0.01"
                        min="0"
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Descripción (opcional)</label>
                    <input
                        type="text"
                        className="input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Ventas de la noche"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-success btn-full btn-with-icon"
                    disabled={saving || !amount || parseFloat(amount) <= 0}
                >
                    <IconCheck />
                    <span>{saving ? 'Guardando...' : 'Registrar Venta'}</span>
                </button>
            </form>
        </div>
    )
}
