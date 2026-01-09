import React from 'react';
import { calculateProfileScoreV2, validateActivity, createEmptyActivity } from '../utils/profileScoringV2';
import './ProfileActivitiesForm.css';

const ProfileActivitiesForm = ({ activities, onChange, legacyRatings, gradeTrend }) => {
  const maxActivities = 5;

  const handleAddActivity = () => {
    if (activities.length < maxActivities) {
      const newActivity = createEmptyActivity();
      onChange([...activities, newActivity]);
    }
  };

  const handleRemoveActivity = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleActivityChange = (index, field, value) => {
    const updated = [...activities];
    updated[index] = {
      ...updated[index],
      [field]: field === 'impactEvidence' ? value : (field === 'years' || field === 'hoursPerWeek' ? parseFloat(value) || 0 : value)
    };
    onChange(updated);
  };

  // Calculate preview score if activities exist
  const previewScore = activities.length > 0 ? calculateProfileScoreV2(activities, legacyRatings) : null;

  return (
    <div className="profile-activities-form">
      <div className="activities-header">
        <h4 className="activities-title">Activities</h4>
      </div>

      <p className="activities-description">
        Add up to 5 structured activities for evidence-based scoring. Each activity is scored individually (max 20 points).
      </p>

      {previewScore && activities.length > 0 && (
        <div className="profile-preview">
          <span className="preview-label">Profile Score Preview:</span>
          <span className="preview-value">{previewScore.score.toFixed(1)}/100</span>
        </div>
      )}

      <div className="activities-list">
        {activities.map((activity, index) => {
          const validation = validateActivity(activity);
          return (
            <div key={index} className="activity-item">
              <div className="activity-header">
                <span className="activity-number">Activity {index + 1}</span>
                {activities.length > 0 && (
                  <button
                    type="button"
                    className="btn-remove-activity"
                    onClick={() => handleRemoveActivity(index)}
                    title="Remove activity"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="activity-fields">
                <div className="activity-field">
                  <label>Category *</label>
                  <select
                    value={activity.category || 'EC'}
                    onChange={(e) => handleActivityChange(index, 'category', e.target.value)}
                  >
                    <option value="EC">EC (Extracurricular)</option>
                    <option value="Work">Work</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Award">Award</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div className="activity-field">
                  <label>Years (0-5+) *</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={activity.years || 0}
                    onChange={(e) => handleActivityChange(index, 'years', e.target.value)}
                  />
                </div>

                <div className="activity-field">
                  <label>Hours/Week (0-15) *</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={activity.hoursPerWeek || 0}
                    onChange={(e) => handleActivityChange(index, 'hoursPerWeek', e.target.value)}
                  />
                </div>

                <div className="activity-field">
                  <label>Role *</label>
                  <select
                    value={activity.role || 'member'}
                    onChange={(e) => handleActivityChange(index, 'role', e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="executive">Executive</option>
                    <option value="founder">Founder</option>
                  </select>
                </div>

                <div className="activity-field">
                  <label>Relevance *</label>
                  <select
                    value={activity.relevance || 'medium'}
                    onChange={(e) => handleActivityChange(index, 'relevance', e.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="activity-field activity-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={activity.impactEvidence || false}
                      onChange={(e) => handleActivityChange(index, 'impactEvidence', e.target.checked)}
                    />
                    <span>Impact Evidence (quantified outcome)</span>
                  </label>
                </div>
              </div>

              {!validation.valid && validation.errors.length > 0 && (
                <div className="activity-errors">
                  {validation.errors.map((error, errIdx) => (
                    <span key={errIdx} className="error-message">{error}</span>
                  ))}
                </div>
              )}

              {validation.valid && (
                <div className="activity-score-preview">
                  <span className="score-label">Activity Score:</span>
                  <span className="score-value">
                    {(() => {
                      // Exact same logic as scoreActivity in profileScoringV2.js
                      // 1. Category Base (Fixed Points)
                      const categoryBase = { 'Work': 4.0, 'Award': 4.0, 'Research': 3.5, 'EC': 3.5, 'Volunteer': 3.0 };
                      const basePoints = categoryBase[activity.category] || 1;
                      
                      // 2. Years of Involvement (Lookup Table)
                      const years = activity.years || 0;
                      let yearsPoints;
                      if (years >= 4) {
                        yearsPoints = 5.0; // 4+ years = 5.0 points
                      } else {
                        const yearsInt = Math.floor(years);
                        switch (yearsInt) {
                          case 0:
                            yearsPoints = 3.0;
                            break;
                          case 1:
                            yearsPoints = 3.5;
                            break;
                          case 2:
                            yearsPoints = 4.0;
                            break;
                          case 3:
                            yearsPoints = 4.5;
                            break;
                          default:
                            yearsPoints = 5.0;
                            break;
                        }
                      }
                      
                      // 3. Hours Per Week (Linear scale, capped at 15)
                      const hours = Math.max(0, activity.hoursPerWeek || 0);
                      const hoursPoints = Math.min(hours, 15) * 0.4;
                      
                      // 4. Role Depth
                      const rolePoints = { 'member': 1.5, 'executive': 2.0, 'founder': 3.0 };
                      const roleScore = rolePoints[activity.role] || 0;
                      
                      // 5. Relevance
                      const relevancePoints = { 'low': 1.0, 'medium': 1.5, 'high': 2.0 };
                      const relevanceScore = relevancePoints[activity.relevance] || 0;
                      
                      // 6. Impact Evidence
                      const impactScore = activity.impactEvidence ? 2 : 0;
                      
                      // Calculate total and cap at 20
                      const points = Math.min(20, basePoints + yearsPoints + hoursPoints + roleScore + relevanceScore + impactScore);
                      return points.toFixed(1);
                    })()}/20
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activities.length < maxActivities && (
        <button
          type="button"
          className="btn-add-activity"
          onClick={handleAddActivity}
        >
          + Add Activity ({activities.length}/{maxActivities})
        </button>
      )}

      {activities.length >= maxActivities && (
        <p className="max-activities-note">Maximum of {maxActivities} activities reached.</p>
      )}

      {activities.length === 0 && (
        <div className="no-activities-hint">
          <p>No activities added. Add activities to calculate your profile score.</p>
          <button
            type="button"
            className="btn-add-activity"
            onClick={handleAddActivity}
          >
            + Add Your First Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileActivitiesForm;

