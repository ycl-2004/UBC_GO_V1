import React from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import './TermsPage.css'

const TermsPage = () => {
  return (
    <div className="terms-page">
      <Navigation />
      <div className="terms-container">
        <div className="terms-content">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: December 2024</p>

          <section className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using UBC PathFinder ("the Service"), you accept and agree to be 
              bound by the terms and provision of this agreement. If you do not agree to these 
              terms, please do not use our Service.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access and use UBC PathFinder for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a 
              transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>3. Disclaimer</h2>
            <p>
              <strong>UBC PathFinder is not affiliated with the University of British Columbia.</strong>
            </p>
            <p>
              The materials on UBC PathFinder are provided on an 'as is' basis. UBC PathFinder 
              makes no warranties, expressed or implied, and hereby disclaims and negates all other 
              warranties including, without limitation, implied warranties or conditions of 
              merchantability, fitness for a particular purpose, or non-infringement of 
              intellectual property or other violation of rights.
            </p>
            <p>
              Further, UBC PathFinder does not warrant or make any representations concerning 
              the accuracy, likely results, or reliability of the use of the materials on its 
              website or otherwise relating to such materials or on any sites linked to this site.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Limitations</h2>
            <p>
              In no event shall UBC PathFinder or its suppliers be liable for any damages 
              (including, without limitation, damages for loss of data or profit, or due to 
              business interruption) arising out of the use or inability to use the materials 
              on UBC PathFinder, even if UBC PathFinder or an authorized representative has been 
              notified orally or in writing of the possibility of such damage.
            </p>
            <p>
              Because some jurisdictions do not allow limitations on implied warranties, or 
              limitations of liability for consequential or incidental damages, these limitations 
              may not apply to you.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. Accuracy of Materials</h2>
            <p>
              The materials appearing on UBC PathFinder could include technical, typographical, 
              or photographic errors. UBC PathFinder does not warrant that any of the materials 
              on its website are accurate, complete, or current. UBC PathFinder may make changes 
              to the materials contained on its website at any time without notice.
            </p>
            <p>
              <strong>Admission probability calculations are estimates based on historical data 
              and trends. They do not guarantee admission to UBC.</strong> Always refer to the 
              official UBC website for authoritative admission information.
            </p>
          </section>

          <section className="terms-section">
            <h2>6. Links</h2>
            <p>
              UBC PathFinder has not reviewed all of the sites linked to its website and is not 
              responsible for the contents of any such linked site. The inclusion of any link does 
              not imply endorsement by UBC PathFinder. Use of any such linked website is at the 
              user's own risk.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Modifications</h2>
            <p>
              UBC PathFinder may revise these terms of service for its website at any time without 
              notice. By using this website you are agreeing to be bound by the then current version 
              of these terms of service.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws 
              of Canada and you irrevocably submit to the exclusive jurisdiction of the courts in 
              that location.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. User Responsibilities</h2>
            <p>As a user of UBC PathFinder, you agree to:</p>
            <ul>
              <li>Provide accurate information when using our services</li>
              <li>Not use the Service for any unlawful purpose</li>
              <li>Not attempt to gain unauthorized access to any part of the Service</li>
              <li>Respect intellectual property rights</li>
              <li>Use the Service in accordance with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through 
              our <Link to="/contact">Contact</Link> page.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default TermsPage

