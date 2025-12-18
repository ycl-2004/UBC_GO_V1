import React from 'react'
import './FeaturePreview.css'

const FeaturePreview = () => {
  return (
    <section className="feature-preview">
      <div className="feature-preview-container">
        {/* First Feature - Calculator */}
        <div className="feature-row">
          <div className="feature-image">
            <div className="mockup-graph">
              <div className="graph-container">
                <div className="graph-bar" style={{ height: '80%' }}></div>
                <div className="graph-bar" style={{ height: '60%' }}></div>
                <div className="graph-bar" style={{ height: '90%' }}></div>
                <div className="graph-bar" style={{ height: '70%' }}></div>
                <div className="graph-bar" style={{ height: '85%' }}></div>
              </div>
              <div className="graph-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>
          <div className="feature-content">
            <h2 className="feature-headline">Stop Guessing.</h2>
            <p className="feature-text">
              We analyze your grades against Faculty requirements.
            </p>
          </div>
        </div>

        {/* Second Feature - Planner */}
        <div className="feature-row reverse">
          <div className="feature-content">
            <h2 className="feature-headline">Graduate Faster.</h2>
            <p className="feature-text">
              Visualize your 4-year path.<br />
              Don't miss a prerequisite.
            </p>
          </div>
          <div className="feature-image">
            <div className="mockup-grid">
              <div className="grid-row">
                <div className="grid-item completed">Year 1</div>
                <div className="grid-item completed">Year 2</div>
              </div>
              <div className="grid-row">
                <div className="grid-item current">Year 3</div>
                <div className="grid-item pending">Year 4</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturePreview

