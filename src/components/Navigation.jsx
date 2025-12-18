import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navigation.css'

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-text">UBC PathFinder</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/calculator" className="nav-link">Calculator</Link>
          <Link to="/planner" className="nav-link">Planner</Link>
          {isAuthenticated ? (
            <>
              <span className="nav-user">Hello, {user?.name}</span>
              <button onClick={logout} className="nav-link logout-link">
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

