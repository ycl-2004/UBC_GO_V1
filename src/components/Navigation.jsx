import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navigation.css'

const Navigation = () => {
  const { user, profile, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async (e) => {
    e.preventDefault()
    
    // Prevent multiple clicks
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    
    try {
      const result = await logout()
      if (result.success) {
        // Navigate to home page after logout
        navigate('/')
      } else {
        console.error('Logout failed:', result.error)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-text">UBC PathFinder</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link 
            to="/ApplyInfo" 
            className="nav-link"
            onClick={(e) => {
              // If already on ApplyInfo page, scroll to applyinfo section
              if (window.location.pathname === '/ApplyInfo' || window.location.pathname === '/UBC_GO_V1/ApplyInfo') {
                e.preventDefault();
                setTimeout(() => {
                  const applyinfoSection = document.getElementById('applyinfo-section');
                  if (applyinfoSection) {
                    applyinfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }
            }}
          >
            Application Info
          </Link>
          <Link to="/planner" className="nav-link">Planner</Link>
          <Link to="/first-year-guide" className="nav-link">First Year Guide</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-link">Profile</Link>
              <span className="nav-user">Hello, {displayName}</span>
              <button onClick={handleLogout} className="nav-link logout-link">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-link">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

