import React from 'react'
import { Link } from 'react-router-dom'
import './ActionCards.css'

const ActionCards = () => {
  return (
    <section className="action-cards-section">
      <div className="action-cards-container">
        <div className="action-card applicants-card">
          <div className="card-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="card-title">FOR APPLICANTS</h2>
          <h3 className="card-question">"Can I get in?"</h3>
          <p className="card-description">
            Calculate your admission chance now.
          </p>
          <Link to="/ApplyInfo" className="card-button">
            CHECK NOW
          </Link>
        </div>

        <div className="action-card students-card">
          <div className="card-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="card-title">FOR STUDENTS</h2>
          <h3 className="card-question">"Track my Degree"</h3>
          <p className="card-description">
            Visualize credits & plan your next term.
          </p>
          <Link to="/planner" className="card-button">
            PLAN NOW
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ActionCards

