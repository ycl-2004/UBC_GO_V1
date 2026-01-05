DATA PROCESSING SCRIPTS
=======================

This folder contains scripts that process, clean, and fix scraped data to make it frontend-ready.

Files:
------

1. process_admission_data.py
   - Processes scraped admission requirements for frontend use
   - Converts raw scraped data into structured format
   - Handles province mappings and degree program organization

2. process_data.py
   - General data processing utilities
   - Transforms raw scraped data into application-friendly formats

3. process_detailed_requirements.py
   - Processes detailed admission requirements data
   - Enhances and structures the data for better frontend consumption

4. fix_all_compound_requirements.py
   - Fixes compound requirements (e.g., "MATH 100 or 102 or 104")
   - Normalizes requirement formats across different data sources

5. fix_physics_waiver.py
   - Handles physics waiver requirements
   - Fixes specific physics-related requirement issues

6. fix_science_requirements.py
   - Fixes Science faculty-specific requirement issues
   - Normalizes Science program requirements

7. apply_province_mappings.py
   - Applies province code mappings to scraped data
   - Ensures consistent province naming across the application

Usage:
------
- Run individual scripts: python data_processing/[script_name].py
- These scripts typically read from scraper/data/ and output to src/data/
- Run after scraping to clean and structure the data

Note:
-----
These scripts are essential for transforming raw scraped data into formats usable by the frontend application.

