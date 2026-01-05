CURRICULUM SCRAPERS
==================

This folder contains scrapers that extract curriculum and prerequisite information for different UBC faculties and programs.

Files:
------

1. scrape_science_curriculum.py
   - Scrapes curriculum data for all UBC Science majors from the Academic Calendar
   - Handles 20+ Science specializations (Astronomy, Biology, Chemistry, etc.)
   - Extracts course requirements for Years 1-4
   - Handles superscript footnotes, elective requirements, and communication requirements
   - Output: science_curriculum.json

2. scrape_cpsc_curriculum.py
   - Specialized scraper for Computer Science (CPSC) curriculum
   - Handles edge case where Year 1 is in a separate table from Years 2-4
   - Processes multiple tables until "Total Credits for Degree" is found
   - Updates the science_curriculum.json file with CPSC data

3. scrape_engineering_prereqs.py
   - Scrapes prerequisite data for all 13 UBC Engineering majors
   - Uses Selenium to handle dynamic content
   - Extracts prerequisite chains and affected courses
   - Covers: BMEG, CHBE, CIVL, CPEN, ELEC, ENPH, ENVL, GEOE, IGEN, MANU, MECH, MINE, MTRL
   - Output: engineering_prerequisites.json

Usage:
------
- Run individual scrapers: python curriculum/scrape_[name].py
- All scrapers output JSON files to src/data/curriculum/

