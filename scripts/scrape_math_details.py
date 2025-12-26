"""
MATH Course Details Scraper
Scrapes course descriptions, prerequisites, and equivalencies from UBC Calendar
and enriches existing curriculum JSON files for all engineering majors.

Usage:
    python scripts/scrape_math_details.py [--force]
    
Options:
    --force      Force re-scraping even if course already has details
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
import sys
from typing import Dict, List, Optional

class MATHCourseDetailsScraper:
    def __init__(self, force=False):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.course_list_url = f"{self.base_url}/course-descriptions/subject/mathv"
        self.force = force
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Path to curriculum JSON files
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.curriculum_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'applied-science')
        
        # Dictionary to store scraped course data
        self.course_data = {}
    
    def clean_course_code(self, code: str) -> str:
        """
        Clean course code: Convert MATH_V to MATH.
        Example: 'MATH_V 101' -> 'MATH 101'
        """
        # Remove _V suffix and normalize spacing
        code = re.sub(r'_V\s*', ' ', code.strip())
        code = re.sub(r'\s+', ' ', code)
        return code.strip()
    
    def clean_text(self, text: str) -> str:
        """
        Clean course description text by removing unwanted content.
        """
        if not text:
            return ""
        
        # Remove credit vector pattern [x-x-x]
        text = re.sub(r'\[?\d+-\d+-\d+\]?', '', text)
        
        # Remove "This course is not eligible for Credit/D/Fail grading"
        text = re.sub(r'This course is not eligible for Credit/D/Fail grading\.?', '', text, flags=re.IGNORECASE)
        
        # Clean up extra whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\s*\.\s*\.', '.', text)  # Fix double periods
        
        return text.strip()
    
    def parse_course_chunk(self, chunk_text: str) -> Optional[Dict]:
        """
        Parse a single course chunk.
        Fix: Splits Title and Description by newline instead of looking for a period.
        """
        if not chunk_text or not chunk_text.strip():
            return None
        
        # 1. Extract Course Code and Credits
        # Pattern handles: "MATH_V 101 (3)" or just "MATH_V 101"
        code_match = re.search(r'(MATH_V)\s+(\d{3}[A-Z]?)\s*(?:\((\d+)\))?', chunk_text, re.IGNORECASE)
        if not code_match:
            return None
        
        number = code_match.group(2)
        credits = code_match.group(3) if code_match.lastindex >= 3 else None
        course_code = self.clean_course_code(f"MATH_V {number}")
        
        # 2. Extract Title (robust newline method)
        header_end = code_match.end()
        remaining_text = chunk_text[header_end:]
        
        # Split at the first newline to separate Title from the rest
        if '\n' in remaining_text:
            raw_title, body_text = remaining_text.split('\n', 1)
        else:
            raw_title = remaining_text
            body_text = ""
            
        # Clean up the title (remove leading spaces or trailing periods)
        title = raw_title.strip()
        if title.endswith('.'): 
            title = title[:-1]

        # 3. Parse Body (Description, Prereqs, Equivalencies)
        full_text = body_text.strip()
        
        prerequisites = ""
        equivalency = ""

        # Extract Equivalency (Handles multi-line)
        # We look for "Equivalency:" followed by text until "Prerequisite:" or end of string
        equiv_pattern = r'Equivalency:\s*(.+?)(?=\s*(?:Prerequisite:|Corequisite:|This course|Credit will|$))'
        equiv_match = re.search(equiv_pattern, full_text, re.IGNORECASE | re.DOTALL)
        if equiv_match:
            equivalency = equiv_match.group(1).strip()
            # Remove the found section from full_text to clean up description
            full_text = full_text.replace(equiv_match.group(0), "")

        # Extract Prerequisites (Handles multi-line)
        # We look for "Prerequisite:" followed by text until "Equivalency:" or end of string
        prereq_pattern = r'Prerequisite:\s*(.+?)(?=\s*(?:Equivalency:|Corequisite:|This course|Credit will|$))'
        prereq_match = re.search(prereq_pattern, full_text, re.IGNORECASE | re.DOTALL)
        if prereq_match:
            prerequisites = prereq_match.group(1).strip()
            full_text = full_text.replace(prereq_match.group(0), "")

        # 4. Clean up the Description
        # Remove any leftover labels or massive whitespace
        description = self.clean_text(full_text)
        prerequisites = self.clean_text(prerequisites)
        equivalency = self.clean_text(equivalency)

        return {
            'code': course_code,
            'title': title,
            'credits': int(credits) if credits else None,
            'description': description,
            'prerequisites': prerequisites,
            'equivalency': equivalency
        }
    
    def scrape_course_list(self) -> Dict[str, Dict]:
        """
        Scrape all MATH courses from the calendar page using chunking strategy.
        Returns a dictionary mapping course codes to course data.
        """
        print(f"Scraping MATH courses from: {self.course_list_url}")
        
        try:
            response = self.session.get(self.course_list_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the main content container
            main_content = None
            for selector in ['main', 'article', '.content', '#content', '.main-content']:
                main_content = soup.select_one(selector)
                if main_content:
                    break
            
            # If no specific container found, use the body
            if not main_content:
                main_content = soup.find('body') or soup
            
            # Get all text from the main content
            full_text = main_content.get_text(separator='\n', strip=False)
            
            # Split into chunks using course headers
            # Pattern to find all course headers: MATH_V followed by number
            header_pattern = r'MATH_V\s+\d{3}[A-Z]?'
            
            # Find all header positions
            headers = []
            for match in re.finditer(header_pattern, full_text, re.IGNORECASE):
                headers.append(match.start())
            
            if not headers:
                print("  Warning: No course headers found!")
                return {}
            
            print(f"  Found {len(headers)} course headers")
            
            # Extract chunks between headers
            chunks = []
            for i in range(len(headers)):
                start = headers[i]
                end = headers[i + 1] if i + 1 < len(headers) else len(full_text)
                chunk = full_text[start:end].strip()
                if chunk:
                    chunks.append(chunk)
            
            print(f"  Extracted {len(chunks)} course chunks")
            
            course_data = {}
            
            # Process each chunk
            for i, chunk in enumerate(chunks):
                chunk = chunk.strip()
                if not chunk:
                    continue
                
                course_info = self.parse_course_chunk(chunk)
                if course_info and course_info['code']:
                    # Avoid duplicates (keep first occurrence)
                    if course_info['code'] not in course_data:
                        course_data[course_info['code']] = course_info
                        print(f"  Parsed: {course_info['code']} - {course_info.get('title', 'No title')[:50]}")
                    elif self.force:
                        # If force mode, update with more complete data
                        existing = course_data.get(course_info['code'], {})
                        # Update if new data has more information
                        if (course_info.get('description') and len(course_info.get('description', '')) > len(existing.get('description', ''))) or \
                           (course_info.get('prerequisites') and not existing.get('prerequisites')):
                            course_data[course_info['code']] = course_info
                            print(f"  Updated: {course_info['code']}")
            
            print(f"\nScraped {len(course_data)} MATH courses")
            return course_data
            
        except Exception as e:
            print(f"Error scraping course list: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def save_to_json(self, course_data: Dict[str, Dict], filename: str = "ubc_math_courses.json"):
        """
        Save scraped course data to a JSON file.
        """
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_path = os.path.join(script_dir, filename)
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(course_data, f, indent=2, ensure_ascii=False)
            print(f"\nSaved {len(course_data)} courses to: {output_path}")
            return output_path
        except Exception as e:
            print(f"Error saving JSON file: {e}")
            return None
    
    def load_json_file(self, filename: str) -> Optional[Dict]:
        """Load a JSON curriculum file."""
        filepath = os.path.join(self.curriculum_dir, filename)
        
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            return None
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return None
    
    def save_json_file(self, data: Dict, filename: str):
        """Save a JSON curriculum file."""
        filepath = os.path.join(self.curriculum_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  Saved: {filepath}")
        except Exception as e:
            print(f"Error saving {filename}: {e}")
    
    def update_course(self, course: Dict, scraped_data: Dict) -> bool:
        """
        Update a course object with scraped data.
        Returns True if course was updated.
        """
        code = course.get('code', '')
        
        # Only process MATH courses
        if not code or not code.startswith('MATH'):
            return False
        
        # Check if we should skip (unless force mode)
        if not self.force:
            if course.get('description') and course.get('prerequisites'):
                return False
        
        # Look up in scraped data
        if code not in scraped_data:
            return False
        
        updated = False
        scraped = scraped_data[code]
        
        # Update title if missing
        if scraped.get('title') and not course.get('title'):
            course['title'] = scraped['title']
            updated = True
        
        # Update description
        if scraped.get('description'):
            course['description'] = scraped['description']
            updated = True
        
        # Update prerequisites
        if scraped.get('prerequisites'):
            course['prerequisites'] = scraped['prerequisites']
            updated = True
        
        # Update equivalency (store in prerequisites field with prefix if both exist)
        if scraped.get('equivalency'):
            if course.get('prerequisites'):
                course['prerequisites'] = f"{course['prerequisites']}\n\nEquivalency: {scraped['equivalency']}"
            else:
                course['prerequisites'] = f"Equivalency: {scraped['equivalency']}"
            updated = True
        
        return updated
    
    def process_curriculum_file(self, filename: str, scraped_data: Dict):
        """
        Process a curriculum JSON file and enrich MATH courses.
        """
        print(f"\n{'='*60}")
        print(f"Processing: {filename}")
        print(f"{'='*60}")
        
        data = self.load_json_file(filename)
        if not data:
            return
        
        # Track statistics
        total_courses = 0
        processed_courses = 0
        updated_courses = 0
        
        # Iterate through all courses in all years and terms
        for year_data in data.get('years', []):
            for term_data in year_data.get('terms', []):
                for course in term_data.get('courses', []):
                    total_courses += 1
                    
                    # Check if this is a MATH course
                    code = course.get('code', '')
                    if code and code.startswith('MATH'):
                        processed_courses += 1
                        if self.update_course(course, scraped_data):
                            updated_courses += 1
        
        print(f"\nSummary for {filename}:")
        print(f"  Total courses: {total_courses}")
        print(f"  MATH courses: {processed_courses}")
        print(f"  Updated courses: {updated_courses}")
        
        # Save the updated file
        if updated_courses > 0:
            self.save_json_file(data, filename)
        else:
            print(f"  No updates needed, skipping save")
    
    def run(self):
        """Main execution method"""
        print("=" * 60)
        print("MATH Course Details Scraper")
        print("=" * 60)
        if self.force:
            print("Mode: FORCE (re-scraping all courses)")
        else:
            print("Mode: NORMAL (skip courses with existing details)")
        print(f"Curriculum directory: {self.curriculum_dir}")
        print("=" * 60)
        
        # Step A: Scrape course list and build dictionary
        print("\n[Step A] Scraping MATH courses from UBC Calendar...")
        scraped_data = self.scrape_course_list()
        
        if not scraped_data:
            print("Error: No course data scraped. Exiting.")
            return
        
        # Save to standalone JSON file
        print("\n[Step A.1] Saving scraped data to JSON file...")
        self.save_to_json(scraped_data)
        
        print(f"\nScraped {len(scraped_data)} MATH courses")
        print("\nSample courses:")
        for i, (code, data) in enumerate(list(scraped_data.items())[:5]):
            print(f"  {code}: {data.get('title', 'No title')[:60]}...")
        
        # Step B: Update all JSON files
        print(f"\n[Step B] Updating curriculum JSON files...")
        
        # Get all JSON files in the directory
        json_files = [f for f in os.listdir(self.curriculum_dir) if f.endswith('.json')]
        
        for filename in sorted(json_files):
            self.process_curriculum_file(filename, scraped_data)
            time.sleep(0.5)  # Brief pause between files
        
        print(f"\n{'='*60}")
        print("Scraping Complete!")
        print(f"{'='*60}")


if __name__ == "__main__":
    # Parse command line arguments
    force = '--force' in sys.argv
    
    scraper = MATHCourseDetailsScraper(force=force)
    scraper.run()

