# Scripts Folder

## 🚀 Overview

This folder contains build and utility scripts for UBC PathFinder, including scrapers for engineering curriculum data and other utility scripts.

## 📂 File Guide

### Key Scripts and Their Purposes

| Script | Purpose |
|--------|---------|
| `scrape_ubc_engineering.py` | Scrapes engineering curriculum data from UBC Academic Calendar |
| `scrape_apsc_details.py` | Scrapes Applied Science program details |
| `scrape_course_details.py` | Scrapes individual course details |
| `scrape_ece_details.py` | Scrapes Electrical and Computer Engineering details |
| `scrape_math_details.py` | Scrapes Mathematics course details |
| `scrape_single_course.py` | Scrapes a single course by code |
| `copy-404.js` | Copies 404.html to dist folder for GitHub Pages |

## 🛠️ How to Use

### UBC Engineering Curriculum Scraper

This script scrapes engineering curriculum data from the UBC Academic Calendar and generates JSON files for each engineering major.

#### Setup

Install required dependencies:

```bash
pip install requests beautifulsoup4
```

Or if you're using the project's requirements:

```bash
pip install -r scraper/requirements.txt
```

#### Usage

Run the scraper:

```bash
python scripts/scrape_ubc_engineering.py
```

The script will:
1. Scrape standard first year courses (common to all engineering majors)
2. Find all engineering majors from the UBC calendar
3. Scrape curriculum for each major (Years 2-4)
4. Generate JSON files in `src/data/curriculum/applied-science/`

#### Output

Each major will have a JSON file named `{major-slug}.json` (e.g., `civil-engineering.json`, `electrical-engineering.json`).

The JSON structure matches the existing format used by the application:
- `faculty`: "Applied Science"
- `major`: Full program name
- `totalCredits`: Total credit count
- `years`: Array of year objects with terms and courses

## ✅ Current Feature Status

### Working Scripts
- ✅ Engineering curriculum scraper
- ✅ Course detail scrapers
- ✅ 404 page copy script

### Data Processing
- ✅ Course code cleaning (e.g., 'CIVL 2351' -> 'CIVL 235')
- ✅ Elective handling
- ✅ Error handling and fallback data

### Notes

- Biomedical Engineering is skipped by default (can be handled separately)
- The script includes error handling and fallback data
- Rate limiting is included to be polite to UBC's servers
- Course codes are cleaned (e.g., 'CIVL 2351' -> 'CIVL 235')
- Electives are stored as `{ "code": "ELECTIVE", "title": "...", "credits": 3 }`

## 🔧 Troubleshooting

If the script fails on a specific major:
1. Check the error message
2. The HTML structure might be different for that page
3. You can modify the selectors in the `extract_courses_from_section` method
4. Or add try-except blocks for specific majors

### Common Issues

**Problem: Module not found**
- Ensure dependencies are installed: `pip install -r scraper/requirements.txt`

**Problem: HTML structure changed**
- Check the UBC calendar website structure
- Update selectors in the scraper code

**Problem: Rate limiting**
- Script includes delays between requests
- If issues persist, increase delay times

