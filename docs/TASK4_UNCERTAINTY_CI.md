# Task 4: Uncertainty-Driven Confidence Interval - Archived Summary

⚠️ **Archived — superseded by CALCULATOR_OPERATION.md (v4.1)**

This document is preserved for historical reference. For current operational details, see **CALCULATOR_OPERATION.md** → **Layer 4: Explanation & Confidence Interval** → **4.1 Uncertainty-Driven Confidence Interval**.

---

## Task Summary

**Date**: January 2025  
**Version**: 4.0  
**Status**: ✅ Complete

### Intent
Replaced fixed confidence interval with uncertainty-driven calculation based on actual data completeness (in-progress courses, missing scores, supplement, activities).

### Key Changes
- Base width: 6% (reduced from 8%)
- In-progress courses: +1.0 per course
- Missing core scores: +1.5 per missing score (strict empty/NaN detection)
- Supplement missing: +3.0 if required but not provided (strict detection)
- No activities: +2.0
- Activities present: +0.5 (not shown in explanation)
- Clamp: 6-14
- Explanation only shows meaningful factors

### Files Modified
- **Modified**: `src/pages/ApplyInfoPage.jsx`
  - `calculateProbability()`: Uncertainty-driven CI calculation
  - Strict empty/NaN detection for missing scores
  - Uncertainty explanation generation

### Current Status
- CI width reflects data completeness
- Strict detection prevents false positives
- Explanation only shows meaningful uncertainty factors
- CI upper bound uses FINAL capMaxProb after all gate caps

---

**For detailed operational rules, see CALCULATOR_OPERATION.md Section 4.1**
