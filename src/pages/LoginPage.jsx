import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import './LoginPage.css'

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (isLogin) {
      const result = login(email, password)
      if (result.success) {
        navigate('/planner')
      } else {
        setError('Login failed. Please try again.')
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your name')
        return
      }
      const result = register(email, password, name)
      if (result.success) {
        navigate('/planner')
      } else {
        setError('Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="login-page">
      <Navigation />
      <div className="login-container">
        <div className="login-card">
          <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
          <p className="login-subtitle">
            {isLogin 
              ? 'Sign in to save and manage your degree plans'
              : 'Create an account to start planning your UBC journey'
            }
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="submit-button">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="login-switch">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                className="switch-button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>

          <div className="login-note">
            <p>
              <small>
                Note: This is a demo application. In production, authentication would be handled securely through a backend API.
              </small>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

