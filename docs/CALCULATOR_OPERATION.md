# UBC Admission Calculator - Complete Operation Details

## Overview

The UBC PathFinder admission calculator uses a sophisticated **4-layer evaluation model** to calculate admission probability. This document provides complete technical details of how the calculator operates.

---

## **4-Layer Model Overview**

```
LAYER 1: Gate Check (Hard Thresholds)
    ↓
LAYER 2: Score Calculation (Academic + Profile + Supplement)
    ↓
LAYER 3: Probability Calculation (Sigmoid Function + Adjustments)
    ↓
LAYER 4: Explanation Generation (Warnings + Recommendations)
```

---

## **LAYER 1: Gate Check (Hard Thresholds)**

**Purpose**: Verify if minimum requirements are met before calculating probability.

### **1.1 Required Course Check**

- Checks course completion status for all required courses
- Status options: `completed`, `inProgress`, `notTaken`
- Penalties applied:
  - `completed`: 0 penalty
  - `inProgress`: -5 points
  - `notTaken`: -30 points per missing course

**Special Case: Science12_2** (need 2 science courses)
- Counts completed + in-progress science courses
- If < 2 completed, applies penalty

### **1.2 Core Subject Minimum Score Check**

- Checks core subject scores (Math12, English12, etc.)
- Default minimum: 75% (configurable per program)
- Penalty calculation:
  ```
  deficit = coreMinScore - actualScore
  penalty = min(deficit × 0.5, 15) per subject
  ```
- Maximum penalty: 15 points per subject

### **1.3 Supplement Material Check**

- Flags if program requires portfolio/audition/interview
- Adds warning if supplement is required but not submitted

**Output**: `gateCheck` object with:
- `passed`: boolean
- `penalty`: total penalty points
- `missingCourses`: array
- `warnings`: array
- `supplementRequired`: boolean

---

## **LAYER 2: Score Calculation**

**Purpose**: Calculate three component scores (0-100 each).

### **2.1 Academic Score (0-100)**

**Base Calculation:**
```javascript
academicScore = GPA (0-100)
```

**Course Rigor Bonus:**
- `regular`: +0 points
- `ap`: +3 points
- `ib`: +5 points

**Core Subject Boost/Penalty:**
- For each core subject:
  - If score ≥ (coreMin + 5): +2 points boost
  - If score < coreMin: -3 points penalty
- Applied to all core subjects

**Final Academic Score:**
```javascript
academicScore = min(100, max(0, GPA + rigorBonus + coreBoost))
```

### **2.2 Profile Score (0-100)**

**Base Calculation:**
```javascript
ec = extracurriculars (1-5)
leadership = leadership (1-5)
volunteering = volunteering (1-5)

profileScore = ((ec + leadership + volunteering) / 3 / 5) × 100
```

**Small Factors Adjustments:**

1. **Grade Trend:**
   - `rising`: +3 points
   - `stable`: +0 points
   - `declining`: -4 points

2. **Activity Relevance:**
   - `high`: +3 points
   - `medium`: +1 point
   - `low`: -1 point

3. **Role Depth Multiplier:**
   - `founder`: ×1.2
   - `executive`: ×1.1
   - `member`: ×1.0

**Final Profile Score:**
```javascript
profileScore = min(100, max(0, baseProfileScore + trendBonus + relevanceBonus)) × depthMultiplier
```

### **2.3 Supplement Score (0-100)**

- Only for programs requiring portfolio/audition/interview
- User input: 0-100
- Default: 50 if not provided

---

## **LAYER 3: Probability Calculation**

**Purpose**: Convert scores into admission probability percentage.

### **3.1 Weighted Final Score**

```javascript
weights = {
  academic: 0.7 (default, program-specific),
  profile: 0.3 (default, program-specific),
  supplement: 0.0 (only if required)
}

finalScore = 
  academicScore × weights.academic +
  profileScore × weights.profile +
  supplementScore × weights.supplement +
  gateCheck.penalty
```

### **3.2 International Applicant Adjustment**

If `applicantType === "international"`:
```javascript
target = target + 1  // Higher target score
capMaxProb = capMaxProb - 2  // Lower maximum probability
```

### **3.3 Sigmoid Function (Probability Conversion)**

```javascript
sigmoid(x, target, scale) = 1 / (1 + exp(-(x - target) / scale))

rawProbability = sigmoid(finalScore, target, scale) × 100
```

**Parameters:**
- `target`: Target score (default: 80, program-specific)
- `scale`: Steepness (default: 8, program-specific)
- Creates S-curve probability distribution

### **3.4 Probability Cap**

```javascript
cappedProbability = min(rawProbability, capMaxProb)
```

Default `capMaxProb`: 90% (88% for international)

### **3.5 Confidence Interval**

**Base width**: 8%

**Adjustments:**
- If gate warnings exist: +3%
- If supplement required and weight > 0.2: +5%

```javascript
percentageLow = max(5, round(cappedProbability - confidenceWidth))
percentageHigh = min(capMaxProb, round(cappedProbability + confidenceWidth))
percentageMid = round(cappedProbability)
```

### **3.6 Category Classification**

```javascript
if (percentageMid >= 70) {
  chance = "High"
  color = "#28a745" (green)
  category = "Safety"
} else if (percentageMid >= 45) {
  chance = "Medium"
  color = "#ffc107" (yellow)
  category = "Match"
} else {
  chance = "Low"
  color = "#dc3545" (red)
  category = "Reach"
}
```

### **3.7 Gate Failure Override**

If `gateCheck.passed === false`:
- Cap displayed percentage at 40%
- Force category to "Reach"
- Force chance to "Low"
- Adjust confidence interval accordingly

---

## **LAYER 4: Explanation Generation**

**Purpose**: Generate warnings, insights, and recommendations.

### **4.1 Gate Issues (Critical)**
- Missing courses warning
- Core subject below minimum warning
- Supplement required warning

### **4.2 Score-Based Insights**
- Academic score too low (if weight > 0.5 and score < 85)
- Profile score too low (if weight > 0.35 and score < 80)

### **4.3 Top 2 Improvement Actions**

Priority order:
1. Take missing required courses
2. Improve GPA to 90+ (if academic weight > 0.5)
3. Increase depth of relevant activities (if profile weight > 0.3)
4. Prepare high-quality supplement material (if required)

---

## **Input Parameters**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `gpa` | number | 0-100 | Grade point average |
| `courseDifficulty` | string | regular/ap/ib | Course rigor level |
| `extracurriculars` | number | 1-5 | Extracurricular rating |
| `leadership` | number | 1-5 | Leadership rating |
| `volunteering` | number | 1-5 | Volunteer rating |
| `supplementScore` | number | 0-100 | Portfolio/audition score |
| `applicantType` | string | domestic/international | Applicant type |
| `gradeTrend` | string | rising/stable/declining | Grade trend |
| `activityRelevance` | string | high/medium/low | Activity relevance |
| `roleDepth` | string | founder/executive/member | Role depth |
| `courseStatus` | object | completed/inProgress/notTaken | Course completion status |
| `coreSubjectScores` | object | 0-100 | Individual subject scores |

---

## **Output Results**

```javascript
{
  percentage: 65,                    // Main probability (mid-point)
  percentageRange: {                  // Confidence interval
    low: 57,
    high: 73
  },
  chance: "Medium",                  // High/Medium/Low
  category: "Match",                  // Safety/Match/Reach
  color: "#ffc107",                   // Display color
  finalScore: 78.5,                  // Weighted final score
  academicScore: 85.2,               // Academic component
  profileScore: 72.8,                // Profile component
  supplementScore: null,              // Supplement (if applicable)
  gateCheck: { ... },                // Gate check results
  explanation: {                      // Explanations and advice
    explanations: [...],
    topActions: [...],
    overallAdvice: "..."
  }
}
```

---

## **Real-Time Calculation**

- Uses `useMemo` hook for performance optimization
- Recalculates automatically when any input changes
- No button click required
- Updates instantly as user types

---

## **Program-Specific Configuration**

Each program has custom settings in `src/data/facultiesData.js`:

- `gpaWeight`: Academic weight (default: 0.7)
- `personalProfileWeight`: Profile weight (default: 0.3)
- `supplementWeight`: Supplement weight (if required)
- `targetScore`: Sigmoid target (default: 80)
- `scale`: Sigmoid steepness (default: 8)
- `capMaxProb`: Maximum probability cap (default: 90)
- `gates`: Gate requirements configuration
- `smallFactors`: Small factor adjustments

---

## **Implementation Location**

**Main File**: `src/pages/ApplyInfoPage.jsx`

**Key Functions:**
- `checkGateRequirements()` - Layer 1
- `calculateScores()` - Layer 2
- `calculateProbability()` - Layer 3
- `generateExplanation()` - Layer 4
- `sigmoid()` - Helper function

**Data Source**: `src/data/facultiesData.js`

---

## **Mathematical Formulas**

### Sigmoid Function
```
sigmoid(x, target, scale) = 1 / (1 + e^(-(x - target) / scale))
```

### Weighted Final Score
```
finalScore = (academicScore × academicWeight) + 
             (profileScore × profileWeight) + 
             (supplementScore × supplementWeight) + 
             gatePenalty
```

### Profile Score Base
```
profileScore = ((extracurriculars + leadership + volunteering) / 3 / 5) × 100
```

### Core Subject Penalty
```
penalty = min((coreMinScore - actualScore) × 0.5, 15)
```

---

## **Example Calculation**

**Input:**
- GPA: 88
- Course Difficulty: AP
- Extracurriculars: 4
- Leadership: 4
- Volunteering: 3
- Grade Trend: Rising
- Activity Relevance: High
- Role Depth: Executive
- All required courses: Completed
- Core subjects: All above minimum

**Calculation Steps:**

1. **Academic Score:**
   - Base: 88
   - AP bonus: +3
   - Core boost: +2
   - **Result: 93**

2. **Profile Score:**
   - Base: ((4+4+3)/3/5) × 100 = 73.3
   - Rising trend: +3
   - High relevance: +3
   - Executive multiplier: ×1.1
   - **Result: 87.2**

3. **Final Score:**
   - (93 × 0.7) + (87.2 × 0.3) = 65.1 + 26.2 = **91.3**

4. **Probability:**
   - Sigmoid(91.3, 80, 8) = 0.92
   - **Result: 92%** (capped at 90%)

5. **Category:**
   - 90% ≥ 70 → **Safety** (High chance)

---

## **Notes**

- All calculations are performed in real-time as user inputs change
- The model is designed to be conservative (caps at 90%)
- International applicants have slightly adjusted parameters
- Gate failures significantly reduce displayed probability
- The system provides confidence intervals to account for uncertainty

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production

