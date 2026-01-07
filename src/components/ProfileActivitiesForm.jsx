import React from 'react';
import { calculateProfileScoreV2, validateActivity, createEmptyActivity } from '../utils/profileScoringV2';
import './ProfileActivitiesForm.css';

const ProfileActivitiesForm = ({ activities, onChange, legacyRatings, gradeTrend }) => {
  const maxActivities = 8;

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
        Add up to 8 structured activities for evidence-based scoring. Each activity is scored individually (max 20 points).
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
                  <label>Years (0-4) *</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={activity.years || 0}
                    onChange={(e) => handleActivityChange(index, 'years', e.target.value)}
                  />
                </div>

                <div className="activity-field">
                  <label>Hours/Week (0-30) *</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
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
                      const categoryBase = { 'EC': 2, 'Work': 3, 'Volunteer': 2, 'Award': 4, 'Research': 4 };
                      const rolePoints = { 'member': 0, 'executive': 2, 'founder': 3 };
                      const relevancePoints = { 'high': 2, 'medium': 1, 'low': 0 };
                      
                      const hours = Math.min(30, Math.max(0, activity.hoursPerWeek || 0));
                      let hoursPoints = hours <= 12 ? hours / 2 : 6 + (hours - 12) / 6;
                      hoursPoints = Math.min(6, hoursPoints);
                      
                      const points = Math.min(20,
                        (categoryBase[activity.category] || 1) +
                        Math.min(5, activity.years || 0) +
                        hoursPoints +
                        (rolePoints[activity.role] || 0) +
                        (relevancePoints[activity.relevance] || 0) +
                        (activity.impactEvidence ? 2 : 0)
                      );
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

