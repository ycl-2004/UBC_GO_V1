# UBC PathFinder

Unofficial guide to getting in and graduating from UBC.

## 🎯 Overview

UBC PathFinder is a comprehensive tool to help students:
- **Calculate admission chances** with a sophisticated 4-layer evaluation model
- **Plan degree courses** with progress tracking
- **Find admission requirements** for all Canadian provinces
- **Navigate first-year** with detailed course guides

## ✨ Key Features

- **🎓 Admission Calculator**: Calculate your chances of getting into UBC with real-time probability calculation
- **📚 Degree Planner**: Track your degree progress and plan your courses across multiple plans
- **🔍 Requirements Finder**: Step-by-step admission requirements for 13 provinces and 20 degree programs
- **📖 First Year Guide**: Standard first-year curriculum and major prerequisites
- **👤 User Accounts**: Save and sync your plans across devices with Supabase
- **📱 Responsive Design**: Optimized for mobile, tablet, and desktop

## 📊 Data Coverage

- ✅ **13 Canadian Provinces/Territories** - Complete coverage
- ✅ **20 UBC Degree Programs** - Full support
- ✅ **13 Engineering Majors** - Complete curriculum data
- ✅ **First Year Courses** - Standard curriculum and prerequisites

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/         # Page components
  └── App.jsx         # Main app component
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Backend**: Supabase (Database + Authentication)
- **Styling**: CSS3 (Custom design system)
- **Monitoring**: Sentry
- **Deployment**: GitHub Pages

## 📚 Documentation

### Main Documentation Files
- 📖 **[PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)** - Complete project description with all features and characteristics
- 🎯 **[FEATURES.md](FEATURES.md)** - Quick feature reference and index
- 📋 **[README.md](README.md)** - This file (quick start guide)
- 🗂️ **[.project-structure.md](.project-structure.md)** - Detailed project structure guide

### Organized Documentation
All detailed documentation is organized in the `Summary/` folder:

- **📁 [Summary/](Summary/)** - Complete documentation organized by category
  - **01-Project-Status/** - Current project status and completion reports
  - **02-Problem-Solutions/** - Problem-solving documentation
  - **03-Guides/** - User guides and how-to documentation
  - **04-Scraper-Documentation/** - Scraper-related documentation
  - **05-Archives/** - Old/archived documentation

**Quick Links:**
- 📖 [Documentation Index](Summary/INDEX.md) - Complete file index
- 🚀 [Quick Start Guide](Summary/03-Guides/QUICK_START.md) - Get started quickly
- ✅ [Project Status](Summary/01-Project-Status/✅_ALL_13_PROVINCES_COMPLETE.md) - Current status
- 🔧 [How to Update Requirements](Summary/03-Guides/HOW_TO_UPDATE_REQUIREMENTS.md) - Update data guide

## 🗂️ Project Structure

For a detailed project structure guide, see [.project-structure.md](.project-structure.md)

**Quick Overview:**
```
UBC_GO_V1/
├── src/                    # Source code
│   ├── components/        # Reusable React components
│   ├── pages/             # Page components
│   ├── context/           # React context (Auth)
│   ├── hooks/             # Custom React hooks
│   ├── data/              # Static data files
│   └── utils/             # Utility functions
├── scraper/               # Web scraping scripts
├── scripts/               # Build and utility scripts
├── docs/                  # Additional documentation
│   └── planning/         # Planning documents
├── Summary/               # Organized project documentation
├── dist/                   # Build output
├── PROJECT_DESCRIPTION.md  # Complete project description
├── FEATURES.md            # Feature reference
└── README.md              # This file
```

## ⚠️ Disclaimer

This website is not affiliated with the University of British Columbia. All admission probability calculations are based on historical data and trends, and do not guarantee admission. Please refer to the official UBC website for authoritative information.

