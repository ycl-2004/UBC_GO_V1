VERIFICATION AND TESTING SCRIPTS
=================================

This folder contains scripts for verifying, testing, and validating scraped data quality.

Files:
------

1. verify_all_requirements.py
   - Verifies that all admission requirements are correctly scraped
   - Checks data completeness and format consistency
   - Validates against expected data structures

2. test_scraper.py
   - General testing script for scrapers
   - Tests scraper functionality and output formats

3. test_alberta_specific.py
   - Tests Alberta-specific requirement scraping
   - Validates Alberta high school course mappings

4. check_all_bullet_formats.py
   - Checks bullet point formatting in scraped data
   - Ensures consistent formatting across requirements

5. comprehensive_bullet_check.py
   - Comprehensive check of bullet point formats
   - More thorough validation than check_all_bullet_formats.py

6. final_complete_verification.py
   - Final verification script before deploying data
   - Comprehensive data quality checks

7. final_comprehensive_check.py
   - Final comprehensive check of all scraped data
   - Validates data integrity and completeness

Usage:
------
- Run verification scripts: python verification/[script_name].py
- Use before deploying data to production
- Helps ensure data quality and consistency

Note:
-----
These scripts are important for maintaining data quality and catching issues before they reach the frontend application.

