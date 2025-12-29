import React, { useState, useEffect } from 'react'
import { calculateSensitivity } from '../utils/scenarioComparison'
import './ScenarioComparator.css'

const ScenarioComparator = ({ scenarioA, scenarioB, onClose }) => {
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysisMethod, setAnalysisMethod] = useState('estimated')

  useEffect(() => {
    if (!scenarioA || !scenarioB) {
      setLoading(false)
      return
    }

    const loadComparison = async () => {
      setLoading(true)
      try {
        const result = await calculateSensitivity(scenarioA, scenarioB)
        setComparison(result)
        setAnalysisMethod(result.analysisMethod || 'estimated')
      } catch (error) {
        console.error('Error calculating comparison:', error)
        // Fallback to sync version
        const { calculateSensitivitySync } = await import('../utils/scenarioComparison')
        const result = calculateSensitivitySync(scenarioA, scenarioB)
        setComparison(result)
        setAnalysisMethod('estimated')
      } finally {
        setLoading(false)
      }
    }

    loadComparison()
  }, [scenarioA, scenarioB])

  if (!scenarioA || !scenarioB) {
    return null
  }

  if (loading) {
    return (
      <div className="scenario-comparator">
        <div className="comparator-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing scenarios...</p>
        </div>
      </div>
    )
  }

  if (!comparison) {
    return (
      <div className="scenario-comparator">
        <div className="comparator-error">
          <p>Unable to analyze scenarios. Please try again.</p>
        </div>
      </div>
    )
  }

  const { deltas, inputDifferences, primaryDriver, recommendations, summary } = comparison

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatScore = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}`
  }

  const getDeltaColor = (delta) => {
    if (delta > 0) return '#28a745' // Green
    if (delta < 0) return '#dc3545' // Red
    return '#6c757d' // Gray
  }

  const getDeltaIcon = (delta) => {
    if (delta > 0) return '↑'
    if (delta < 0) return '↓'
    return '→'
  }

  return (
    <div className="scenario-comparator">
      <div className="comparator-header">
        <div className="header-left">
          <h2>Scenario Comparison</h2>
          {/* Analysis Method Badge */}
          <div className={`analysis-method-badge ${analysisMethod === 'ai' ? 'ai-mode' : 'estimated-mode'}`}>
            {analysisMethod === 'ai' ? (
              <>
                <span className="badge-icon">🤖</span>
                <span>AI 精确分析 (Gemini)</span>
              </>
            ) : (
              <>
                <span className="badge-icon">📊</span>
                <span>智能估算</span>
              </>
            )}
          </div>
        </div>
        {onClose && (
          <button className="comparator-close" onClick={onClose}>×</button>
        )}
      </div>

      <div className="comparator-content">
        {/* Summary Card */}
        <div className="comparison-summary">
          <div className="summary-item">
            <span className="summary-label">Probability Change</span>
            <span 
              className="summary-value" 
              style={{ color: getDeltaColor(deltas.probability.delta) }}
            >
              {formatPercentage(deltas.probability.delta)}
            </span>
            <span className="summary-detail">
              {deltas.probability.from.toFixed(1)}% → {deltas.probability.to.toFixed(1)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Final Score Change</span>
            <span 
              className="summary-value" 
              style={{ color: getDeltaColor(deltas.finalScore.delta) }}
            >
              {formatScore(deltas.finalScore.delta)}
            </span>
            <span className="summary-detail">
              {deltas.finalScore.from.toFixed(2)} → {deltas.finalScore.to.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Side-by-side Comparison */}
        <div className="comparison-grid">
          {/* Scenario A */}
          <div className="scenario-card scenario-a">
            <div className="scenario-header">
              <h3>{scenarioA.scenario_name}</h3>
              <span className="scenario-program">{scenarioA.program_id}</span>
            </div>
            <div className="scenario-results">
              <div className="result-item">
                <span className="result-label">Probability</span>
                <span className="result-value" style={{ color: '#6c757d' }}>
                  {deltas.probability.from.toFixed(1)}%
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Final Score</span>
                <span className="result-value">{deltas.finalScore.from.toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Academic</span>
                <span className="result-value">{deltas.academicScore.from.toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Profile</span>
                <span className="result-value">{deltas.profileScore.from.toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Category</span>
                <span className="result-badge">{deltas.category.from}</span>
              </div>
            </div>
          </div>

          {/* Delta Column */}
          <div className="delta-column">
            <div className="delta-item">
              <span className="delta-icon" style={{ color: getDeltaColor(deltas.probability.delta) }}>
                {getDeltaIcon(deltas.probability.delta)}
              </span>
              <span className="delta-value" style={{ color: getDeltaColor(deltas.probability.delta) }}>
                {formatPercentage(deltas.probability.delta)}
              </span>
            </div>
            <div className="delta-item">
              <span className="delta-icon" style={{ color: getDeltaColor(deltas.finalScore.delta) }}>
                {getDeltaIcon(deltas.finalScore.delta)}
              </span>
              <span className="delta-value" style={{ color: getDeltaColor(deltas.finalScore.delta) }}>
                {formatScore(deltas.finalScore.delta)}
              </span>
            </div>
            <div className="delta-item">
              <span className="delta-icon" style={{ color: getDeltaColor(deltas.academicScore.delta) }}>
                {getDeltaIcon(deltas.academicScore.delta)}
              </span>
              <span className="delta-value" style={{ color: getDeltaColor(deltas.academicScore.delta) }}>
                {formatScore(deltas.academicScore.delta)}
              </span>
            </div>
            <div className="delta-item">
              <span className="delta-icon" style={{ color: getDeltaColor(deltas.profileScore.delta) }}>
                {getDeltaIcon(deltas.profileScore.delta)}
              </span>
              <span className="delta-value" style={{ color: getDeltaColor(deltas.profileScore.delta) }}>
                {formatScore(deltas.profileScore.delta)}
              </span>
            </div>
          </div>

          {/* Scenario B */}
          <div className="scenario-card scenario-b">
            <div className="scenario-header">
              <h3>{scenarioB.scenario_name}</h3>
              <span className="scenario-program">{scenarioB.program_id}</span>
            </div>
            <div className="scenario-results">
              <div className="result-item">
                <span className="result-label">Probability</span>
                <span className="result-value" style={{ color: '#6c757d' }}>
                  {deltas.probability.to.toFixed(1)}%
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Final Score</span>
                <span className="result-value">{deltas.finalScore.to.toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Academic</span>
                <span className="result-value">{deltas.academicScore.to.toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Profile</span>
                <span className="result-value">{deltas.profileScore.to.toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Category</span>
                <span className="result-badge">{deltas.category.to}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Driver Analysis */}
        {primaryDriver && (
          <div className="primary-driver-section">
            <h3>Primary Driver Analysis</h3>
            <div className="driver-card">
              <div className="driver-header">
                <span className="driver-label">{primaryDriver.label}</span>
                <span className="driver-impact">
                  {Math.abs(primaryDriver.percentage).toFixed(0)}% impact
                </span>
              </div>
              <div className="driver-details">
                {primaryDriver.inputDelta !== undefined && (
                  <div className="driver-detail">
                    <span>Change:</span>
                    <span className="driver-value">
                      {primaryDriver.inputDelta > 0 ? '+' : ''}{primaryDriver.inputDelta.toFixed(1)}
                      {primaryDriver.field === 'gpa' || primaryDriver.field.startsWith('core_') ? '%' : ''}
                    </span>
                  </div>
                )}
                <div className="driver-detail">
                  <span>Contribution:</span>
                  <span className="driver-value">
                    {Math.abs(primaryDriver.percentage).toFixed(0)}% of total change
                  </span>
                </div>
                {primaryDriver.reasoning && (
                  <div className="driver-reasoning">
                    <span className="reasoning-label">分析说明:</span>
                    <span className="reasoning-text">{primaryDriver.reasoning}</span>
                  </div>
                )}
                {primaryDriver.impact && (
                  <div className="driver-impact-text">
                    <span className="impact-label">影响评估:</span>
                    <span className="impact-text">{primaryDriver.impact}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h3>Key Insights</h3>
            <ul className="recommendations-list">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Input Differences */}
        {Object.keys(inputDifferences).length > 0 && (
          <div className="input-differences-section">
            <h3>Input Changes</h3>
            <div className="input-diffs-grid">
              {Object.entries(inputDifferences).map(([key, diff]) => {
                if (key === 'courseStatus' || key === 'coreSubjectScores') {
                  return null // Handle these separately
                }
                return (
                  <div key={key} className="input-diff-item">
                    <span className="input-diff-label">{key}</span>
                    <span className="input-diff-value">
                      {diff.from} → {diff.to}
                      {diff.delta !== undefined && (
                        <span className="input-diff-delta" style={{ color: getDeltaColor(diff.delta) }}>
                          {diff.delta > 0 ? '+' : ''}{diff.delta.toFixed(1)}
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScenarioComparator

