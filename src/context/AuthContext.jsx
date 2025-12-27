import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for saved session
        const savedUser = localStorage.getItem('burgerclub_user')
        if (savedUser) {
            const parsed = JSON.parse(savedUser)
            setUser(parsed)

            // Refresh from DB to get latest name/role
            refreshUser(parsed.id)
        }
        setLoading(false)
    }, [])

    const refreshUser = async (userId) => {
        try {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (data) {
                setUser(data)
                localStorage.setItem('burgerclub_user', JSON.stringify(data))
            }
        } catch (e) {
            console.error('Error refreshing user', e)
        }
    }

    const login = async (email, password) => {
        try {
            const normalizedEmail = email.trim().toLowerCase()

            // First, find the user by email only
            const { data: userByEmail, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', normalizedEmail)
                .single()

            if (emailError || !userByEmail) {
                return { error: 'Credenciales incorrectas' }
            }

            // Compare passwords directly
            if (password !== userByEmail.password) {
                return { error: 'Credenciales incorrectas' }
            }

            const data = userByEmail

            if (!data) {
                return { error: 'Credenciales incorrectas' }
            }

            setUser(data)
            localStorage.setItem('burgerclub_user', JSON.stringify(data))
            return { data }
        } catch (error) {
            return { error: 'Error al iniciar sesión' }
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('burgerclub_user')
    }

    const isAdmin = user?.role === 'admin'
    const isCook = user?.role === 'cook'

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isCook }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
