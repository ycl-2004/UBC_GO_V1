# Documentation Folder

## 🚀 Overview

This folder contains additional project documentation and planning materials for UBC PathFinder.

## 📂 File Guide

### Planning Documents

| File | Purpose |
|------|---------|
| `planning/goal_tmr.txt` | Tomorrow's goals and tasks |
| `planning/Goal.txt` | Overall project goals and objectives |

### Technical Documentation

| File | Purpose |
|------|---------|
| `CALCULATOR_OPERATION.md` | **Primary technical reference** — Complete operational details of the 4-layer admission probability calculator (v4.1) |
| `PROFILE_V2_EXAMPLES.md` | Supplementary calculation examples for activities-based profile scoring |

### Historical Task Documentation (Archived)

The following files document the evolution of the calculator implementation. They are preserved for historical reference but are **superseded by CALCULATOR_OPERATION.md**:

| File | Task Summary |
|------|-------------|
| `TASK1_PROFILE_V2_SUMMARY.md` | Profile V2 implementation (activities-based scoring) |
| `TASK1.5_UI_IMPLEMENTATION.md` | Activities UI component implementation |
| `UI_CLEANUP_LEGACY_SLIDERS.md` | Removal of legacy 1-5 sliders from UI |
| `TASK2_GATE_REFACTOR.md` | Gate logic refactor (caps + multipliers instead of score penalties) |
| `TASK2.1_WORDING_ALIGNMENT.md` | In-progress cap wording clarification |
| `TASK3_AP_INSURANCE_STRICT.md` | Strict AP insurance implementation (subject-specific) |
| `TASK4_UNCERTAINTY_CI.md` | Uncertainty-driven confidence interval implementation |

**Note**: All operational rules are now consolidated in `CALCULATOR_OPERATION.md`. The archived task files contain summaries and historical context only.

## 📁 Structure

```
docs/
├── planning/                    # Planning documents and goals
│   ├── goal_tmr.txt            # Tomorrow's goals
│   └── Goal.txt                # Overall project goals
├── CALCULATOR_OPERATION.md     # ⭐ Primary technical reference (v4.1)
├── PROFILE_V2_EXAMPLES.md     # Supplementary examples
├── TASK*.md                     # Archived task documentation (historical)
├── UI_CLEANUP_*.md              # Archived UI cleanup docs (historical)
└── README.md                    # This file
```

## 📚 Main Documentation

For the main project documentation, see:
- [README.md](../README.md) - Complete project documentation and quick start guide

For detailed documentation, see the [Summary/](../Summary/) folder.

## 📝 Organization Summary

### Organization Date
January 2025

### Completed Work

#### 1. Created Project Description Documents
- ✅ **PROJECT_DESCRIPTION.md** - Complete project description with all features and characteristics
  - Detailed feature module descriptions
  - Tech stack and design features
  - Data coverage
  - User experience features
  - Future roadmap

- ✅ **FEATURES.md** - Quick feature index
  - Core feature list
  - Quick feature lookup
  - Page list
  - Quick start guide

#### 2. Updated README.md
- ✅ Added project overview
- ✅ Updated feature list
- ✅ Added data coverage information
- ✅ Updated tech stack description
- ✅ Added documentation links
- ✅ Updated project structure description

#### 3. Organized Folder Structure
- ✅ Created `docs/` folder
- ✅ Created `docs/planning/` subfolder
- ✅ Moved planning documents:
  - `goal_tmr.txt` → `docs/planning/goal_tmr.txt`
  - `Goal.txt` → `docs/planning/Goal.txt`
- ✅ Created `docs/README.md` documentation

#### 4. Created Project Structure Guide
- ✅ **.project-structure.md** - Detailed project structure description
  - Directory structure description
  - File naming conventions
  - Guide for adding new files
  - Guide for finding files

### New File Structure

```
UBC_GO_V1/
├── 📄 PROJECT_DESCRIPTION.md    # ✨ New - Complete project description
├── 📄 FEATURES.md                # ✨ New - Feature index
├── 📄 .project-structure.md      # ✨ New - Project structure guide
├── 📄 README.md                   # 🔄 Updated - Main README
│
├── 📁 docs/                       # ✨ New folder
│   ├── planning/                 # ✨ New - Planning documents
│   │   ├── goal_tmr.txt          # 📦 Moved from root
│   │   └── Goal.txt              # 📦 Moved from root
│   ├── README.md                 # ✨ New - Documentation description
│   └── ORGANIZATION_SUMMARY.md   # ✨ New - This file
│
└── [Other existing files remain unchanged]
```

### Documentation Navigation

#### Main Documentation
1. **README.md** - Quick start and project overview
2. **PROJECT_DESCRIPTION.md** - Complete project description (recommended reading)
3. **FEATURES.md** - Quick feature lookup
4. **.project-structure.md** - Detailed project structure description

#### Planning Documents
- `docs/planning/goal_tmr.txt` - Tomorrow's goals
- `docs/planning/Goal.txt` - Overall project goals

#### Detailed Documentation
- `Summary/` - Documentation organized by category

### Usage Recommendations

#### For New Developers
1. First read **README.md** to understand the project
2. Read **PROJECT_DESCRIPTION.md** to understand all features
3. **Read `CALCULATOR_OPERATION.md`** for complete calculator technical details
4. View **.project-structure.md** to understand code organization
5. Use **FEATURES.md** to quickly find features

#### For Calculator Implementation
- **Primary Reference**: `CALCULATOR_OPERATION.md` — Contains all operational rules, formulas, and implementation details
- **Examples**: `PROFILE_V2_EXAMPLES.md` — Detailed calculation examples
- **Historical Context**: `TASK*.md` files — Document evolution of features (archived)

#### For Project Maintainers
1. When updating calculator logic, update **CALCULATOR_OPERATION.md** as the single source of truth
2. When updating features, synchronously update **PROJECT_DESCRIPTION.md** and **FEATURES.md**
3. When planning new features, add documents in `docs/planning/`
4. Record important changes in `Summary/01-Project-Status/`

### Future Suggestions

#### Potential Improvements
- [ ] Add CHANGELOG.md to record version changes
- [ ] Add CONTRIBUTING.md contribution guide
- [ ] Add API_DOCUMENTATION.md (if there's an API)
- [ ] Regularly update PROJECT_DESCRIPTION.md to reflect new features

#### Documentation Maintenance
- Update related documentation when adding new features
- Keep documentation synchronized with code
- Regularly review and update outdated information

---

*Organization completed: January 2025*

