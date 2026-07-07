/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedEmail = localStorage.getItem('email')
        return savedEmail ? { email: savedEmail } : null
    })

    const login = (email) => {
        localStorage.setItem('email', email)
        setUser({ email })
    }

    const logout = () => {
        localStorage.removeItem('email')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// hook customizado para consumir o contexto
export const useAuth = () => useContext(AuthContext)
