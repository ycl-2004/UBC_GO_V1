#!/usr/bin/env python3
"""
Batch scraper for all UBC Science majors.
This script runs scrape_single_science_major.py for each major.
"""

import subprocess
import sys
import os

# List of all Science majors (matching the format expected by the scraper)
SCIENCE_MAJORS = [
    "Astronomy",
    "Atmospheric Science",
    "Behavioural Neuroscience",
    "Biochemistry",
    "Biology",
    "Biotechnology",
    "Botany",
    "Cellular and Physiological Sciences",
    "Chemistry",
    "Cognitive Systems",
    "Combined Major in Science",
    "Computer Science",
    "Data Science",
    "Earth and Ocean Sciences",
    "Environmental Sciences",
    "Forensic Science",
    "General Science",
    "Geographical Sciences",
    "Geological Sciences",
    "Geophysics",
    "Integrated Sciences",
    "Mathematics",
    "Microbiology and Immunology",
    "Neuroscience",
    "Oceanography",
    "Pharmacology",
    "Physics",
    "Statistics",
    "Zoology"
]

def scrape_major(major_name):
    """Scrape a single major and return success status"""
    print(f"\n{'='*70}")
    print(f"Scraping: {major_name}")
    print(f"{'='*70}")
    
    script_path = os.path.join(os.path.dirname(__file__), 'scrape_single_science_major.py')
    
    try:
        result = subprocess.run(
            [sys.executable, script_path, major_name],
            capture_output=False,
            text=True,
            check=True
        )
        print(f"✓ Successfully scraped: {major_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to scrape: {major_name}")
        print(f"  Error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error scraping {major_name}: {e}")
        return False

def main():
    """Main entry point"""
    print("="*70)
    print("UBC Science Majors Batch Scraper")
    print("="*70)
    print(f"Total majors to scrape: {len(SCIENCE_MAJORS)}")
    print("="*70)
    
    successful = []
    failed = []
    
    for i, major in enumerate(SCIENCE_MAJORS, 1):
        print(f"\n[{i}/{len(SCIENCE_MAJORS)}] Processing: {major}")
        if scrape_major(major):
            successful.append(major)
        else:
            failed.append(major)
    
    # Summary
    print("\n" + "="*70)
    print("SCRAPING SUMMARY")
    print("="*70)
    print(f"Total majors: {len(SCIENCE_MAJORS)}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")
    
    if successful:
        print(f"\n✓ Successfully scraped majors:")
        for major in successful:
            print(f"  - {major}")
    
    if failed:
        print(f"\n✗ Failed majors:")
        for major in failed:
            print(f"  - {major}")
        print("\nYou can retry failed majors individually:")
        for major in failed:
            print(f"  python scraper/curriculum/scrape_single_science_major.py \"{major}\"")
    
    print("="*70)

if __name__ == "__main__":
    main()

