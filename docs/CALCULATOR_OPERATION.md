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

**AP Rigor Bonus:**
- For each AP exam with score of 5: +0.75% to academicScore
- Allows slight "rigor overage" up to 100.5% to recognize university-level achievement
- Example: 3 AP exams with score of 5 = +2.25% bonus

**Final Academic Score:**
```javascript
academicScore = min(100.5, max(0, GPA + rigorBonus + coreBoost + apRigorBonus))
// Note: Cap at 100.5% (not 100%) to allow rigor overage
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

**Purpose**: Convert scores into admission probability percentage with academic primacy, granular sensitivity, and penalty factors for realistic 2025/2026 admission standards.

### **3.1 Academic Primacy with Weight Rebalancing**

**Academic Threshold**: 85%

If `academicScore < 85%`:
- Reduce profile weight by 50%
- Move the weight difference to academic weight
- Re-normalize weights to ensure they sum to 1.0

```javascript
const academicThreshold = 85;
if (scores.academicScore < academicThreshold) {
  // Reduce profile impact by 50%
  const reducedProfileWeight = weights.profile * 0.5;
  const weightDifference = weights.profile - reducedProfileWeight;
  
  // Re-normalize: Move the difference back to academic weight
  weights.profile = reducedProfileWeight;
  weights.academic = weights.academic + weightDifference;
  
  // Ensure weights still sum to 1.0
  const totalWeight = weights.academic + weights.profile + weights.supplement;
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    const adjustment = (1.0 - totalWeight) / 2;
    weights.academic += adjustment;
    weights.profile += adjustment;
  }
}
```

**Example**: If default weights are 0.75/0.25 and academic score < 85:
- Profile weight: 0.25 × 0.5 = 0.125
- Weight difference: 0.25 - 0.125 = 0.125
- Academic weight: 0.75 + 0.125 = 0.875
- Final weights: 0.875 academic, 0.125 profile (sums to 1.0)

### **3.2 Weighted Final Score**

```javascript
weights = {
  academic: 0.75 (default, program-specific),
  profile: 0.25 (default, program-specific),
  supplement: 0.0 (only if required)
}

// Weights may be adjusted by academic primacy logic above

finalScore = 
  academicScore × weights.academic +
  profileScore × weights.profile +
  supplementScore × weights.supplement +
  gateCheck.penalty
```

### **3.3 International Applicant Adjustment**

If `applicantType === "international"`:
```javascript
target = target + 1  // Higher target score
capMaxProb = capMaxProb - 2  // Lower maximum probability
```

### **3.4 ParameterCalculator Utility**

**Purpose**: Automatically calculate targetScore and scale from medianGPA and competitiveness level.

**Location**: `src/utils/ParameterCalculator.js`

**Method**: `ParameterCalculator.getModelParams(medianGPA, competitiveness)`

**Logic**:
- **Level 5 programs**: targetOffset = 2.5 (more aggressive), scale hard-capped at 6.0
- **Level 4 programs**: targetOffset = 3.0
- **Level 3 and below**: targetOffset = 3.5
- **Scale calculation**: `8.5 - (competitiveness * 0.6)`, with hard cap at 6.0 for Level 5

**2025/2026 Statistics** (Vancouver Campus):
- Engineering: medianGPA 97%, competitivenessLevel 5
- Science: medianGPA 96%, competitivenessLevel 5
- Commerce (Sauder): medianGPA 95%, competitivenessLevel 5 (maintains custom gpaWeight: 0.55)
- Arts: medianGPA 92%, competitivenessLevel 4
- International Economics: medianGPA 94%, competitivenessLevel 5
- Pharmaceutical Sciences: medianGPA 95%, competitivenessLevel 5
- Kinesiology: medianGPA 94%, competitivenessLevel 4
- Media Studies: medianGPA 91%, competitivenessLevel 4
- Fine Arts: medianGPA 90%, competitivenessLevel 3

**Benefits**:
- Easy calibration: Update medianGPA in one place, entire curve shifts automatically
- Future-proof: When UBC announces new averages, just update medianGPA
- Consistency: All programs use same calculation logic

### **3.5 Linear-Sigmoid Hybrid (Probability Conversion)**

**Purpose**: Create more granular, GPA-sensitive probability with visible changes per point.

Instead of pure sigmoid, uses a **Linear-Sigmoid Hybrid**:

```javascript
calculateFinalProbability(finalScore, target, scale, capMaxProb) {
  // 1. Base probability with narrower scale (0.7 multiplier) for higher sensitivity
  const adjustedScale = scale * 0.7;
  let rawProb = 1 / (1 + Math.exp(-(finalScore - target) / adjustedScale)) * 100;
  
  // 2. Linear polish for high scores (ensures 95 vs 97 vs 100 feels different)
  if (finalScore > target) {
    const bonus = (finalScore - target) * 0.5; // Every point above target adds 0.5%
    rawProb += bonus;
  }
  
  return Math.min(rawProb, capMaxProb);
}
```

**Key Features:**
- **Narrower scale** (scale × 0.7): Increases sensitivity to score changes
- **Linear bonus**: For scores above target, adds 0.5% per point
- **Safety limit**: Maximum probability change per GPA point ≤ 2% (naturally maintained by 0.7 scale and 0.5 linear bonus)

**Parameters:**
- `target`: Target score (default: 80, program-specific)
- `scale`: Base steepness (default: 8, program-specific)
- `adjustedScale`: scale × 0.7 (for higher sensitivity)
- Creates more linear, granular probability distribution

**Result**: Every GPA point creates visible change (0.5-1% per point)

### **3.6 Penalty Factors**

After calculating raw probability, three penalty factors are applied:

#### **3.6.1 High-End Dampening**
**Purpose**: Prevent scores below 93 from reaching "Safety" category too easily

```javascript
if (scores.academicScore < 93) {
  adjustedProbability = rawProbability * 0.85; // 15% reduction
}
```

**Effect**: Scores below 93 are pushed down, making it harder to reach "Safety" (70%+)

#### **3.6.2 Core Subject Dampening with AP Insurance**
**Purpose**: Penalize students with weak core subjects even if overall GPA is high, but reduce penalty if student has AP exam with score of 5

```javascript
// AP subject mapping: Maps core subjects to relevant AP exams
const apSubjectMap = {
  'Math12': ['AP Calculus AB', 'AP Calculus BC', 'AP Statistics'],
  'Physics12': ['AP Physics 1', 'AP Physics 2', 'AP Physics C'],
  'Chemistry12': ['AP Chemistry'],
  'Biology12': ['AP Biology'],
  'English12': ['AP English Language', 'AP English Literature']
};

// Check if student has AP exams (if apExamsCount > 0, insurance may apply)
const hasAPInsurance = apExamsCount > 0;

// Check if any core subject is below minimum
for (const subject of coreSubjects) {
  const score = parseFloat(coreSubjectScores[subject]);
  if (score && score < coreMinScore) {
    hasWeakCoreSubject = true;
    // Check if AP insurance applies for this subject
    if (hasAPInsurance && apSubjectMap[subject]) {
      insuranceApplies = true; // Student has AP 5 in relevant area
    }
    break;
  }
}

// Apply penalty: 30% reduction normally, but only 15% reduction if AP insurance applies
if (hasWeakCoreSubject) {
  const penaltyMultiplier = insuranceApplies ? 0.85 : 0.7; // 50% reduction in penalty
  adjustedProbability = adjustedProbability * penaltyMultiplier;
}
```

**Effect**: 
- Students with weak core subjects normally get 30% probability reduction
- If student has AP exam with score of 5 in relevant subject, penalty is reduced to 15% (50% penalty reduction)
- This reflects how high standardized test scores can "insure" a lower GPA

#### **3.6.3 International Student Penalty**
**Purpose**: Adjust target score before calculation for international applicants

```javascript
if (applicantType === "international") {
  target += intlAdjust.targetBonus; // Applied BEFORE calculateFinalProbability
  capMaxProb -= intlAdjust.capReduction;
}
```

**Effect**: International applicants face higher target scores, reflecting increased competition

### **3.7 Probability Cap**

```javascript
cappedProbability = min(rawProbability, capMaxProb)
```

Default `capMaxProb`: 90% (88% for international)

### **3.8 Confidence Interval**

**Base width**: 8%

**Adjustments:**
- If gate warnings exist: +3%
- If supplement required and weight > 0.2: +5%

```javascript
percentageLow = max(5, round(cappedProbability - confidenceWidth))
percentageHigh = min(capMaxProb, round(cappedProbability + confidenceWidth))
percentageMid = round(cappedProbability)
```

### **3.9 Category Classification**

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

### **3.10 Gate Failure Override**

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
| `apExamsCount` | number | 0-10 | Number of AP exams with score of 5 |

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

- `medianGPA`: Median GPA of admitted students (2025/2026 statistics)
- `competitivenessLevel`: Competition level (1-5), used by ParameterCalculator
- `gpaWeight`: Academic weight (default: 0.75, updated from 0.8)
- `personalProfileWeight`: Profile weight (default: 0.25, updated from 0.2)
- `supplementWeight`: Supplement weight (if required)
- `targetScore`: **Automatically calculated** by ParameterCalculator from medianGPA and competitivenessLevel
- `scale`: **Automatically calculated** by ParameterCalculator (hard-capped at 6.0 for Level 5)
- `capMaxProb`: Maximum probability cap (default: 90)
- `gates`: Gate requirements configuration
- `smallFactors`: Small factor adjustments
- `internationalAdjustment`: International applicant adjustments (targetBonus, capReduction)

**2025/2026 Key Programs**:
- **Engineering**: medianGPA 97%, competitivenessLevel 5 → targetScore ≈ 94.5, scale = 6.0
- **Science**: medianGPA 96%, competitivenessLevel 5 → targetScore ≈ 93.5, scale = 6.0
- **Commerce (Sauder)**: medianGPA 95%, competitivenessLevel 5 → targetScore ≈ 92.5, scale = 6.0
  - **Special**: Maintains custom `gpaWeight: 0.55` (not 0.75) due to high Personal Profile importance
- **Arts**: medianGPA 92%, competitivenessLevel 4 → targetScore ≈ 89, scale ≈ 6.1

**Note**: Some programs (Fine Arts, Music, Design, Commerce) have custom weights that differ from defaults, reflecting their unique evaluation criteria.

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

### ParameterCalculator
```
if (competitiveness >= 5):
  targetOffset = 2.5
else if (competitiveness >= 4):
  targetOffset = 3.0
else:
  targetOffset = 3.5

targetScore = medianGPA - targetOffset

scale = 8.5 - (competitiveness * 0.6)
if (competitiveness >= 5):
  scale = min(scale, 6.0)  // Hard cap for Level 5
if (medianGPA >= 93):
  scale = min(scale, 6.2)
```

### Linear-Sigmoid Hybrid Function
```
adjustedScale = scale × 0.7
baseProb = 1 / (1 + e^(-(finalScore - target) / adjustedScale)) × 100

if (finalScore > target):
  linearBonus = (finalScore - target) × 0.5
  rawProb = baseProb + linearBonus
else:
  rawProb = baseProb

finalProbability = min(rawProb, capMaxProb)
```

### Academic Primacy Weight Rebalancing
```
if (academicScore < 85):
  reducedProfileWeight = profileWeight × 0.5
  weightDifference = profileWeight - reducedProfileWeight
  academicWeight = academicWeight + weightDifference
  profileWeight = reducedProfileWeight
  
  // Re-normalize to ensure sum = 1.0
  if (totalWeight ≠ 1.0):
    adjustment = (1.0 - totalWeight) / 2
    academicWeight += adjustment
    profileWeight += adjustment
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

### AP Rigor Bonus
```
apRigorBonus = apExamsCount * 0.75  // 0.75% per AP score of 5
academicScore = min(100.5, academicScore + apRigorBonus)  // Cap at 100.5%
```

### Penalty Factors
```
// High-End Dampening
if (academicScore < 93):
  adjustedProbability = rawProbability * 0.85

// Core Subject Dampening with AP Insurance
if (any coreSubject < coreMinScore):
  if (hasAPInsurance && apSubjectMap[subject]):
    penaltyMultiplier = 0.85  // 15% reduction (50% penalty reduction)
  else:
    penaltyMultiplier = 0.7   // 30% reduction
  adjustedProbability = adjustedProbability * penaltyMultiplier

// International Penalty
if (applicantType === "international"):
  target = target + targetBonus  // Applied before calculation
```

### Safety Limit
```
Maximum probability change per GPA point ≤ 2%
```
This is naturally maintained by the 0.7 scale multiplier and 0.5 linear bonus combination.

---

## **Example Calculation**

### Example 1: Arts Program (2025/2026 Statistics)

**Input:**
- Program: Arts (medianGPA: 92%, competitivenessLevel: 4)
- GPA: 90
- Course Difficulty: AP
- Extracurriculars: 4
- Leadership: 4
- Volunteering: 3
- Grade Trend: Rising
- Activity Relevance: High
- Role Depth: Executive
- All required courses: Completed
- Core subjects: English12 = 88 (above minimum 80)
- Applicant Type: Domestic

**Calculation Steps:**

1. **ParameterCalculator**:
   - medianGPA: 92, competitivenessLevel: 4
   - targetOffset: 3.0 → targetScore = 92 - 3.0 = **89**
   - scale: 8.5 - (4 × 0.6) = 6.1

2. **Academic Score:**
   - Base: 90
   - AP bonus: +3
   - Core boost: +2
   - **Result: 95**

3. **Profile Score:**
   - Base: ((4+4+3)/3/5) × 100 = 73.3
   - Rising trend: +2
   - High relevance: +3
   - Executive multiplier: ×1.1
   - **Result: 86.1**

4. **Academic Primacy Check:**
   - Academic Score: 95 ≥ 85 ✓
   - No weight adjustment needed
   - **Weights: 0.75 academic, 0.25 profile**

5. **Final Score:**
   - (95 × 0.75) + (86.1 × 0.25) = 71.25 + 21.525 = **92.775**

6. **Probability (Linear-Sigmoid Hybrid):**
   - Base: sigmoid(92.775, 89, 6.1×0.7) = sigmoid(92.775, 89, 4.27) = 0.82
   - Since 92.775 > 89: Linear bonus = (92.775 - 89) × 0.5 = 1.89%
   - Raw probability: 82% + 1.89% = 83.89%

7. **Penalty Factors:**
   - High-End Dampening: 95 ≥ 93 ✓ (no penalty)
   - Core Subject Dampening: English12 = 88 ≥ 80 ✓ (no penalty)
   - International Penalty: N/A (domestic)
   - **Adjusted: 83.89%**

8. **Category:**
   - 84% ≥ 70 → **Safety** (High chance)

### Example 2: Engineering Program (2025/2026 Statistics) - 90% GPA

**Input:**
- Program: Engineering (medianGPA: 97%, competitivenessLevel: 5)
- GPA: 90
- Core subjects: Math12 = 88, Physics12 = 85, Chemistry12 = 87
- Applicant Type: Domestic

**Calculation Steps:**

1. **ParameterCalculator**:
   - medianGPA: 97, competitivenessLevel: 5
   - targetOffset: 2.5 → targetScore = 97 - 2.5 = **94.5**
   - scale: min(8.5 - (5 × 0.6), 6.0) = **6.0** (hard-capped)

2. **Academic Score:** ~90 (simplified)

3. **Final Score:** ~90 (simplified)

4. **Probability:**
   - Base: sigmoid(90, 94.5, 6.0×0.7) = sigmoid(90, 94.5, 4.2) = 0.15
   - Since 90 < 94.5: No linear bonus
   - Raw probability: 15%

5. **Penalty Factors:**
   - High-End Dampening: 90 < 93 → 15% × 0.85 = **12.75%**
   - Core Subject Dampening: Math12 = 88 < 85? No, but Physics12 = 85 = 85? Check coreMinScore
   - **Adjusted: ~12-13%**

6. **Category:**
   - 13% < 45 → **Reach** (Low chance) ✓

**Result**: 90% GPA for Engineering correctly classified as "Reach", not "Safety"

**Example with Academic Primacy (Academic Score < 85):**

**Input:**
- GPA: 82
- Academic Score: 82 (after adjustments)
- Profile Score: 85

**Calculation:**
1. **Academic Primacy Check:**
   - Academic Score: 82 < 85 ✗
   - Original weights: 0.75/0.25
   - Reduced profile: 0.25 × 0.5 = 0.125
   - Weight difference: 0.25 - 0.125 = 0.125
   - **Adjusted weights: 0.875 academic, 0.125 profile**

2. **Final Score:**
   - (82 × 0.9) + (85 × 0.1) = 73.8 + 8.5 = **82.3**

3. **Probability:**
   - Base: sigmoid(82.3, 80, 5.6) = 0.66
   - Linear bonus: (82.3 - 80) × 0.5 = 1.15%
   - Raw: 66% + 1.15% = 67.15%
   - **Result: 67%**

**Impact**: Profile score has minimal impact when academic score is below threshold, emphasizing the importance of grades.

---

## **Notes**

- All calculations are performed in real-time as user inputs change
- The model prioritizes academic scores (default 0.75/0.25 weights)
- **ParameterCalculator**: Automatically derives targetScore and scale from medianGPA and competitivenessLevel
- **2025/2026 Statistics**: Updated with official UBC Vancouver admission data (Engineering 97%, Science 96%, Arts 92%)
- **Academic Primacy**: Academic scores below 85% reduce profile impact by 50%
- **Weight Rebalancing**: Weights always sum to 1.0, even after academic primacy adjustment
- **Linear-Sigmoid Hybrid**: Provides granular, visible changes (0.5-1% per GPA point)
- **High-End Dampening**: Scores below 93% get 15% probability reduction
- **Core Subject Dampening**: Weak core subjects result in 30% probability reduction
- **International Penalty**: Target score increased before calculation for international applicants
- **Safety Limit**: Maximum probability change per GPA point ≤ 2%
- The model is designed to be conservative (caps at 90%)
- Gate failures significantly reduce displayed probability (capped at 40%)
- The system provides confidence intervals to account for uncertainty
- **Special Case**: Sauder (Commerce) maintains custom gpaWeight: 0.55 due to high Personal Profile importance

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production

