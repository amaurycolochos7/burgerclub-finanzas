import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconPlus, IconTrash, IconEmpty, IconCheck } from './Icons'

export default function ListaDiaria() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [items, setItems] = useState([])
    const [tasks, setTasks] = useState([])
    const [capital, setCapital] = useState(0)
    const [loading, setLoading] = useState(true)
    const [newItemName, setNewItemName] = useState('')
    const [newItemPrice, setNewItemPrice] = useState('')
    const [newTask, setNewTask] = useState('')
    const [showTasks, setShowTasks] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editingField, setEditingField] = useState(null)
    const [editValue, setEditValue] = useState('')

    const urlDate = searchParams.get('fecha')
    const [selectedDate, setSelectedDate] = useState(urlDate || new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchData()
    }, [selectedDate])

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

            const { data: itemsData } = await supabase
                .from('shopping_items')
                .select('*')
                .eq('purchase_date', selectedDate)
                .order('is_completed', { ascending: true })
                .order('created_at', { ascending: false })

            setItems(itemsData || [])

            // Fetch tasks for this date
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .eq('task_date', selectedDate)
                .order('created_at', { ascending: true })

            setTasks(tasksData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const addItem = async (e) => {
        e.preventDefault()
        if (!newItemName.trim()) return

        const price = parseFloat(newItemPrice) || 0

        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .insert([{
                    name: newItemName.trim(),
                    price: price,
                    is_completed: false,
                    purchase_date: selectedDate
                }])
                .select()
                .single()

            if (error) throw error

            setItems(prev => sortItems([data, ...prev]))
            setNewItemName('')
            setNewItemPrice('')
        } catch (error) {
            console.error('Error adding item:', error)
        }
    }

    const addTask = async () => {
        if (!newTask.trim()) return

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    title: newTask.trim(),
                    task_date: selectedDate,
                    is_completed: false
                }])
                .select()
                .single()

            if (error) throw error
            setTasks(prev => [...prev, data])
            setNewTask('')
        } catch (error) {
            console.error('Error adding task:', error)
        }
    }

    const toggleTask = async (task) => {
        try {
            await supabase
                .from('tasks')
                .update({ is_completed: !task.is_completed })
                .eq('id', task.id)

            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            ))
        } catch (error) {
            console.error('Error toggling task:', error)
        }
    }

    const deleteTask = async (id) => {
        try {
            await supabase.from('tasks').delete().eq('id', id)
            setTasks(prev => prev.filter(t => t.id !== id))
        } catch (error) {
            console.error('Error deleting task:', error)
        }
    }

    const startEditing = (item, field) => {
        setEditingId(item.id)
        setEditingField(field)
        setEditValue(field === 'price' ? item.price.toString() : item.name)
    }

    const saveEdit = async (item) => {
        if (!editingField) return

        const updateData = {}
        if (editingField === 'name') {
            if (!editValue.trim()) {
                cancelEdit()
                return
            }
            updateData.name = editValue.trim()
        } else if (editingField === 'price') {
            updateData.price = parseFloat(editValue) || 0
        }

        try {
            await supabase
                .from('shopping_items')
                .update(updateData)
                .eq('id', item.id)

            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, ...updateData } : i
            ))
        } catch (error) {
            console.error('Error updating item:', error)
        }

        cancelEdit()
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingField(null)
        setEditValue('')
    }

    const handleKeyDown = (e, item) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveEdit(item)
        } else if (e.key === 'Escape') {
            cancelEdit()
        }
    }

    const toggleItem = async (item) => {
        const newStatus = !item.is_completed

        try {
            await supabase
                .from('shopping_items')
                .update({
                    is_completed: newStatus,
                    completed_at: newStatus ? new Date().toISOString() : null
                })
                .eq('id', item.id)

            setItems(prev => sortItems(
                prev.map(i => i.id === item.id ? { ...i, is_completed: newStatus } : i)
            ))
        } catch (error) {
            console.error('Error toggling item:', error)
        }
    }

    const deleteItem = async (id) => {
        try {
            await supabase.from('shopping_items').delete().eq('id', id)
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (error) {
            console.error('Error deleting item:', error)
        }
    }

    const sortItems = (itemsToSort) => {
        return [...itemsToSort].sort((a, b) => {
            if (a.is_completed !== b.is_completed) {
                return a.is_completed ? 1 : -1
            }
            return new Date(b.created_at) - new Date(a.created_at)
        })
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
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const totalGasto = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    const saldo = capital - totalGasto

    const pendingItems = items.filter(i => !i.is_completed)
    const completedItems = items.filter(i => i.is_completed)
    const pendingTasks = tasks.filter(t => !t.is_completed)
    const completedTasks = tasks.filter(t => t.is_completed)

    const renderItem = (item, isCompleted) => (
        <div key={item.id} className={`shopping-item ${isCompleted ? 'completed' : ''}`}>
            <button
                className={`circle-toggle ${isCompleted ? 'checked' : ''}`}
                onClick={() => toggleItem(item)}
            />
            <div className="item-content">
                {editingId === item.id && editingField === 'name' ? (
                    <input
                        type="text"
                        className="input inline-edit"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item)}
                        onBlur={() => saveEdit(item)}
                        autoFocus
                    />
                ) : (
                    <span className="item-name editable" onClick={() => startEditing(item, 'name')}>
                        {item.name}
                    </span>
                )}
            </div>
            {editingId === item.id && editingField === 'price' ? (
                <input
                    type="number"
                    className="input inline-edit inline-edit-price"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item)}
                    onBlur={() => saveEdit(item)}
                    step="0.01"
                    min="0"
                    autoFocus
                />
            ) : (
                <span className="item-price editable" onClick={() => startEditing(item, 'price')}>
                    {formatCurrency(item.price)}
                </span>
            )}
            <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                <IconTrash />
            </button>
        </div>
    )

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
                <h1 className="header-title">Lista Diaria</h1>
            </div>

            {/* Date Picker */}
            <div className="date-picker-container">
                <input
                    type="date"
                    className="input date-picker"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <p className="date-display">{formatDateDisplay(selectedDate)}</p>
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
                    <p className={`balance-item-value ${saldo < 0 ? 'balance-negative' : 'balance-positive'}`}>
                        {saldo < 0 ? '- ' : ''}{formatCurrency(Math.abs(saldo))}
                    </p>
                </div>
            </div>

            {/* TASKS SECTION */}
            <div className="inline-tasks-section">
                <button
                    className="inline-tasks-header"
                    onClick={() => setShowTasks(!showTasks)}
                >
                    <span className="inline-tasks-title">
                        Pendientes del día
                        {pendingTasks.length > 0 && (
                            <span className="inline-tasks-badge">{pendingTasks.length}</span>
                        )}
                    </span>
                    <span className={`inline-tasks-arrow ${showTasks ? 'open' : ''}`}>▼</span>
                </button>

                {showTasks && (
                    <div className="inline-tasks-content">
                        <div className="inline-tasks-add">
                            <input
                                type="text"
                                className="input"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Agregar pendiente..."
                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                            />
                            <button
                                className="btn btn-primary btn-icon-only"
                                onClick={addTask}
                                disabled={!newTask.trim()}
                            >
                                <IconPlus />
                            </button>
                        </div>

                        {tasks.length === 0 ? (
                            <p className="inline-tasks-empty">Sin pendientes para este día</p>
                        ) : (
                            <div className="inline-tasks-list">
                                {pendingTasks.map(task => (
                                    <div key={task.id} className="inline-task-item">
                                        <button className="task-toggle" onClick={() => toggleTask(task)} />
                                        <span className="inline-task-title">{task.title}</span>
                                        <button className="task-delete" onClick={() => deleteTask(task.id)}>
                                            <IconTrash />
                                        </button>
                                    </div>
                                ))}
                                {completedTasks.map(task => (
                                    <div key={task.id} className="inline-task-item completed">
                                        <button className="task-toggle checked" onClick={() => toggleTask(task)}>
                                            <IconCheck />
                                        </button>
                                        <span className="inline-task-title">{task.title}</span>
                                        <button className="task-delete" onClick={() => deleteTask(task.id)}>
                                            <IconTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ADD SHOPPING ITEM */}
            <form className="add-item-form" onSubmit={addItem}>
                <input
                    type="text"
                    className="input input-name"
                    placeholder="Nombre del artículo"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                />
                <input
                    type="number"
                    className="input input-price"
                    placeholder="$ 0.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    step="0.01"
                    min="0"
                />
                <button type="submit" className="btn btn-primary btn-icon-only">
                    <IconPlus />
                </button>
            </form>

            {/* SHOPPING LIST */}
            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <IconEmpty />
                    </div>
                    <p>No hay compras para este día</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        Agrega artículos arriba
                    </p>
                </div>
            ) : (
                <>
                    {pendingItems.length > 0 && (
                        <div className="shopping-list">
                            {pendingItems.map(item => renderItem(item, false))}
                        </div>
                    )}

                    {pendingItems.length > 0 && completedItems.length > 0 && (
                        <div className="section-divider">Completados</div>
                    )}

                    {completedItems.length > 0 && (
                        <div className="shopping-list">
                            {completedItems.map(item => renderItem(item, true))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
