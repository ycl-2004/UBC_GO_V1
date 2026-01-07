# Task 1: Profile Scoring V2 - Archived Summary

⚠️ **Archived — superseded by CALCULATOR_OPERATION.md (v4.1)**

This document is preserved for historical reference. For current operational details, see **CALCULATOR_OPERATION.md** → **Layer 2: Score Calculation** → **2.2 Profile Score**.

---

## Task Summary

**Date**: January 2025  
**Version**: 1.0  
**Status**: ✅ Complete

### Intent
Implemented evidence-based activity scoring to replace subjective 1-5 self-ratings. Users can add structured activities (up to 8), each scored individually (max 20 points).

### Key Changes
- Created `src/utils/profileScoringV2.js` with activity scoring logic
- Integrated activities-based scoring as primary method
- Maintained backward compatibility with legacy 1-5 ratings (used as ±3 adjustment)
- Legacy ratings serve as fallback when no activities provided

### Files Created/Modified
- **Created**: `src/utils/profileScoringV2.js`
- **Modified**: `src/pages/ApplyInfoPage.jsx` (score calculation, save/load, reset)

### Current Status
- Activities-based scoring is the primary profile scoring method
- UI shows "Activities" form (no "V2" wording)
- Legacy 1-5 sliders removed from UI (Task 1.5, UI Cleanup)
- Internal logic preserved for backward compatibility

---

**For detailed operational rules, see CALCULATOR_OPERATION.md Section 2.2**
