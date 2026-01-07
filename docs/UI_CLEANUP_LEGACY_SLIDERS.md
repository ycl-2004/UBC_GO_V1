# UI Cleanup: Remove Legacy Profile Sliders - Archived Summary

⚠️ **Archived — superseded by CALCULATOR_OPERATION.md (v4.1)**

This document is preserved for historical reference. For current operational details, see **CALCULATOR_OPERATION.md** → **Layer 2: Score Calculation** → **2.2 Profile Score** → **UI Notes**.

---

## Task Summary

**Date**: January 2025  
**Type**: UI Cleanup  
**Status**: ✅ Complete

### Intent
Removed legacy 1-5 sliders from UI while preserving internal logic for backward compatibility with saved scenarios.

### Key Changes
- Removed Extracurricular Activities, Leadership, Volunteering sliders from UI
- Removed Activity Relevance and Role Depth dropdowns from UI
- Removed "Legacy Profile V1" section and version badges
- Kept internal logic for backward compatibility (legacy ratings still stored, used as ±3 adjustment)

### Files Modified
- **Modified**: `src/pages/ApplyInfoPage.jsx` (removed ~120 lines of legacy UI)
- **Modified**: `src/components/ProfileActivitiesForm.jsx` (removed version badges, updated titles)

### Current Status
- UI shows only "Activities" form
- Legacy ratings still stored internally for backward compatibility
- Legacy ratings used as ±3 adjustment when activities are present
- Fallback to legacy calculation when no activities provided

---

**For detailed operational rules, see CALCULATOR_OPERATION.md Section 2.2**
