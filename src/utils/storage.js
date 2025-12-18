// LocalStorage utility functions for data persistence

export const StorageKeys = {
  USER_PLANS: 'ubc_pathfinder_user_plans',
  CURRENT_USER: 'ubc_pathfinder_current_user',
  USER_SETTINGS: 'ubc_pathfinder_user_settings'
}

export const storage = {
  // Save user plans
  savePlans: (userId, plans) => {
    try {
      const allPlans = storage.getAllPlans()
      allPlans[userId] = plans
      localStorage.setItem(StorageKeys.USER_PLANS, JSON.stringify(allPlans))
      return true
    } catch (error) {
      console.error('Error saving plans:', error)
      return false
    }
  },

  // Get all plans for a user
  getUserPlans: (userId) => {
    try {
      const allPlans = storage.getAllPlans()
      return allPlans[userId] || []
    } catch (error) {
      console.error('Error getting user plans:', error)
      return []
    }
  },

  // Get all plans from all users
  getAllPlans: () => {
    try {
      const data = localStorage.getItem(StorageKeys.USER_PLANS)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error getting all plans:', error)
      return {}
    }
  },

  // Save current user
  setCurrentUser: (user) => {
    try {
      localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user))
      return true
    } catch (error) {
      console.error('Error saving current user:', error)
      return false
    }
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const data = localStorage.getItem(StorageKeys.CURRENT_USER)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Clear current user
  clearCurrentUser: () => {
    try {
      localStorage.removeItem(StorageKeys.CURRENT_USER)
      return true
    } catch (error) {
      console.error('Error clearing current user:', error)
      return false
    }
  },

  // Save a single plan
  savePlan: (userId, planId, planData) => {
    try {
      const plans = storage.getUserPlans(userId)
      const existingIndex = plans.findIndex(p => p.id === planId)
      
      if (existingIndex >= 0) {
        plans[existingIndex] = { ...plans[existingIndex], ...planData }
      } else {
        plans.push({ id: planId, ...planData })
      }
      
      return storage.savePlans(userId, plans)
    } catch (error) {
      console.error('Error saving plan:', error)
      return false
    }
  },

  // Get a single plan
  getPlan: (userId, planId) => {
    try {
      const plans = storage.getUserPlans(userId)
      return plans.find(p => p.id === planId) || null
    } catch (error) {
      console.error('Error getting plan:', error)
      return null
    }
  },

  // Delete a plan
  deletePlan: (userId, planId) => {
    try {
      const plans = storage.getUserPlans(userId)
      const filteredPlans = plans.filter(p => p.id !== planId)
      return storage.savePlans(userId, filteredPlans)
    } catch (error) {
      console.error('Error deleting plan:', error)
      return false
    }
  }
}

