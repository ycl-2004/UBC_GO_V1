# Province-Specific Course Codes Update

## Issue
Four provinces (Nunavut, Nova Scotia, Quebec, New Brunswick) were showing generic course names instead of their province-specific codes.

## Fixed Provinces

### 1. ✅ New Brunswick
**BEFORE (Generic)**:
- English 12 or English Language Arts 12
- Pre-Calculus 12
- Biology 12

**AFTER (Province-Specific)**:
- English 121 or English 122
- Pre-Calculus A 120 and Pre-Calculus B 120
- Biology 121 or Biology 122
- Chemistry 121 or Chemistry 122
- Physics 121 or Physics 122

### 2. ✅ Nunavut
**BEFORE (Generic)**:
- English 12 or English Language Arts 12
- Pre-Calculus 12
- Biology 12

**AFTER (Province-Specific)**:
- English Language Arts 30-1
- Math 30-1 or Math 31 (5 credits)
- Biology 30
- Chemistry 30
- Physics 30

**Note**: Nunavut follows Alberta's curriculum numbering system (30-level for Grade 12, 20-level for Grade 11)

### 3. ✅ Nova Scotia
**Status**: Already correct!
- English 12 or English Communications 12
- Pre-Calculus 12
- Biology 12, Chemistry 12, Physics 12

**Note**: Nova Scotia uses similar naming to BC but these ARE their official course names.

### 4. ✅ Quebec
**Status**: Already correct!
- English 603 or 604
- Mathematics 201-NYA, 201-NYB, 201-NYC
- Biology 101-NYA
- Chemistry 202-NYA, 202-NYB
- Physics 203-NYA, 203-NYB

**Note**: Quebec uses CEGEP-level courses with numeric codes (xxx-NYA format)

## Provinces That Use Other Systems

### Northwest Territories
**Uses Alberta's curriculum system** (30-level for Grade 12, 20-level for Grade 11):
- English Language Arts 30-1
- Math 30-1 or Math 31 (5 credits)
- Biology 30, Chemistry 30, Physics 30

**Note**: Updated to match UBC website which shows Alberta's 30-level codes for NWT.

### Yukon
Follows **British Columbia's curriculum**, so BC course names are correct:
- English 12 or English Language Arts 12
- Pre-Calculus 12
- Biology 12, Chemistry 12, Physics 12

## Complete Province Course Code System

| Province | Course Naming System | Example |
|----------|---------------------|---------|
| Alberta | 30-level (Grade 12), 20-level (Grade 11) | English Language Arts 30-1 |
| British Columbia | Subject + 12 | Pre-Calculus 12 |
| Manitoba | Subject + 40S | English Language Arts 40S |
| New Brunswick | Subject + 120/121/122 | English 121, Pre-Calculus A 120 |
| Newfoundland & Labrador | Subject + 3200s | English 3201, Math 3200 |
| Northwest Territories | **Follows Alberta** | English Language Arts 30-1, Math 30-1 |
| Nova Scotia | Subject + 12 | English 12, Pre-Calculus 12 |
| Nunavut | **Follows Alberta** | English Language Arts 30-1 |
| Ontario | Four-letter code + 4U | ENG4U, MHF4U |
| Prince Edward Island | Subject + 621A/621B | ENG611 or ENG621 |
| Quebec | CEGEP xxx-NYA | English 603, Mathematics 201-NYA |
| Saskatchewan | Subject + A30/B30 | English Language Arts A30 |
| Yukon | **Follows BC** | English 12, Pre-Calculus 12 |

## Files Modified
1. `scraper/province_course_mappings.json` - Updated New Brunswick and Nunavut mappings
2. `src/data/detailed_requirements_enhanced.json` - Regenerated with correct codes

## Verification

All provinces now show their correct, province-specific course codes:
- ✅ New Brunswick: 121/122 and 120 codes
- ✅ Nunavut: 30-level codes (Alberta system)
- ✅ Nova Scotia: "English 12" IS correct for NS
- ✅ Quebec: CEGEP codes (603, 201-NYA, etc.)
- ✅ Northwest Territories: Alberta 30-level codes (correct - matches UBC website)
- ✅ Yukon: BC codes (correct)
