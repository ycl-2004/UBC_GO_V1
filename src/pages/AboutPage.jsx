import React from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import './AboutPage.css'

const AboutPage = () => {
  return (
    <div className="about-page">
      <Navigation />
      <div className="about-container">
        <div className="about-content">
          <h1>About UBC PathFinder</h1>
          
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              UBC PathFinder is an unofficial guide designed to help prospective students navigate 
              the complex journey of applying to and succeeding at the University of British Columbia. 
              Our mission is to provide transparent, data-driven insights into admission requirements 
              and academic planning.
            </p>
          </section>

          <section className="about-section">
            <h2>What We Offer</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>📋 Admission Requirements</h3>
                <p>
                  Comprehensive, province-specific admission requirements for all 20 major programs 
                  across 13 Canadian provinces and territories.
                </p>
              </div>
              <div className="feature-card">
                <h3>📊 Admission Chance Calculator</h3>
                <p>
                  Calculate your admission probability based on GPA, course completion, and personal 
                  profile using our data-driven model.
                </p>
              </div>
              <div className="feature-card">
                <h3>🎓 Degree Planner</h3>
                <p>
                  Plan your academic journey with our interactive degree planner that helps you 
                  track credits and plan your courses.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Important Disclaimer</h2>
            <div className="disclaimer-box">
              <p>
                <strong>UBC PathFinder is not affiliated with the University of British Columbia.</strong>
              </p>
              <p>
                This website is an independent tool created to assist students in their application 
                process. All information is based on publicly available data and historical trends. 
                Admission decisions are made solely by UBC, and meeting minimum requirements does not 
                guarantee acceptance.
              </p>
              <p>
                Always refer to the <a href="https://you.ubc.ca" target="_blank" rel="noopener noreferrer">official UBC website</a> for 
                the most current and authoritative admission information.
              </p>
            </div>
          </section>

          <section className="about-section">
            <h2>Data Sources</h2>
            <p>
              Our admission requirements data is compiled from UBC's official admission pages and 
              updated regularly. The admission probability calculator uses historical acceptance rates 
              and trends, but should be used as a reference tool only.
            </p>
          </section>

          <section className="about-section">
            <h2>Contact Us</h2>
            <p>
              Have questions or feedback? Please visit our <Link to="/contact">Contact</Link> page 
              to get in touch with us.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default AboutPage

