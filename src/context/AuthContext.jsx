import { createContext, useContext, useState, useEffect } from 'react'
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  createUser,
  generateResetToken,
  resetPassword as resetPasswordInStore
} from '../services/storageService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password, rememberMe) => {
    const loggedInUser = await loginUser(email, password, rememberMe)
    setUser(loggedInUser)
    return loggedInUser
  }

  const register = async (name, email, password) => {
    const newUser = await createUser(name, email, password)
    await loginUser(email, password, true)
    setUser(newUser)
    return newUser
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  const forgotPassword = async (email) => {
    return generateResetToken(email)
  }

  const resetPassword = async (token, newPassword) => {
    return resetPasswordInStore(token, newPassword)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)