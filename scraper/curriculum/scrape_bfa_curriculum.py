#!/usr/bin/env python3
"""
UBC BFA (Bachelor of Fine Arts) Curriculum Scraper
Scrapes curriculum data for BFA majors from the Academic Calendar.
Uses the same sibling traversal logic as the Arts BA scraper.

Usage:
    python scraper/curriculum/scrape_bfa_curriculum.py
"""

import sys
import os
import json
import time

# Add project root to path
script_path = os.path.abspath(__file__)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_path)))
sys.path.insert(0, project_root)

from scraper.curriculum.scrape_arts_curriculum import UBCArtsCurriculumScraper

# BFA Majors list
BFA_MAJORS = [
    'Acting',
    'Creative Writing',
    'Film Production',
    'Theatre Design and Production',
    'Visual Art',
]

def normalize_bfa_major_name(major_name):
    """Convert BFA major name to URL-friendly format"""
    import re
    normalized = major_name.lower()
    normalized = re.sub(r'[^\w\s-]', '', normalized)
    normalized = re.sub(r'\s+', '-', normalized)
    normalized = re.sub(r'-+', '-', normalized)
    return normalized

def construct_bfa_major_url(base_url, major_name):
    """Construct URL for a BFA major"""
    normalized = normalize_bfa_major_name(major_name)
    return f"{base_url}/faculties-colleges-and-schools/faculty-arts/bachelor-fine-arts/{normalized}"

def main():
    print("=" * 80)
    print("UBC BFA Curriculum Scraper")
    print("=" * 80)
    print()
    
    scraper = UBCArtsCurriculumScraper()
    
    # Load existing curriculum data
    curriculum_file = os.path.join(project_root, 'src', 'data', 'curriculum', 'arts', 'arts_curriculum.json')
    all_curriculum = {}
    if os.path.exists(curriculum_file):
        try:
            with open(curriculum_file, 'r', encoding='utf-8') as f:
                all_curriculum = json.load(f)
            print(f"Loaded existing data with {len(all_curriculum)} majors")
        except Exception as e:
            print(f"Could not load existing data: {e}")
            all_curriculum = {}
    
    print(f"\nScraping {len(BFA_MAJORS)} BFA majors...")
    print("=" * 80)
    print()
    
    successful = []
    failed = []
    
    for i, major_name in enumerate(BFA_MAJORS, 1):
        print(f"[{i}/{len(BFA_MAJORS)}] Processing: {major_name}")
        
        # Construct URL
        major_url = construct_bfa_major_url(scraper.base_url, major_name)
        print(f"  URL: {major_url}")
        
        # Scrape the major
        curriculum = scraper.scrape_major_requirements(major_url, major_name)
        
        if curriculum and any(curriculum.values()):
            all_curriculum[major_name] = curriculum
            successful.append(major_name)
            print(f"  ✅ Successfully scraped {major_name}")
        else:
            failed.append(major_name)
            print(f"  ❌ Failed to scrape {major_name}")
        
        # Be polite - add delay between requests
        time.sleep(1)
        print()
    
    # Save updated curriculum
    print("=" * 80)
    print("Saving curriculum data...")
    with open(curriculum_file, 'w', encoding='utf-8') as f:
        json.dump(all_curriculum, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(all_curriculum)} majors to {curriculum_file}")
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total BFA majors: {len(BFA_MAJORS)}")
    print(f"✅ Successfully scraped: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    if successful:
        print(f"\nSuccessful majors:")
        for major in successful:
            print(f"  - {major}")
    if failed:
        print(f"\nFailed majors:")
        for major in failed:
            print(f"  - {major}")
    print("=" * 80)

if __name__ == '__main__':
    main()
