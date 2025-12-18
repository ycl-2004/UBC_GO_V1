import React from 'react'
import Navigation from '../components/Navigation'
import Hero from '../components/Hero'
import ActionCards from '../components/ActionCards'
import ValueProposition from '../components/ValueProposition'
import FeaturePreview from '../components/FeaturePreview'
import Monetization from '../components/Monetization'
import Footer from '../components/Footer'
import './HomePage.css'

const HomePage = () => {
  return (
    <div className="home-page">
      <Navigation />
      <Hero />
      <ActionCards />
      <ValueProposition />
      <FeaturePreview />
      <Monetization />
      <Footer />
    </div>
  )
}

export default HomePage

