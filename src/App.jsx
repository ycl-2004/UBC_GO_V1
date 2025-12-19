import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import ApplyInfoPage from './pages/ApplyInfoPage'
import PlannerPage from './pages/PlannerPage'
import LoginPage from './pages/LoginPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router basename="/UBC_GO_V1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ApplyInfo" element={<ApplyInfoPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

