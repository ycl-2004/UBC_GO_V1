# Task 3: Strict AP Insurance - Archived Summary

⚠️ **Archived — superseded by CALCULATOR_OPERATION.md (v4.1)**

This document is preserved for historical reference. For current operational details, see **CALCULATOR_OPERATION.md** → **Layer 1: Gate Check** → **1.4 Soft Penalty: Core Subject Deficits** and **Layer 3: Probability Calculation** → **3.8 Gate Multiplier**.

---

## Task Summary

**Date**: January 2025  
**Version**: 3.0  
**Status**: ✅ Complete

### Intent
Implemented strict, subject-specific AP insurance requiring exact AP exam name match AND score === 5. Insurance applies per weak core subject (50% deficit reduction for that subject).

### Key Changes
- Changed AP insurance from vague/global to strict/subject-specific
- Requires exact AP exam name match (with normalization for UI formatting)
- Requires AP score === 5
- Insurance applies per weak subject (not globally)
- Tracks insured vs uninsured subjects for explanation

### Files Modified
- **Modified**: `src/pages/ApplyInfoPage.jsx`
  - `checkGateRequirements()`: Strict AP matching logic
  - AP subject mapping with exact name matching
  - Effective deficit calculation with per-subject insurance

### Current Status
- AP insurance is strict and subject-specific
- AP name normalization handles UI formatting variations
- Insurance reduces deficit by 50% per insured subject
- Multiple subjects can have different insurance status

---

**For detailed operational rules, see CALCULATOR_OPERATION.md Sections 1.4 and 3.8**
