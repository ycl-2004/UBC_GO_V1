COURSE DATA SCRAPERS
====================

This folder contains scrapers that extract individual course information from the UBC Academic Calendar.

Files:
------

1. scrape_ubc_courses.py
   - Scrapes course data from vancouver.calendar.ubc.ca
   - Extracts course codes, titles, descriptions, prerequisites, and credits
   - Can scrape courses by faculty (e.g., CPSC, MATH, ENGL)
   - Provides detailed course information for the course catalog
   - Output: courses.json or faculty-specific course files

Usage:
------
- Run: python courses/scrape_ubc_courses.py
- Can specify faculty codes as arguments
- Output files go to src/data/courses/

Note:
-----
This scraper is useful for building a comprehensive course database for the application.

