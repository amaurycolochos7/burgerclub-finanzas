import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconArrowLeft, IconPlus, IconCheck, IconTrash } from './Icons'

export default function DailyTasks() {
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTask, setNewTask] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchTasks()
    }, [selectedDate])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('task_date', selectedDate)
                .order('created_at', { ascending: true })

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
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
            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: !task.is_completed })
                .eq('id', task.id)

            if (error) throw error
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            ))
        } catch (error) {
            console.error('Error toggling task:', error)
        }
    }

    const deleteTask = async (id) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id)

            if (error) throw error
            setTasks(prev => prev.filter(t => t.id !== id))
        } catch (error) {
            console.error('Error deleting task:', error)
        }
    }

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const pendingTasks = tasks.filter(t => !t.is_completed)
    const completedTasks = tasks.filter(t => t.is_completed)

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
                <h1 className="header-title">Pendientes</h1>
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

            {/* Add Task */}
            <div className="add-task-form">
                <input
                    type="text"
                    className="input"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Nueva tarea..."
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

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
                <div className="tasks-section">
                    <h3 className="tasks-section-title">Por hacer ({pendingTasks.length})</h3>
                    <div className="tasks-list">
                        {pendingTasks.map(task => (
                            <div key={task.id} className="task-item">
                                <button
                                    className="task-toggle"
                                    onClick={() => toggleTask(task)}
                                />
                                <span className="task-title">{task.title}</span>
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteTask(task.id)}
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <div className="tasks-section">
                    <h3 className="tasks-section-title completed">Completadas ({completedTasks.length})</h3>
                    <div className="tasks-list">
                        {completedTasks.map(task => (
                            <div key={task.id} className="task-item completed">
                                <button
                                    className="task-toggle checked"
                                    onClick={() => toggleTask(task)}
                                >
                                    <IconCheck />
                                </button>
                                <span className="task-title">{task.title}</span>
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteTask(task.id)}
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tasks.length === 0 && (
                <div className="empty-state">
                    <p>No hay tareas para este día</p>
                </div>
            )}
        </div>
    )
}
