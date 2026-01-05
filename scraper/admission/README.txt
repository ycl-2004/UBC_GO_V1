ADMISSION REQUIREMENTS SCRAPERS
================================

This folder contains scrapers that extract admission requirements for Canadian high school students applying to UBC.

Files:
------

1. scrape_admission_requirements.py
   - Scrapes basic admission requirements from you.ubc.ca
   - Extracts requirements by province and degree program
   - Uses Selenium WebDriver for dynamic content
   - Handles province-specific course requirements
   - Output: admission_requirements.json

2. scrape_detailed_requirements.py
   - Enhanced scraper for detailed admission requirements
   - Provides more comprehensive data extraction
   - Includes specific course requirements, GPA calculations, and program-specific criteria
   - Handles both Vancouver and Okanagan campuses
   - Output: vancouver_detailed_requirements.json

Usage:
------
- Run scrapers: python admission/scrape_[name].py
- Requires Selenium and ChromeDriver
- Output files go to scraper/data/

Note:
-----
These scrapers interact with dynamic web content and may require updates if the UBC website structure changes.

