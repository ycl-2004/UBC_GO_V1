import React from 'react'
import './Monetization.css'

const Monetization = () => {
  const services = [
    {
      title: 'Essay Editing',
      description: 'Get professional feedback on your Personal Profile',
      link: '#'
    },
    {
      title: 'Math 100 Tutor',
      description: 'Ace your first-year calculus with expert help',
      link: '#'
    },
    {
      title: 'IELTS Prep',
      description: 'Boost your English scores for admission',
      link: '#'
    }
  ]

  return (
    <section className="monetization">
      <div className="monetization-container">
        <h2 className="monetization-title">Need an extra boost?</h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <a key={index} href={service.link} className="service-card">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <span className="service-link">Learn More →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Monetization

