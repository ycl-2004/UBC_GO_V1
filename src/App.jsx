import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import ApplyInfoPage from './pages/ApplyInfoPage'
import PlannerPage from './pages/PlannerPage'
import FirstYearGuide from './pages/FirstYearGuide'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router basename="/UBC_GO_V1">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ApplyInfo" element={<ApplyInfoPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/first-year-guide" element={<FirstYearGuide />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

