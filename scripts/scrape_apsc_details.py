"""
APSC Course Details Scraper
Scrapes course descriptions, prerequisites, and corequisites from UBC Calendar
and enriches existing curriculum JSON files for all engineering majors.

Usage:
    python scripts/scrape_apsc_details.py [--force]
    
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

class APSCCourseDetailsScraper:
    def __init__(self, force=False):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.course_list_url = f"{self.base_url}/course-descriptions/subject/apscv"
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
        Clean course code: Convert APSC_V to APSC.
        Example: 'APSC_V 178' -> 'APSC 178'
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
    
    def extract_requirements(self, text: str, keyword: str) -> tuple:
        """
        Extract prerequisites or corequisites from text and return both
        the requirement text and the cleaned text without it.
        
        Returns: (requirement_text, cleaned_text)
        """
        # Pattern to match "Prerequisite:" or "Corequisite:" followed by text
        # Stop at period, newline, or next requirement keyword
        pattern = rf'{keyword}:\s*([^.]*(?:\.[^.]*)*?)(?=\s*(?:Prerequisite|Corequisite|Co-requisite):|$)'
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        
        if match:
            requirement_text = match.group(1).strip()
            # Remove the requirement from the original text
            cleaned_text = re.sub(rf'{keyword}:\s*{re.escape(requirement_text)}', '', text, flags=re.IGNORECASE | re.DOTALL)
            # Clean up any trailing periods or commas
            requirement_text = re.sub(r'[.,]+$', '', requirement_text).strip()
            return (requirement_text, cleaned_text)
        
        return ("", text)
    
    def parse_course_chunk(self, chunk_text: str) -> Optional[Dict]:
        """
        Parse a single course chunk (text between course headers).
        Returns dict with code, description, prerequisites, corequisites.
        """
        if not chunk_text or not chunk_text.strip():
            return None
        
        # Extract course code from the header
        # Pattern: APSC_V 100 or APSC_V 178 (4) Title
        code_match = re.search(r'APSC_V\s+(\d{3}[A-Z]?)\s*(?:\((\d+)\))?', chunk_text, re.IGNORECASE)
        if not code_match:
            return None
        
        number = code_match.group(1)
        credits = code_match.group(2) if code_match.lastindex >= 2 and code_match.group(2) else None
        
        # Clean the code (convert APSC_V to APSC)
        course_code = f"APSC {number}"
        
        # Find where the course header ends (after code, credits, and title)
        # The title usually ends at the first period or newline after the header
        header_end = code_match.end()
        
        # Try to find where the actual description starts (skip the title)
        # Look for the first sentence after the header
        description_start = header_end
        # Skip past potential title (usually short, ends with period or newline)
        title_match = re.search(r'^[^.]*\.', chunk_text[header_end:header_end+200], re.MULTILINE)
        if title_match:
            description_start = header_end + title_match.end()
        
        # Get the full text content for this course
        full_text = chunk_text[description_start:].strip()
        
        # Extract prerequisites (handle both "Prerequisite:" and "Prerequisites:")
        prerequisites = ""
        corequisites = ""
        
        # Try to extract prerequisites first (they usually come before corequisites)
        prereq_pattern = r'(?:Prerequisite|Prerequisites):\s*([^.]*(?:\.[^.]*)*?)(?=\s*(?:Corequisite|Co-requisite|Corequisites):|$)'
        prereq_match = re.search(prereq_pattern, full_text, re.IGNORECASE | re.DOTALL)
        if prereq_match:
            prerequisites = prereq_match.group(1).strip()
            # Remove the entire prerequisite section from description
            prereq_full_match = prereq_match.group(0)
            full_text = full_text.replace(prereq_full_match, '', 1)
        
        # Try to extract corequisites (can be at the end of the text)
        # First try: comprehensive pattern that captures until end or next keyword
        coreq_pattern = r'(?:Corequisite|Co-requisite|Corequisites):\s*(.+?)(?=\s*(?:Prerequisite|Prerequisites|Corequisite|Co-requisite|Corequisites):|$)'
        coreq_match = re.search(coreq_pattern, full_text, re.IGNORECASE | re.DOTALL)
        if coreq_match:
            corequisites = coreq_match.group(1).strip()
            # Remove trailing period if it's the last thing
            corequisites = re.sub(r'\.\s*$', '', corequisites).strip()
            # Remove the entire corequisite section from description
            coreq_full_match = coreq_match.group(0)
            full_text = full_text.replace(coreq_full_match, '', 1)
        else:
            # Fallback: check if there's a simple "Corequisite:" at the end
            # Pattern: "Corequisite:" followed by course code(s) until end of text
            # This handles cases like "Corequisite: APSC 173" at the end
            simple_coreq_pattern = r'(?:Corequisite|Co-requisite|Corequisites):\s*([A-Z]{2,4}\s+\d{3}[A-Z]?(?:\s+[A-Z]{2,4}\s+\d{3}[A-Z]?)*)\s*\.?\s*$'
            simple_coreq_match = re.search(simple_coreq_pattern, full_text, re.IGNORECASE | re.MULTILINE)
            if simple_coreq_match:
                corequisites = simple_coreq_match.group(1).strip()
                coreq_full_match = simple_coreq_match.group(0)
                full_text = full_text.replace(coreq_full_match, '', 1)
        
        # Clean the description
        description = self.clean_text(full_text)
        
        # Clean requirements
        prerequisites = self.clean_text(prerequisites)
        corequisites = self.clean_text(corequisites)
        
        return {
            'code': course_code,
            'description': description,
            'prerequisites': prerequisites,
            'corequisites': corequisites
        }
    
    def scrape_course_list(self) -> Dict[str, Dict]:
        """
        Scrape all APSC courses from the calendar page using chunking strategy.
        Returns a dictionary mapping course codes to course data.
        """
        print(f"Scraping APSC courses from: {self.course_list_url}")
        
        try:
            response = self.session.get(self.course_list_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the main content container
            # Try common content container selectors
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
            
            # Split into chunks using regex pattern
            # Strategy: Find all course headers, then extract text between them
            # Pattern to find all course headers: APSC_V followed by number
            header_pattern = r'APSC_V\s+\d{3}[A-Z]?'
            
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
                        print(f"  Parsed: {course_info['code']}")
                    elif self.force:
                        # If force mode, update with more complete data
                        existing = course_data.get(course_info['code'], {})
                        # Update if new data has more information
                        if (course_info.get('description') and len(course_info.get('description', '')) > len(existing.get('description', ''))) or \
                           (course_info.get('prerequisites') and not existing.get('prerequisites')):
                            course_data[course_info['code']] = course_info
                            print(f"  Updated: {course_info['code']}")
            
            print(f"\nScraped {len(course_data)} APSC courses")
            return course_data
            
        except Exception as e:
            print(f"Error scraping course list: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
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
        
        # Only process APSC courses
        if not code or not code.startswith('APSC'):
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
        
        # Update description
        if scraped.get('description'):
            course['description'] = scraped['description']
            updated = True
        
        # Update prerequisites
        if scraped.get('prerequisites'):
            course['prerequisites'] = scraped['prerequisites']
            updated = True
        
        # Update corequisites (combine with prerequisites if both exist)
        if scraped.get('corequisites'):
            if course.get('prerequisites'):
                # Combine prerequisites and corequisites
                course['prerequisites'] = f"{course['prerequisites']}\n\nCorequisites: {scraped['corequisites']}"
            else:
                course['prerequisites'] = f"Corequisites: {scraped['corequisites']}"
            updated = True
        
        return updated
    
    def process_curriculum_file(self, filename: str, scraped_data: Dict):
        """
        Process a curriculum JSON file and enrich APSC courses.
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
                    
                    # Check if this is an APSC course
                    code = course.get('code', '')
                    if code and code.startswith('APSC'):
                        processed_courses += 1
                        if self.update_course(course, scraped_data):
                            updated_courses += 1
        
        print(f"\nSummary for {filename}:")
        print(f"  Total courses: {total_courses}")
        print(f"  APSC courses: {processed_courses}")
        print(f"  Updated courses: {updated_courses}")
        
        # Save the updated file
        if updated_courses > 0:
            self.save_json_file(data, filename)
        else:
            print(f"  No updates needed, skipping save")
    
    def run(self):
        """Main execution method"""
        print("=" * 60)
        print("APSC Course Details Scraper")
        print("=" * 60)
        if self.force:
            print("Mode: FORCE (re-scraping all courses)")
        else:
            print("Mode: NORMAL (skip courses with existing details)")
        print(f"Curriculum directory: {self.curriculum_dir}")
        print("=" * 60)
        
        # Step A: Scrape course list and build dictionary
        print("\n[Step A] Scraping APSC courses from UBC Calendar...")
        scraped_data = self.scrape_course_list()
        
        if not scraped_data:
            print("Error: No course data scraped. Exiting.")
            return
        
        print(f"\nScraped {len(scraped_data)} APSC courses")
        print("\nSample courses:")
        for i, (code, data) in enumerate(list(scraped_data.items())[:5]):
            print(f"  {code}: {data.get('description', '')[:60]}...")
        
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
    
    scraper = APSCCourseDetailsScraper(force=force)
    scraper.run()

