#!/usr/bin/env python3
"""
Script to scrape all successful Arts majors and update arts_curriculum.json
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

def load_scraping_results():
    """Load the scraping results to get list of successful majors"""
    results_file = os.path.join(project_root, 'scraper', 'curriculum', 'arts_scraping_results.json')
    
    if not os.path.exists(results_file):
        print(f"⚠️  Results file not found: {results_file}")
        print("   Run scrape_all_arts_majors.py first to generate results.")
        return None
    
    with open(results_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_existing_curriculum():
    """Load existing curriculum data"""
    curriculum_file = os.path.join(project_root, 'src', 'data', 'curriculum', 'arts', 'arts_curriculum.json')
    
    if os.path.exists(curriculum_file):
        with open(curriculum_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_curriculum(curriculum_data):
    """Save curriculum data to JSON file"""
    curriculum_file = os.path.join(project_root, 'src', 'data', 'curriculum', 'arts', 'arts_curriculum.json')
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(curriculum_file), exist_ok=True)
    
    with open(curriculum_file, 'w', encoding='utf-8') as f:
        json.dump(curriculum_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(curriculum_data)} majors to {curriculum_file}")

def construct_major_url(base_url, major_name):
    """Construct URL for a major"""
    import re
    normalized = major_name.lower()
    normalized = re.sub(r'[^\w\s-]', '', normalized)
    normalized = re.sub(r'\s+', '-', normalized)
    normalized = re.sub(r'-+', '-', normalized)
    return f"{base_url}/faculties-colleges-and-schools/faculty-arts/bachelor-arts/{normalized}"

def main():
    print("=" * 80)
    print("Arts Curriculum Updater")
    print("=" * 80)
    print()
    
    # Load scraping results
    results = load_scraping_results()
    if not results:
        return
    
    # Get list of successful majors
    successful_majors = results.get('successful', [])
    different_format_majors = results.get('different_format', [])
    
    # Combine all successful majors (both standard and alternative format)
    all_successful = []
    for item in successful_majors:
        all_successful.append({
            'major': item['major'],
            'url': item.get('url', construct_major_url('https://vancouver.calendar.ubc.ca', item['major']))
        })
    
    for item in different_format_majors:
        all_successful.append({
            'major': item['major'],
            'url': item.get('working_url', construct_major_url('https://vancouver.calendar.ubc.ca', item['major']))
        })
    
    print(f"Found {len(all_successful)} successful majors to scrape")
    print()
    
    # Load existing curriculum
    curriculum_data = load_existing_curriculum()
    print(f"Loaded existing curriculum with {len(curriculum_data)} majors")
    print()
    
    # Initialize scraper
    scraper = UBCArtsCurriculumScraper()
    
    # Scrape each successful major
    new_count = 0
    updated_count = 0
    
    for i, item in enumerate(all_successful, 1):
        major_name = item['major']
        major_url = item['url']
        
        print(f"[{i}/{len(all_successful)}] Scraping: {major_name}")
        
        # Check if already exists
        if major_name in curriculum_data:
            print(f"  ⚠️  {major_name} already exists, updating...")
            updated_count += 1
        else:
            new_count += 1
        
        # Scrape the major
        curriculum = scraper.scrape_major_requirements(major_url, major_name)
        
        if curriculum and any(curriculum.values()):
            curriculum_data[major_name] = curriculum
            print(f"  ✅ Successfully scraped {major_name}")
        else:
            print(f"  ⚠️  No curriculum data found for {major_name}")
        
        # Be polite - add delay between requests
        time.sleep(1)
        print()
    
    # Save updated curriculum
    print("=" * 80)
    print("Saving curriculum data...")
    save_curriculum(curriculum_data)
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total majors processed: {len(all_successful)}")
    print(f"New majors added: {new_count}")
    print(f"Existing majors updated: {updated_count}")
    print(f"Total majors in curriculum: {len(curriculum_data)}")
    print("=" * 80)

if __name__ == '__main__':
    main()
