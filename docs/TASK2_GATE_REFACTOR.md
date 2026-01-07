# Task 2: Gate Penalty Refactor - Archived Summary

⚠️ **Archived — superseded by CALCULATOR_OPERATION.md (v4.1)**

This document is preserved for historical reference. For current operational details, see **CALCULATOR_OPERATION.md** → **Layer 1: Gate Check** and **Layer 3: Probability Calculation**.

---

## Task Summary

**Date**: January 2025  
**Version**: 2.0  
**Status**: ✅ Complete

### Intent
Refactored gate logic to use caps and multipliers instead of score penalties, ensuring clean sigmoid curve input and predictable probability adjustments.

### Key Changes
- Removed `gateCheck.penalty` from `finalScore` calculation
- Added `gateCapMaxProb` for in-progress courses (70% cap)
- Added `gateMultiplier` for core subject deficits (max 25% reduction)
- Hard gate failure override: missing courses → ≤40%, Reach, Low

### Files Modified
- **Modified**: `src/pages/ApplyInfoPage.jsx`
  - `checkGateRequirements()`: Removed penalty, added caps/multipliers
  - `calculateProbability()`: Removed penalty from finalScore, applied caps/multipliers
  - `generateExplanation()`: Updated messages for caps/multipliers

### Current Status
- Gates affect probability via caps and multipliers only
- `finalScore` contains only weighted component scores
- In-progress courses: 70% cap (still allows Safety category)
- Core deficits: probability multiplier (max 25% reduction)

---

**For detailed operational rules, see CALCULATOR_OPERATION.md Sections 1.2-1.4 and 3.6-3.8**
