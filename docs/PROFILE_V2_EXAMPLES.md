# Profile Scoring V2 - Example Calculations

**Supplementary examples — operational rules defined in CALCULATOR_OPERATION.md**

This document provides detailed calculation examples for activities-based profile scoring. For authoritative operational rules, see **CALCULATOR_OPERATION.md** → **Layer 2: Score Calculation** → **2.2 Profile Score**.

---

## Overview

Activities-based scoring replaces subjective 1-5 self-ratings with evidence-based activity scoring. Each activity is scored individually (max 20 points), then summed and capped at 100.

## Scoring Components (per activity, max 20 points)

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

## Legacy Adjustment

Old 1-5 self-ratings become a ±3 point adjustment:
- Average of (extracurriculars, leadership, volunteering)
- Formula: `(avg - 3) × 1.5`
- Range: -3 to +3 points

---

## Example 1: Strong Profile (8 Activities)

### Activities:

1. **Debate Club** (EC)
   - Years: 3
   - Hours/week: 8
   - Role: executive
   - Relevance: high
   - Impact: false
   - **Score**: 2 (category) + 3 (years) + 4 (hours) + 2 (role) + 2 (relevance) = **13 points**

2. **Part-time Job** (Work)
   - Years: 2
   - Hours/week: 15
   - Role: member
   - Relevance: medium
   - Impact: false
   - **Score**: 3 (category) + 2 (years) + 6 (hours, capped) + 0 (role) + 1 (relevance) = **12 points**

3. **Volunteer Tutoring** (Volunteer)
   - Years: 2
   - Hours/week: 5
   - Role: member
   - Relevance: high
   - Impact: true (helped 20+ students improve grades)
   - **Score**: 2 (category) + 2 (years) + 2.5 (hours) + 0 (role) + 2 (relevance) + 2 (impact) = **10.5 points**

4. **Science Fair Winner** (Award)
   - Years: 1
   - Hours/week: 0 (one-time)
   - Role: member
   - Relevance: high
   - Impact: false
   - **Score**: 4 (category) + 1 (years) + 0 (hours) + 0 (role) + 2 (relevance) = **7 points**

5. **Student Council** (EC)
   - Years: 2
   - Hours/week: 6
   - Role: executive
   - Relevance: high
   - Impact: false
   - **Score**: 2 (category) + 2 (years) + 3 (hours) + 2 (role) + 2 (relevance) = **11 points**

6. **Research Project** (Research)
   - Years: 1
   - Hours/week: 10
   - Role: member
   - Relevance: high
   - Impact: true (published in school journal)
   - **Score**: 4 (category) + 1 (years) + 5 (hours) + 0 (role) + 2 (relevance) + 2 (impact) = **14 points**

7. **Sports Team** (EC)
   - Years: 4
   - Hours/week: 12
   - Role: member
   - Relevance: medium
   - Impact: false
   - **Score**: 2 (category) + 5 (years) + 6 (hours) + 0 (role) + 1 (relevance) = **14 points**

8. **Community Service** (Volunteer)
   - Years: 1
   - Hours/week: 3
   - Role: member
   - Relevance: low
   - Impact: false
   - **Score**: 2 (category) + 1 (years) + 1.5 (hours) + 0 (role) + 0 (relevance) = **4.5 points**

### Calculation:

**Total from activities**: 13 + 12 + 10.5 + 7 + 11 + 14 + 14 + 4.5 = **86 points**

**Legacy adjustment** (if extracurriculars=4, leadership=4, volunteering=3):
- Average: (4+4+3)/3 = 3.67
- Adjustment: (3.67 - 3) × 1.5 = **+1 point**

**Final Score**: 86 + 1 = **87 points** (capped at 100)

---

## Example 2: Moderate Profile (4 Activities)

### Activities:

1. **School Club** (EC)
   - Years: 2
   - Hours/week: 4
   - Role: member
   - Relevance: medium
   - Impact: false
   - **Score**: 2 + 2 + 2 + 0 + 1 = **7 points**

2. **Summer Job** (Work)
   - Years: 1
   - Hours/week: 20
   - Role: member
   - Relevance: low
   - Impact: false
   - **Score**: 3 + 1 + 6 (capped) + 0 + 0 = **10 points**

3. **Volunteer Event** (Volunteer)
   - Years: 1
   - Hours/week: 2
   - Role: member
   - Relevance: medium
   - Impact: false
   - **Score**: 2 + 1 + 1 + 0 + 1 = **5 points**

4. **Academic Award** (Award)
   - Years: 1
   - Hours/week: 0
   - Role: member
   - Relevance: high
   - Impact: false
   - **Score**: 4 + 1 + 0 + 0 + 2 = **7 points**

### Calculation:

**Total from activities**: 7 + 10 + 5 + 7 = **29 points**

**Legacy adjustment** (if extracurriculars=3, leadership=2, volunteering=3):
- Average: (3+2+3)/3 = 2.67
- Adjustment: (2.67 - 3) × 1.5 = **-0.5 points**

**Final Score**: 29 - 0.5 = **28.5 points**

---

## Example 3: High-Impact Profile (5 Activities with Evidence)

### Activities:

1. **Founded Non-profit** (EC)
   - Years: 3
   - Hours/week: 18
   - Role: founder
   - Relevance: high
   - Impact: true (raised $10,000 for charity)
   - **Score**: 2 + 3 + 6 (capped) + 3 + 2 + 2 = **18 points**

2. **Research Publication** (Research)
   - Years: 2
   - Hours/week: 12
   - Role: member
   - Relevance: high
   - Impact: true (co-authored paper)
   - **Score**: 4 + 2 + 6 (capped) + 0 + 2 + 2 = **16 points**

3. **National Competition Winner** (Award)
   - Years: 1
   - Hours/week: 0
   - Role: member
   - Relevance: high
   - Impact: false
   - **Score**: 4 + 1 + 0 + 0 + 2 = **7 points**

4. **Leadership Position** (EC)
   - Years: 2
   - Hours/week: 8
   - Role: executive
   - Relevance: high
   - Impact: true (organized 50+ person event)
   - **Score**: 2 + 2 + 4 + 2 + 2 + 2 = **14 points**

5. **Work Experience** (Work)
   - Years: 2
   - Hours/week: 15
   - Role: member
   - Relevance: medium
   - Impact: false
   - **Score**: 3 + 2 + 6 (capped) + 0 + 1 = **12 points**

### Calculation:

**Total from activities**: 18 + 16 + 7 + 14 + 12 = **67 points**

**Legacy adjustment** (if extracurriculars=5, leadership=5, volunteering=4):
- Average: (5+5+4)/3 = 4.67
- Adjustment: (4.67 - 3) × 1.5 = **+2.5 points**

**Final Score**: 67 + 2.5 = **69.5 points**

---

## Example 4: Fallback to Profile V1

If no activities are provided, the system falls back to Profile V1:

### Input:
- Extracurriculars: 4
- Leadership: 4
- Volunteering: 3
- Grade Trend: rising
- Activity Relevance: high
- Role Depth: executive

### Calculation (V1):
- Base: ((4+4+3)/3/5) × 100 = 73.3
- Grade trend: +3
- Relevance: +3
- Role multiplier: ×1.1
- **Final**: (73.3 + 3 + 3) × 1.1 = **87.2 points**

---

## Key Differences: V1 vs V2

| Aspect | Profile V1 | Profile V2 |
|--------|------------|------------|
| **Input** | 1-5 self-ratings | Structured activities |
| **Scoring** | Multipliers | Additive bonuses |
| **Max per item** | N/A (averaged) | 20 points per activity |
| **Evidence** | Subjective | Quantifiable (years, hours, impact) |
| **Inflation risk** | High | Low (structured data) |
| **Cap** | 100 (after multipliers) | 100 (hard cap) |

---

## Implementation Notes

1. **Backward Compatibility**: Profile V1 remains as fallback if no activities provided
2. **Legacy Adjustment**: Old 1-5 ratings can still provide ±3 point adjustment in V2
3. **Grade Trend**: Still applies in V2 (separate from activity scoring)
4. **Capping**: Total score capped at 100, even if theoretical max is higher
5. **Diminishing Returns**: Hours >12 have reduced impact to prevent gaming

---

**Last Updated**: January 2025  
**Version**: 2.0

