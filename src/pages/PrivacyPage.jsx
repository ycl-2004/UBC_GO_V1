import React from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import './PrivacyPage.css'

const PrivacyPage = () => {
  return (
    <div className="privacy-page">
      <Navigation />
      <div className="privacy-container">
        <div className="privacy-content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: December 2024</p>

          <section className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              UBC PathFinder ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our website.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <p>We may collect information that you voluntarily provide to us, including:</p>
            <ul>
              <li>Name and email address (when using contact forms)</li>
              <li>Academic information (GPA, courses, etc.) entered into our calculator</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>We may automatically collect certain information when you visit our website:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Calculate admission probabilities based on your input</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Analyze website usage and trends</li>
              <li>Ensure website security and prevent fraud</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Data Storage and Security</h2>
            <p>
              All data entered into our calculator is processed locally in your browser. 
              We do not store your personal academic information on our servers unless you 
              explicitly choose to create an account (if this feature is available).
            </p>
            <p>
              We implement appropriate technical and organizational security measures to 
              protect your information. However, no method of transmission over the Internet 
              is 100% secure.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Cookies and Tracking Technologies</h2>
            <p>
              We may use cookies and similar tracking technologies to enhance your experience. 
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Third-Party Services</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible 
              for the privacy practices of these external sites. We encourage you to review 
              their privacy policies.
            </p>
          </section>

          <section className="privacy-section">
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of certain data collection practices</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>8. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not 
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of 
              any changes by posting the new policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section className="privacy-section">
            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through 
              our <Link to="/contact">Contact</Link> page.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PrivacyPage

