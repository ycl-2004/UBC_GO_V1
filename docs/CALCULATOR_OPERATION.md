# UBC Admission Calculator - Complete Operation Details

**Last Updated**: January 2025  
**Version**: 4.2  
**Status**: Production

---

## Overview

The UBC PathFinder admission calculator uses a sophisticated **4-layer evaluation model** to calculate admission probability. This document provides complete technical details of how the calculator operates.

---

## **4-Layer Model Overview**

```
LAYER 1: Gate Check (Hard Thresholds + Soft Adjustments)
    ↓
LAYER 2: Score Calculation (Academic + Profile + Supplement)
    ↓
LAYER 3: Probability Calculation (Linear-Sigmoid Hybrid + Caps + Multipliers)
    ↓
LAYER 4: Explanation & Confidence Interval (Uncertainty-Driven CI)
```

---

## **LAYER 1: Gate Check (Hard Thresholds + Soft Adjustments)**

**Purpose**: Verify if minimum requirements are met and apply soft adjustments for uncertainty/deficits.

### **1.1 Required Course Check**

- Checks course completion status for all required courses
- Status options: `completed`, `inProgress`, `notTaken`
- **No score penalties** - gates affect probability via caps/multipliers only

**Special Case: Science12_2** (need 2 science courses)
- Counts completed + in-progress science courses
- If < 2 completed, tracks missing courses

### **1.2 Hard Gate Failure (Missing Required Courses)**

**Rule**: Any required course status = `notTaken`

**Effect**:
- `gateCheck.passed = false`
- Hard gate failure override applies
- Probability capped at ≤ 40%
- Category forced to "Reach"
- Chance forced to "Low"
- Display shows warning message

**Example**:
- Missing: Math12
- Result: Probability = 40% (capped), Category = Reach, Chance = Low

### **1.3 Soft Uncertainty: In-Progress Required Courses**

**Rule**: Course status = `inProgress`

**Effect**:
- No hard failure (gate still passes)
- `gateCapMaxProb = 70%` (cap reduction for uncertainty)
- Warning message added
- **70% cap still allows Safety category** (>=70 = Safety threshold)
- Final category determined by standard thresholds

**Example**:
- In Progress: Physics12
- Base probability: 75% (would be Safety)
- After cap: 70% (still Safety, capped at threshold)
- Message: "Maximum probability capped at 70% due to in-progress course uncertainty. Final category is determined by standard thresholds (>=70 = Safety)."

### **1.4 Soft Penalty: Core Subject Deficits**

**Rule**: Core subject score < coreMinScore (default: 75%, configurable per program)

**Calculation**:
```javascript
// Calculate total deficit across all weak core subjects
totalDeficit = Σ max(0, coreMinScore - score)

// Calculate effective deficit with AP insurance (per subject)
effectiveDeficit = Σ (deficit × (hasAPInsurance ? 0.5 : 1.0))

// Gate multiplier (max 25% reduction)
gateMultiplier = 1 - min(effectiveDeficit * 0.008, 0.25)
```

**AP Insurance** (strict, subject-specific):
- AP exam name must exactly match subject mapping
- AP score must be exactly 5
- Insurance applies per weak subject (50% deficit reduction for that subject)
- See Layer 3 for detailed AP insurance logic

**Effect**:
- Probability multiplier applied (max 25% reduction)
- Applied AFTER raw probability but BEFORE final cap
- AP insurance reduces penalty by 50% per insured subject

**Example**:
- Core subjects: Math12 (min 85%), Physics12 (min 85%)
- Scores: Math12 = 80%, Physics12 = 82%
- Deficit: (85-80) + (85-82) = 5 + 3 = 8%
- Multiplier: 1 - min(8 * 0.008, 0.25) = 1 - 0.064 = 0.936
- Raw probability: 70%
- Adjusted: 70% × 0.936 = **65.5%** (4.5% reduction)

**With AP Insurance**:
- If student has AP Calculus BC (score 5) matching Math12:
- Math12 deficit: 5% × 0.5 = 2.5% (insured)
- Physics12 deficit: 3% (uninsured)
- Effective deficit: 2.5 + 3 = 5.5%
- Multiplier: 1 - min(5.5 * 0.008, 0.25) = 0.956
- Adjusted: 70% × 0.956 = **66.9%** (3.1% reduction, 50% penalty reduction for Math12)

### **1.5 Supplement Material Check**

- Flags if program requires portfolio/audition/interview
- Adds warning if supplement is required but not submitted
- Used for confidence interval calculation (see Layer 4)

**Output**: `gateCheck` object with:
- `passed`: boolean (false if missing required courses)
- `missingCourses`: array
- `inProgressCourses`: array
- `gateCapMaxProb`: number | null (70 if in-progress courses exist)
- `gateMultiplier`: number (0.75-1.0, based on core deficits)
- `totalCoreDeficit`: number (for display)
- `effectiveDeficit`: number (with AP insurance applied)
- `insuredSubjects`: array (subjects with AP insurance)
- `uninsuredSubjects`: array (subjects without AP insurance)
- `warnings`: array
- `supplementRequired`: boolean

**Key Change**: Gates no longer add penalties to `finalScore`. All gate effects are applied via caps and multipliers in Layer 3.

*(Source: TASK2_GATE_REFACTOR.md, TASK2.1_WORDING_ALIGNMENT.md)*

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

**Primary Method: Activities-Based Scoring**

The calculator uses evidence-based activity scoring as the primary method. Users add structured activities (up to 8), and each activity is scored individually (max 20 points per activity).

**Activity Scoring Components** (per activity, max 20 points):
1. **Category Base** (0-4 points)
   - EC: 2 points
   - Work: 3 points
   - Volunteer: 2 points
   - Award: 4 points
   - Research: 4 points

2. **Years of Involvement** (0-5 points)
   - Linear: 0-4 years = 0-5 points

3. **Hours Per Week** (0-6 points, diminishing returns after 12)
   - ≤12 hours: `hours / 2` (max 6 points)
   - >12 hours: `6 + (hours-12)/6` (capped at 6 points)

4. **Role Depth** (0-3 points)
   - member: 0 points
   - executive: 2 points
   - founder: 3 points

5. **Relevance** (0-2 points)
   - high: 2 points
   - medium: 1 point
   - low: 0 points

6. **Impact Evidence** (0-2 points, optional)
   - If `impactEvidence === true`: +2 points

**Total per activity: Max 20 points**

**Calculation**:
```javascript
// Sum all activity scores (capped at 100)
baseProfileScore = min(100, Σ scoreActivity(activity))

// Legacy adjustment (±3 points from old 1-5 ratings)
legacyAdjustment = (avg(extracurriculars, leadership, volunteering) - 3) × 1.5
// Range: -3 to +3 points

// Grade trend adjustment
trendBonus = { rising: +3, stable: 0, declining: -4 }

// Final profile score
profileScore = min(100, max(0, baseProfileScore + legacyAdjustment + trendBonus))
```

**Fallback Method: Legacy 1-5 Ratings**

If no activities are provided (`activities.length === 0`), the calculator falls back to legacy 1-5 self-ratings:

```javascript
ec = extracurriculars (1-5)
leadership = leadership (1-5)
volunteering = volunteering (1-5)

baseProfileScore = ((ec + leadership + volunteering) / 3 / 5) × 100

// Small factors adjustments
trendBonus = { rising: +3, stable: 0, declining: -4 }
relevanceBonus = { high: +3, medium: +1, low: -1 }
depthMultiplier = { founder: ×1.2, executive: ×1.1, member: ×1.0 }

profileScore = min(100, max(0, (baseProfileScore + trendBonus + relevanceBonus) × depthMultiplier))
```

**UI Notes**:
- Personal Profile section shows "Activities" form (no "V2" wording in UI)
- Legacy 1-5 sliders removed from UI
- Legacy ratings still stored internally for backward compatibility
- Legacy ratings used as ±3 adjustment when activities are present
- Fallback to legacy calculation when no activities provided

*(Source: TASK1_PROFILE_V2_SUMMARY.md, TASK1.5_UI_IMPLEMENTATION.md, UI_CLEANUP_LEGACY_SLIDERS.md, PROFILE_V2_EXAMPLES.md)*

### **2.3 Supplement Score (0-100)**

- Only for programs requiring portfolio/audition/interview
- User input: 0-100
- Default: 50 if not provided

---

## **LAYER 3: Probability Calculation**

**Purpose**: Convert scores into admission probability percentage with academic risk escalation, granular sensitivity, and gate adjustments.

### **3.1 Academic Risk Escalation (Weight Adjustment)**

**Purpose**: When academic risk exists, increase profile weight (capped at 35%) to allow holistic differentiation for borderline cases.

**Academic Risk Definition**:
`academicRisk` is `true` if ANY of the following holds:
1. `gateCheck.totalCoreDeficit > 0` (any core subject below recommended minimum)
2. `gateCheck.inProgressCourses.length > 0` (any required course in-progress)
3. `academicScore < 85`

**Weight Adjustment (Plan A)**:
```javascript
const baseWeights = {
  academic: 0.75,  // default, program-specific
  profile: 0.25,   // default, program-specific
  supplement: 0.0  // program-specific (only if required)
};

if (academicRisk === true) {
  // Increase profile weight by +0.10, capped at 0.35
  profileWeight = Math.min(0.35, baseWeights.profile + 0.10);
  
  // Reduce academic weight accordingly to maintain sum = 1.0
  academicWeight = 1.0 - profileWeight - baseWeights.supplement;
  
  // Ensure weights still sum to 1.0
  const totalWeight = academicWeight + profileWeight + baseWeights.supplement;
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    const adjustment = (1.0 - totalWeight) / 2;
    academicWeight += adjustment;
    profileWeight += adjustment;
  }
}
```

**Rationale**: When academic performance shows risk (low scores, core deficits, or in-progress courses), the profile becomes more important for holistic differentiation. This allows strong extracurricular achievements to compensate for academic weaknesses, reflecting UBC's holistic admission approach.

**Example 1**: If base weights are 0.75/0.25 and `academicRisk === true`:
- Profile weight: min(0.35, 0.25 + 0.10) = **0.35**
- Academic weight: 1.0 - 0.35 - 0.0 = **0.65**
- Final weights: 0.65 academic, 0.35 profile (sums to 1.0)

**Example 2**: If base weights are 0.55/0.45 (Sauder) and `academicRisk === true`:
- Profile weight: min(0.35, 0.45 + 0.10) = **0.35** (capped)
- Academic weight: 1.0 - 0.35 - 0.0 = **0.65**
- Final weights: 0.65 academic, 0.35 profile (sums to 1.0)

**Note**: This applies only to weights used in `finalScore` calculation. Gate effects (caps/multipliers) and AP insurance remain unchanged.

### **3.2 Weighted Final Score**

**Important**: `finalScore` contains ONLY weighted component scores. Gate effects are NOT added here.

```javascript
weights = {
  academic: 0.75 (default, program-specific),
  profile: 0.25 (default, program-specific),
  supplement: 0.0 (only if required)
}

// Weights may be adjusted by academic risk escalation logic above

finalScore = 
  academicScore × weights.academic +
  profileScore × weights.profile +
  supplementScore × weights.supplement
  // NO gateCheck.penalty added here
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

### **3.6 Probability Adjustment Order**

**Critical**: The order of operations matters:

1. **Compute raw probability** using Linear-Sigmoid Hybrid
2. **Apply High-End Dampening** (if academic score < 93)
3. **Apply Gate Multiplier** (for core subject deficits)
4. **Apply Caps** (gate cap for in-progress, international cap, program cap)

```javascript
// Step 1: Raw probability
let rawProbability = calculateFinalProbability(finalScore, target, scale, capMaxProb);

// Step 2: High-End Dampening
let adjustedProbability = rawProbability;
if (scores.academicScore < 93) {
  adjustedProbability = rawProbability * 0.85; // 15% reduction
}

// Step 3: Gate Multiplier (for core deficits)
if (gateCheck.gateMultiplier !== undefined && gateCheck.gateMultiplier < 1.0) {
  adjustedProbability = adjustedProbability * gateCheck.gateMultiplier;
}

// Step 4: Apply caps (including gate cap for in-progress courses)
// Note: capMaxProb already adjusted for international and gate cap
const cappedProbability = Math.min(adjustedProbability, capMaxProb);
```

### **3.7 High-End Dampening**

**Purpose**: Prevent scores below 93 from reaching "Safety" category too easily

```javascript
if (scores.academicScore < 93) {
  adjustedProbability = rawProbability * 0.85; // 15% reduction
}
```

**Effect**: Scores below 93 are pushed down, making it harder to reach "Safety" (70%+)

### **3.8 Gate Multiplier (Core Subject Deficits)**

**Purpose**: Penalize students with weak core subjects even if overall GPA is high

**Calculation**:
- Uses `effectiveDeficit` from Layer 1 (with AP insurance already applied per subject)
- Multiplier: `1 - min(effectiveDeficit * 0.008, 0.25)` (max 25% reduction)
- Applied AFTER raw probability but BEFORE final cap

**AP Insurance** (strict, subject-specific):
- AP exam name must exactly match subject mapping (normalized comparison)
- AP score must be exactly 5
- Insurance applies per weak subject (50% deficit reduction for that subject)
- Multiple subjects can have different insurance status

**AP Subject Mapping**:
```javascript
const apSubjectMap = {
  'Math12': ['AP Calculus AB', 'AP Calculus BC', 'AP Statistics'],
  'Physics12': ['AP Physics 1', 'AP Physics 2', 'AP Physics C: Mechanics', 'AP Physics C: Electricity and Magnetism'],
  'Chemistry12': ['AP Chemistry'],
  'Biology12': ['AP Biology'],
  'English12': ['AP English Language and Composition', 'AP English Literature and Composition']
};
```

**Name Normalization**: AP names are normalized (trim + collapse spaces) for robust matching against UI formatting variations.

**Example**:
- Math12 score: 80% (min 85%, deficit = 5%)
- Physics12 score: 82% (min 85%, deficit = 3%)
- Total deficit: 8%
- Without AP: Multiplier = 0.936, reduction = 6.4%
- With AP Calculus BC (score 5) matching Math12:
  - Math12 deficit: 5% × 0.5 = 2.5% (insured)
  - Physics12 deficit: 3% (uninsured)
  - Effective deficit: 5.5%
  - Multiplier = 0.956, reduction = 4.4% (50% penalty reduction for Math12)

*(Source: TASK3_AP_INSURANCE_STRICT.md)*

### **3.9 Probability Cap**

```javascript
cappedProbability = min(adjustedProbability, capMaxProb)
```

**Cap Sources** (applied in order):
1. Program default: 90% (88% for international)
2. International adjustment: -2% if international
3. Gate cap: 70% if in-progress courses exist

**Final capMaxProb**: Minimum of all applicable caps

Default `capMaxProb`: 90% (88% for international, 70% if in-progress courses)

### **3.10 Category Classification**

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

### **3.11 Hard Gate Failure Override**

If `gateCheck.passed === false`:
- Cap displayed percentage at 40%
- Force category to "Reach"
- Force chance to "Low"
- Adjust confidence interval accordingly

---

## **LAYER 4: Explanation & Confidence Interval**

**Purpose**: Generate warnings, insights, recommendations, and uncertainty-driven confidence intervals.

### **4.1 Uncertainty-Driven Confidence Interval**

**Base Width**: 6%

**Uncertainty Factors** (additive):

1. **In-Progress Required Courses**: +1.0 per course
   - Example: 2 in-progress courses → +2.0

2. **Missing Core Subject Scores**: +1.5 per missing score
   - Uses strict empty/NaN detection: `raw === null || raw === undefined || String(raw).trim() === '' || isNaN(Number(raw))`
   - Example: Math12 and Physics12 not provided → +3.0

3. **Supplement Uncertainty**: +3.0 if required but not provided
   - Uses strict empty/NaN detection (same pattern as core scores)
   - Example: Portfolio required but score not entered → +3.0

4. **Profile Input Uncertainty**:
   - No activities: +2.0
   - Activities present: +0.5 (minor uncertainty, not shown in explanation)

**Clamp**: 6 to 14

**Calculation**:
```javascript
let confidenceWidth = 6; // Base
const uncertaintyFactors = [];

// 1. In-progress courses
if (gateCheck.inProgressCourses.length > 0) {
  confidenceWidth += gateCheck.inProgressCourses.length * 1.0;
  uncertaintyFactors.push(`${count} in-progress course(s)`);
}

// 2. Missing core scores (strict detection)
for (const subject of coreSubjects) {
  const raw = coreSubjectScores[subject];
  if (raw === null || raw === undefined || String(raw).trim() === '' || isNaN(Number(raw))) {
    confidenceWidth += 1.5;
    // Add to factors list
  }
}

// 3. Supplement uncertainty (strict detection)
if (gateCheck.supplementRequired) {
  const raw = supplementScore;
  if (raw === null || raw === undefined || String(raw).trim() === '' || isNaN(Number(raw))) {
    confidenceWidth += 3.0;
    uncertaintyFactors.push('supplement material not provided');
  }
}

// 4. Profile uncertainty
if (!activities || activities.length === 0) {
  confidenceWidth += 2.0;
  uncertaintyFactors.push('no activities provided');
} else {
  confidenceWidth += 0.5; // Minor uncertainty, NOT added to factors list
}

// Clamp
confidenceWidth = Math.max(6, Math.min(14, confidenceWidth));

// Calculate CI
const percentageMid = Math.round(cappedProbability);
const percentageLow = Math.max(5, Math.round(percentageMid - confidenceWidth));
const percentageHigh = Math.min(capMaxProb, Math.round(percentageMid + confidenceWidth));
// Note: capMaxProb here is FINAL value after all gate caps
```

**Uncertainty Explanation**:
- Only shows meaningful factors: in-progress courses, missing core scores, supplement missing, no activities
- Does NOT include "activities present" in explanation (only adds +0.5 width internally)
- Format: "Wider range due to: [factors]. "

*(Source: TASK4_UNCERTAINTY_CI.md)*

### **4.2 Gate Issues (Critical)**

- Missing courses warning
- In-progress courses warning (cap reduction)
- Core subject below minimum warning (multiplier effect)
- Supplement required warning

### **4.3 Score-Based Insights**

- Academic score too low (if weight > 0.5 and score < 85)
- Profile score too low (if weight > 0.35 and score < 80)

### **4.4 Top 2 Improvement Actions**

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
| `activities` | array | 0-8 items | Structured activity objects (primary profile method) |
| `extracurriculars` | number | 1-5 | Legacy rating (used as ±3 adjustment, UI removed) |
| `leadership` | number | 1-5 | Legacy rating (used as ±3 adjustment, UI removed) |
| `volunteering` | number | 1-5 | Legacy rating (used as ±3 adjustment, UI removed) |
| `supplementScore` | number | 0-100 | Portfolio/audition score |
| `applicantType` | string | domestic/international | Applicant type |
| `gradeTrend` | string | rising/stable/declining | Grade trend |
| `courseStatus` | object | completed/inProgress/notTaken | Course completion status |
| `coreSubjectScores` | object | 0-100 | Individual subject scores |
| `apExams` | array | 0-10 items | Array of `{ name: string, score: number }` (only score=5 provides insurance) |

**Activity Object Structure**:
```javascript
{
  category: 'EC' | 'Work' | 'Volunteer' | 'Award' | 'Research',
  years: 0-4,
  hoursPerWeek: 0-30,
  role: 'member' | 'executive' | 'founder',
  relevance: 'high' | 'medium' | 'low',
  impactEvidence: boolean
}
```

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
  finalScore: 78.5,                  // Weighted final score (no gate penalties)
  academicScore: 85.2,               // Academic component
  profileScore: 72.8,                // Profile component
  supplementScore: null,              // Supplement (if applicable)
  confidenceWidth: 8,                 // CI width (6-14)
  uncertaintyExplanation: "Wider range due to: 1 in-progress course, missing Math12 score.", // Optional
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
- `gpaWeight`: Academic weight (default: 0.75)
- `personalProfileWeight`: Profile weight (default: 0.25)
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
- `normalizeName()` - AP name normalization helper
- `calculateFinalProbability()` - Linear-Sigmoid Hybrid helper

**Data Source**: `src/data/facultiesData.js`

**Profile Scoring**: `src/utils/profileScoringV2.js`

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

### Academic Risk Escalation Weight Adjustment
```
if (academicRisk === true):
  academicRisk = (totalCoreDeficit > 0) OR 
                 (inProgressCourses.length > 0) OR 
                 (academicScore < 85)
  
  if (academicRisk):
    profileWeight = min(0.35, baseProfileWeight + 0.10)
    academicWeight = 1.0 - profileWeight - supplementWeight
    
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
             (supplementScore × supplementWeight)
// NO gate penalties added here
```

### Profile Score (Activities-Based)
```
// Per activity (max 20 points)
activityScore = categoryBase + yearsPoints + hoursPoints + rolePoints + relevancePoints + impactPoints

// Total
baseProfileScore = min(100, Σ activityScore)

// Legacy adjustment (±3 points)
legacyAdjustment = (avg(extracurriculars, leadership, volunteering) - 3) × 1.5

// Grade trend
trendBonus = { rising: +3, stable: 0, declining: -4 }

profileScore = min(100, max(0, baseProfileScore + legacyAdjustment + trendBonus))
```

### Gate Multiplier (Core Deficits)
```
// Calculate effective deficit with AP insurance (per subject)
effectiveDeficit = Σ (deficit × (hasAPInsurance ? 0.5 : 1.0))

// Multiplier (max 25% reduction)
gateMultiplier = 1 - min(effectiveDeficit * 0.008, 0.25)

// Apply to probability
adjustedProbability = rawProbability × gateMultiplier
```

### AP Rigor Bonus
```
apRigorBonus = apExamsWithScore5 * 0.75  // 0.75% per AP score of 5
academicScore = min(100.5, academicScore + apRigorBonus)  // Cap at 100.5%
```

### Confidence Interval (Uncertainty-Driven)
```
baseWidth = 6
width = baseWidth + 
        (inProgressCount × 1.0) +
        (missingCoreScores × 1.5) +
        (supplementMissing ? 3.0 : 0) +
        (noActivities ? 2.0 : 0.5)

confidenceWidth = max(6, min(14, width))

percentageLow = max(5, round(percentageMid - confidenceWidth))
percentageHigh = min(capMaxProb, round(percentageMid + confidenceWidth))
```

### Safety Limit
```
Maximum probability change per GPA point ≤ 2%
```
This is naturally maintained by the 0.7 scale multiplier and 0.5 linear bonus combination.

---

## **Appendix**

### Example Calculation

**Input:**
- Program: Science (medianGPA: 96%, competitivenessLevel: 5)
- GPA: 92
- Course Difficulty: AP
- Activities: 3 activities (total 35 points)
- Legacy ratings: extracurriculars=4, leadership=4, volunteering=3
- Grade Trend: Rising
- All required courses: Completed
- Core subjects: Math12 = 88% (min 85%), Physics12 = 90% (min 85%)
- AP Exams: [{ name: 'AP Calculus BC', score: 5 }]
- Applicant Type: Domestic

**Calculation Steps:**

1. **ParameterCalculator**:
   - medianGPA: 96, competitivenessLevel: 5
   - targetOffset: 2.5 → targetScore = 96 - 2.5 = **93.5**
   - scale: min(8.5 - (5 × 0.6), 6.0) = **6.0**

2. **Academic Score:**
   - Base: 92
   - AP bonus: +3
   - Core boost: +2 (Math12 ≥ 90)
   - AP rigor bonus: +0.75 (1 AP with score 5)
   - **Result: 97.75** (capped at 100.5)

3. **Profile Score:**
   - Base: 35 (from activities)
   - Legacy adjustment: (4+4+3)/3 = 3.67 → (3.67-3)×1.5 = **+1**
   - Rising trend: **+3**
   - **Result: 39**

4. **Academic Risk Escalation Check:**
   - Academic Score: 97.75 ≥ 85 ✓
   - Core subjects: All ≥ minimum ✓
   - In-progress courses: None ✓
   - academicRisk: false (no risk factors)
   - No weight adjustment needed
   - **Weights: 0.75 academic, 0.25 profile**

5. **Final Score:**
   - (97.75 × 0.75) + (39 × 0.25) = 73.31 + 9.75 = **83.06**

6. **Probability (Linear-Sigmoid Hybrid):**
   - Base: sigmoid(83.06, 93.5, 6.0×0.7) = sigmoid(83.06, 93.5, 4.2) ≈ 0.40
   - Since 83.06 < 93.5: No linear bonus
   - Raw probability: 40%

7. **Penalty Factors:**
   - High-End Dampening: 97.75 ≥ 93 ✓ (no penalty)
   - Gate Multiplier: All core subjects ≥ minimum ✓ (no penalty)
   - **Adjusted: 40%**

8. **Category:**
   - 40% < 45 → **Reach** (Low chance)

**Result**: 92% GPA for Science correctly classified as "Reach"

### Example 2: With Academic Risk Escalation

**Input:**
- Program: Arts (medianGPA: 92%, competitivenessLevel: 4)
- GPA: 82
- Academic Score: 82 (after adjustments)
- Profile Score: 85
- Core subjects: Math12 = 80% (min 85%, deficit = 5%)
- All required courses: Completed
- Applicant Type: Domestic

**Calculation Steps:**

1. **Academic Risk Check:**
   - Academic Score: 82 < 85 ✓ (risk factor)
   - Core deficit: 5% > 0 ✓ (risk factor)
   - In-progress courses: None
   - **academicRisk: true**

2. **Weight Adjustment:**
   - Base weights: 0.75 academic, 0.25 profile
   - Profile weight: min(0.35, 0.25 + 0.10) = **0.35**
   - Academic weight: 1.0 - 0.35 = **0.65**
   - **Adjusted weights: 0.65 academic, 0.35 profile**

3. **Final Score:**
   - (82 × 0.65) + (85 × 0.35) = 53.3 + 29.75 = **83.05**

4. **Probability:**
   - Base: sigmoid(83.05, 89, 6.1×0.7) ≈ 0.72
   - Linear bonus: (83.05 - 89) < 0, no bonus
   - Raw probability: 72%

5. **Penalty Factors:**
   - High-End Dampening: 82 < 93 → 72% × 0.85 = **61.2%**
   - Gate Multiplier: Core deficit exists → multiplier applies
   - **Adjusted: ~55-60%**

6. **Category:**
   - 55-60% → **Match** (Medium chance)

**Result**: With academic risk, profile weight increased to 35%, allowing strong profile (85) to partially compensate for weaker academic score (82).

For more detailed examples, see `PROFILE_V2_EXAMPLES.md`.

### Change Log

**Version 4.2** (January 2025):
- Spec: Academic Risk Escalation replaces Academic Primacy (Plan A: cap profile at 35%)
  - academicRisk triggers: core deficit > 0, in-progress courses, or academicScore < 85
  - Profile weight increases by +0.10 (capped at 35%) when risk exists
  - Rationale: Holistic differentiation for borderline academic cases

**Version 4.1** (January 2025):
- Task 3.1: Added AP name normalization (trim + collapse spaces) for robust matching
- Task 4.1: Fixed CI edge cases (strict empty/NaN detection, explanation filtering, final capMaxProb)

**Version 4.0** (January 2025):
- Task 4: Implemented uncertainty-driven confidence interval (base 6, factors: in-progress, missing scores, supplement, activities)

**Version 3.0** (January 2025):
- Task 3: Implemented strict AP insurance (subject-specific, exact name match + score===5)

**Version 2.1** (January 2025):
- Task 2.1: Aligned wording for in-progress cap (70% cap still allows Safety category)

**Version 2.0** (January 2025):
- Task 2: Refactored gate logic (removed score penalties, added caps + multipliers)

**Version 1.5** (January 2025):
- Task 1.5: Added Activities UI (ProfileActivitiesForm component)
- UI Cleanup: Removed legacy 1-5 sliders from UI (kept internal logic for backward compatibility)

**Version 1.0** (January 2025):
- Task 1: Implemented Profile V2 (activities-based scoring, up to 8 activities, max 20 points each)

---

## **Notes**

- All calculations are performed in real-time as user inputs change
- The model prioritizes academic scores (default 0.75/0.25 weights)
- **ParameterCalculator**: Automatically derives targetScore and scale from medianGPA and competitivenessLevel
- **2025/2026 Statistics**: Updated with official UBC Vancouver admission data
- **Academic Risk Escalation**: When academic risk exists (low scores, core deficits, or in-progress courses), profile weight increases (capped at 35%) to allow holistic differentiation
- **Weight Rebalancing**: Weights always sum to 1.0, even after academic risk escalation adjustment
- **Linear-Sigmoid Hybrid**: Provides granular, visible changes (0.5-1% per GPA point)
- **High-End Dampening**: Scores below 93% get 15% probability reduction
- **Gate Multiplier**: Weak core subjects result in probability multiplier (max 25% reduction)
- **AP Insurance**: Strict subject-specific matching with name normalization
- **International Adjustment**: Target score increased before calculation for international applicants
- **Safety Limit**: Maximum probability change per GPA point ≤ 2%
- The model is designed to be conservative (caps at 90%)
- Gate failures significantly reduce displayed probability (capped at 40%)
- **Uncertainty-Driven CI**: Confidence interval width reflects data completeness (6-14 range)
- **Activities-Based Profile**: Primary scoring method uses structured activities (up to 8)
- **Backward Compatibility**: Legacy 1-5 ratings still work internally as ±3 adjustment and fallback
- **Special Case**: Sauder (Commerce) maintains custom gpaWeight: 0.55 due to high Personal Profile importance

---

**Last Updated**: January 2025  
**Version**: 4.2  
**Status**: Production
