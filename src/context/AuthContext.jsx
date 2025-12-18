import React, { createContext, useState, useEffect, useContext } from 'react'
import { storage } from '../utils/storage'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = storage.getCurrentUser()
    if (savedUser) {
      setUser(savedUser)
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    // Simple authentication - in production, this would call an API
    // For now, we'll use localStorage-based auth
    const user = {
      id: email, // Use email as ID for simplicity
      email: email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    }
    
    setUser(user)
    storage.setCurrentUser(user)
    
    // Initialize empty plans if user doesn't exist
    const existingPlans = storage.getUserPlans(user.id)
    if (!existingPlans || existingPlans.length === 0) {
      storage.savePlans(user.id, [])
    }
    
    return { success: true, user }
  }

  const register = (email, password, name) => {
    // Simple registration - in production, this would call an API
    const user = {
      id: email,
      email: email,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString()
    }
    
    setUser(user)
    storage.setCurrentUser(user)
    storage.savePlans(user.id, [])
    
    return { success: true, user }
  }

  const logout = () => {
    setUser(null)
    storage.clearCurrentUser()
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

