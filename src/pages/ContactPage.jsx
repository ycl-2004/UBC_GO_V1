import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import './ContactPage.css'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real application, this would send the data to a backend
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 3000)
  }

  return (
    <div className="contact-page">
      <Navigation />
      <div className="contact-container">
        <div className="contact-content">
          <h1>Contact Us</h1>
          <p className="contact-intro">
            Have questions, feedback, or suggestions? We'd love to hear from you! 
            Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <div className="contact-grid">
            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              {submitted ? (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  <p>Thank you for your message! We'll get back to you soon.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="bug">Report a Bug</option>
                      <option value="suggestion">Feature Suggestion</option>
                      <option value="data">Data Accuracy Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <button type="submit" className="submit-button">
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <div className="contact-info-section">
              <h2>Other Ways to Reach Us</h2>
              
              <div className="info-card">
                <h3>📧 Email</h3>
                <p>For general inquiries, please use the contact form.</p>
              </div>

              <div className="info-card">
                <h3>🐛 Bug Reports</h3>
                <p>
                  Found a bug or data inaccuracy? Please use the contact form 
                  and select "Report a Bug" or "Data Accuracy Question" as the subject.
                </p>
              </div>

              <div className="info-card">
                <h3>💡 Suggestions</h3>
                <p>
                  Have ideas for new features or improvements? We'd love to hear them! 
                  Select "Feature Suggestion" in the contact form.
                </p>
              </div>

              <div className="info-card">
                <h3>⏱️ Response Time</h3>
                <p>
                  We typically respond within 2-3 business days. For urgent matters 
                  regarding data accuracy, we prioritize those requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ContactPage

