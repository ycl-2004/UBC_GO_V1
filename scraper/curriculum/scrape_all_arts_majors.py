#!/usr/bin/env python3
"""
Script to scrape all Arts majors and identify any with different URL formats.
"""

import sys
import os
import json
import re
import time

# Add project root to path to import the scraper
# File is at: scraper/curriculum/scrape_all_arts_majors.py
# Need to go up 3 levels to get to project root
script_path = os.path.abspath(__file__)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_path)))
sys.path.insert(0, project_root)

# Import the scraper class directly
from scraper.curriculum.scrape_arts_curriculum import UBCArtsCurriculumScraper

# Import BA majors from artsData.js
# Since we can't directly import JS, we'll read the file and parse it
def get_ba_majors():
    """Extract BA majors from artsData.js"""
    # Use the same project root calculation
    script_path = os.path.abspath(__file__)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_path)))
    
    arts_data_path = os.path.join(project_root, 'src', 'data', 'artsData.js')
    
    if not os.path.exists(arts_data_path):
        raise FileNotFoundError(f"Could not find artsData.js at: {arts_data_path}\nProject root: {project_root}")
    
    majors = []
    with open(arts_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Extract majors from baMajorsByCategory object
        # Look for arrays after category names
        category_pattern = r"'([^']+)':\s*\[(.*?)\]"
        for category_match in re.finditer(category_pattern, content, re.DOTALL):
            category_majors = category_match.group(2)
            # Extract all quoted strings from the array
            for major_match in re.finditer(r"'([^']+)'", category_majors):
                major = major_match.group(1)
                if major and major not in majors:
                    majors.append(major)
    
    return sorted(majors)

def normalize_major_name(major_name):
    """Convert major name to URL-friendly format"""
    # Convert to lowercase and replace spaces/special chars with hyphens
    normalized = major_name.lower()
    normalized = re.sub(r'[^\w\s-]', '', normalized)  # Remove special chars
    normalized = re.sub(r'\s+', '-', normalized)  # Replace spaces with hyphens
    normalized = re.sub(r'-+', '-', normalized)  # Replace multiple hyphens with one
    return normalized

def construct_major_url(base_url, major_name):
    """Construct URL for a major based on standard format"""
    normalized = normalize_major_name(major_name)
    return f"{base_url}/faculties-colleges-and-schools/faculty-arts/bachelor-arts/{normalized}"

def try_alternative_urls(scraper, major_name):
    """Try alternative URL formats for a major"""
    alternatives = []
    
    # Try different variations
    base_name = major_name.lower()
    variations = [
        base_name.replace(' ', '-'),
        base_name.replace(' ', '_'),
        base_name.replace(' and ', '-and-'),
        base_name.replace(' & ', '-and-'),
        base_name.replace("'", ''),
        base_name.replace("'", '-'),
        base_name.replace(',', ''),
        base_name.replace('(', ''),
        base_name.replace(')', ''),
    ]
    
    # Remove duplicates
    variations = list(dict.fromkeys(variations))
    
    base_path = f"{scraper.base_url}/faculties-colleges-and-schools/faculty-arts/bachelor-arts"
    
    for variation in variations:
        url = f"{base_path}/{variation}"
        try:
            response = scraper.session.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                alternatives.append(url)
        except:
            pass
    
    return alternatives

def main():
    print("=" * 80)
    print("Arts Major Scraper - Batch Processing")
    print("=" * 80)
    print()
    
    scraper = UBCArtsCurriculumScraper()
    ba_majors = get_ba_majors()
    
    print(f"Found {len(ba_majors)} BA majors to scrape")
    print()
    
    successful = []
    failed = []
    different_format = []
    no_data = []
    
    for i, major_name in enumerate(ba_majors, 1):
        print(f"[{i}/{len(ba_majors)}] Processing: {major_name}")
        
        # Try standard URL format
        standard_url = construct_major_url(scraper.base_url, major_name)
        
        # Check if URL exists
        try:
            response = scraper.session.head(standard_url, timeout=10, allow_redirects=True)
            if response.status_code == 200:
                # Use GET for actual scraping
                response = scraper.session.get(standard_url, timeout=10)
                # Try to scrape
                curriculum = scraper.scrape_major_requirements(standard_url, major_name)
                
                if curriculum and any(curriculum.values()):
                    successful.append({
                        'major': major_name,
                        'url': standard_url,
                        'format': 'standard'
                    })
                    print(f"  ✅ Successfully scraped {major_name}")
                else:
                    no_data.append({
                        'major': major_name,
                        'url': standard_url,
                        'reason': 'No curriculum data found'
                    })
                    print(f"  ⚠️  No curriculum data found for {major_name}")
            else:
                # URL doesn't exist, try alternative formats
                print(f"  🔍 Standard URL failed, trying alternatives...")
                alternative_urls = try_alternative_urls(scraper, major_name)
                
                if alternative_urls:
                    # Try the first alternative
                    alt_url = alternative_urls[0]
                    print(f"  🔄 Trying alternative: {alt_url}")
                    try:
                        response = scraper.session.get(alt_url, timeout=10)
                        if response.status_code == 200:
                            curriculum = scraper.scrape_major_requirements(alt_url, major_name)
                            if curriculum and any(curriculum.values()):
                                successful.append({
                                    'major': major_name,
                                    'url': alt_url,
                                    'format': 'alternative',
                                    'standard_url': standard_url
                                })
                                different_format.append({
                                    'major': major_name,
                                    'standard_url': standard_url,
                                    'working_url': alt_url
                                })
                                print(f"  ✅ Successfully scraped with alternative URL")
                                continue
                    except Exception as e:
                        pass
                
                # No working alternative found
                failed.append({
                    'major': major_name,
                    'url': standard_url,
                    'status': response.status_code,
                    'reason': 'URL not found',
                    'alternatives_tried': alternative_urls
                })
                print(f"  ❌ URL not found: {standard_url} (Status: {response.status_code})")
                
        except Exception as e:
            failed.append({
                'major': major_name,
                'url': standard_url,
                'error': str(e),
                'reason': 'Exception during scraping'
            })
            print(f"  ❌ Error: {e}")
        
        print()
    
    # Save results
    results = {
        'successful': successful,
        'failed': failed,
        'different_format': different_format,
        'no_data': no_data,
        'summary': {
            'total': len(ba_majors),
            'successful': len(successful),
            'failed': len(failed),
            'different_format': len(different_format),
            'no_data': len(no_data)
        }
    }
    
    # Get project root (same calculation as at top of file)
    script_path = os.path.abspath(__file__)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_path)))
    
    results_file = os.path.join(project_root, 'scraper', 'curriculum', 'arts_scraping_results.json')
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total majors: {len(ba_majors)}")
    print(f"✅ Successfully scraped: {len(successful)}")
    print(f"🔄 Different format (alternative URL worked): {len(different_format)}")
    print(f"❌ Failed: {len(failed)}")
    print(f"⚠️  No data: {len(no_data)}")
    print()
    
    if different_format:
        print("=" * 80)
        print("MAJORS WITH DIFFERENT URL FORMAT:")
        print("=" * 80)
        for item in different_format:
            print(f"  - {item['major']}")
            print(f"    Standard URL: {item['standard_url']}")
            print(f"    Working URL: {item['working_url']}")
            print()
    
    if failed:
        print("=" * 80)
        print("FAILED MAJORS (Different URL format or not found):")
        print("=" * 80)
        for item in failed:
            print(f"  - {item['major']}")
            print(f"    URL tried: {item['url']}")
            print(f"    Reason: {item['reason']}")
            if 'status' in item:
                print(f"    Status: {item['status']}")
            print()
    
    if no_data:
        print("=" * 80)
        print("MAJORS WITH NO CURRICULUM DATA:")
        print("=" * 80)
        for item in no_data:
            print(f"  - {item['major']}")
            print(f"    URL: {item['url']}")
            print()
    
    print(f"\nDetailed results saved to: {results_file}")
    
    return results

if __name__ == '__main__':
    main()
