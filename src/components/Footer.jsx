import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <Link to="/about" className="footer-link">About</Link>
          <Link to="/contact" className="footer-link">Contact</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
        </div>
        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> This website is not affiliated with the University of British Columbia. 
            All admission probability calculations are based on historical data and trends, and do not guarantee admission. 
            Please refer to the official UBC website for authoritative information.
          </p>
        </div>
        <div className="footer-copyright">
          <p>&copy; 2025 UBC PathFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

