import React from 'react'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="/about" className="footer-link">About</a>
          <a href="/contact" className="footer-link">Contact</a>
          <a href="/privacy" className="footer-link">Privacy Policy</a>
          <a href="/terms" className="footer-link">Terms of Service</a>
        </div>
        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> This website is not affiliated with the University of British Columbia. 
            All admission probability calculations are based on historical data and trends, and do not guarantee admission. 
            Please refer to the official UBC website for authoritative information.
          </p>
        </div>
        <div className="footer-copyright">
          <p>&copy; 2024 UBC PathFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

