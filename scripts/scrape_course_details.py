"""
UBC Course Details Scraper (Universal Subject Version)
Scrapes course descriptions, prerequisites, and corequisites from UBC Calendar
and enriches existing curriculum JSON files for any specified subject.

Usage:
    python scripts/scrape_course_details.py --subject mathv --code MATH [--force] [--curriculum-dir PATH]
    python scripts/scrape_course_details.py --subject physv --code PHYS --force
    python scripts/scrape_course_details.py --subject apscv --code APSC
    
Options:
    --subject         Subject code for URL (e.g., mathv, physv, apscv)
    --code            Course code prefix (e.g., MATH, PHYS, APSC)
    --force           Force re-scraping even if course already has details
    --curriculum-dir  Path to curriculum JSON files (default: src/data/curriculum/applied-science)
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import random
import os
import sys
import argparse
from typing import Dict, List, Optional

class UBCCourseDetailsScraper:
    def __init__(self, subject: str, code: str, force=False, curriculum_dir=None):
        """
        Initialize the scraper.
        
        Args:
            subject: Subject code for URL (e.g., "mathv", "physv", "apscv")
            code: Course code prefix (e.g., "MATH", "PHYS", "APSC")
            force: Force re-scraping even if course already has details
            curriculum_dir: Path to curriculum JSON files (default: src/data/curriculum/applied-science)
        """
        self.subject = subject.lower().strip()
        self.code = code.upper().strip()
        self.base_url = "https://vancouver.calendar.ubc.ca"
        # Build URL: subject can be with or without 'v' suffix
        if not self.subject.endswith('v'):
            self.course_list_url = f"{self.base_url}/course-descriptions/subject/{self.subject}v"
        else:
            self.course_list_url = f"{self.base_url}/course-descriptions/subject/{self.subject}"
        
        self.force = force
        self.session = requests.Session()
        
        # Enhanced headers to bypass security detection
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        # Path to curriculum JSON files
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if curriculum_dir:
            # Use provided path (can be absolute or relative)
            if os.path.isabs(curriculum_dir):
                self.curriculum_dir = curriculum_dir
            else:
                self.curriculum_dir = os.path.join(script_dir, curriculum_dir)
        else:
            # Default path
            self.curriculum_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'applied-science')
        
        self.course_data = {}
    
    def clean_course_code(self, code: str) -> str:
        """
        Clean course code: Convert SUBJECT_V to SUBJECT.
        Example: 'MATH_V 101' -> 'MATH 101'
        """
        # Remove _V suffix and normalize spacing
        code = re.sub(r'_V\s*', ' ', code.strip())
        code = re.sub(r'\s+', ' ', code)
        return code.strip()
    
    def clean_text(self, text: str) -> str:
        """Clean description text by removing credit vectors and extra noise."""
        if not text:
            return ""
        # Remove credit vector [x-x-x]
        text = re.sub(r'\[?\d+-\d+-\d+\]?', '', text)
        # Remove Credit/D/Fail boilerplate
        text = re.sub(r'This course is not eligible for Credit/D/Fail grading\.?', '', text, flags=re.IGNORECASE)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\s*\.\s*\.', '.', text)  # Fix double periods
        return text.strip()

    def parse_course_chunk(self, chunk_text: str) -> Optional[Dict]:
        """
        Parse a single course chunk using newline-based title separation.
        Critical: Titles like 'Integral Calculus' do not always end in a period;
        the script separates Title from Description by splitting at the first newline (\\n).
        """
        if not chunk_text or not chunk_text.strip():
            return None
        
        # Dynamic regex based on the current subject (handles SUBJECT_V or SUBJECT)
        # Pattern: SUBJECT_V 101 (3) or SUBJECT 101 (3) or just SUBJECT_V 101
        header_pattern = rf'{re.escape(self.code)}(?:_V)?\s+(\d{{3}}[A-Z]?)\s*(?:\((\d+)\))?'
        code_match = re.search(header_pattern, chunk_text, re.IGNORECASE)
        
        if not code_match:
            return None
        
        number = code_match.group(1)
        credits = code_match.group(2) if code_match.lastindex >= 2 and code_match.group(2) else None
        
        # Clean the course code (convert SUBJECT_V to SUBJECT)
        raw_course_code = f"{self.code}_V {number}" if '_V' in code_match.group(0) else f"{self.code} {number}"
        course_code = self.clean_course_code(raw_course_code)
        
        # Extract Title using newline method (CRITICAL)
        header_end = code_match.end()
        remaining_text = chunk_text[header_end:]
        
        # Split at the first newline to separate Title from the rest
        if '\n' in remaining_text:
            raw_title, body_text = remaining_text.split('\n', 1)
        else:
            # Fallback: if no newline, try to find title by period (less reliable)
            raw_title = remaining_text
            body_text = ""
            title_match = re.search(r'^[^.]*\.', remaining_text[:200], re.MULTILINE)
            if title_match:
                raw_title = remaining_text[:title_match.end()]
                body_text = remaining_text[title_match.end():]
        
        # Clean up the title (remove leading spaces or trailing periods)
        title = raw_title.strip()
        if title.endswith('.'): 
            title = title[:-1]
        title = title.strip()
        
        # Parse Body (Description, Prerequisites, Corequisites)
        full_text = body_text.strip()
        
        prerequisites = ""
        corequisites = ""
        
        # Extract Prerequisites (handles multi-line)
        prereq_pattern = r'(?:Prerequisite|Prerequisites):\s*(.+?)(?=\s*(?:Corequisite|Co-requisite|Corequisites|Equivalency|This course|Credit will|$))'
        prereq_match = re.search(prereq_pattern, full_text, re.IGNORECASE | re.DOTALL)
        if prereq_match:
            prerequisites = prereq_match.group(1).strip()
            full_text = full_text.replace(prereq_match.group(0), "", 1)
        
        # Extract Corequisites (handles multi-line)
        coreq_pattern = r'(?:Corequisite|Co-requisite|Corequisites):\s*(.+?)(?=\s*(?:Prerequisite|Prerequisites|Equivalency|This course|Credit will|$))'
        coreq_match = re.search(coreq_pattern, full_text, re.IGNORECASE | re.DOTALL)
        if coreq_match:
            corequisites = coreq_match.group(1).strip()
            full_text = full_text.replace(coreq_match.group(0), "", 1)
        
        # Extract Equivalency if present
        equiv_pattern = r'Equivalency:\s*(.+?)(?=\s*(?:Prerequisite|Prerequisites|Corequisite|Co-requisite|Corequisites|This course|Credit will|$))'
        equiv_match = re.search(equiv_pattern, full_text, re.IGNORECASE | re.DOTALL)
        equivalency = ""
        if equiv_match:
            equivalency = equiv_match.group(1).strip()
            full_text = full_text.replace(equiv_match.group(0), "", 1)
        
        # Clean up the Description
        description = self.clean_text(full_text)
        prerequisites = self.clean_text(prerequisites)
        corequisites = self.clean_text(corequisites)
        equivalency = self.clean_text(equivalency)
        
        # Combine equivalency with prerequisites if both exist
        if equivalency:
            if prerequisites:
                prerequisites = f"{prerequisites}\n\nEquivalency: {equivalency}"
            else:
                prerequisites = f"Equivalency: {equivalency}"
        
        return {
            'code': course_code,
            'title': title,
            'credits': int(credits) if credits else None,
            'description': description,
            'prerequisites': prerequisites,
            'corequisites': corequisites
        }

    def scrape_course_list(self) -> Dict[str, Dict]:
        """
        Scrapes the calendar and chunks the content by course header.
        Returns a dictionary mapping course codes to course data.
        """
        print(f"Scraping {self.code} courses from: {self.course_list_url}")
        
        try:
            # Add random delay to avoid detection
            delay = random.uniform(1, 3)
            print(f"  Waiting {delay:.1f}s before request...")
            time.sleep(delay)
            
            response = self.session.get(self.course_list_url, timeout=15)
            
            # Validation: Check if response contains blocking messages
            response_text = response.text.lower()
            blocking_phrases = [
                'your request has been blocked',
                'security system',
                'potentially automated',
                'access denied',
                'blocked by security',
                'security check'
            ]
            
            if any(phrase in response_text for phrase in blocking_phrases):
                print(f"  ⚠️  BLOCKED: Request was blocked by UBC security system")
                print(f"  ⚠️  Response contains security blocking message")
                return {}
            
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
            
            # Split text by occurrences of "SUBJECT_V 123" or "SUBJECT 123"
            header_pattern = rf'{re.escape(self.code)}(?:_V)?\s+\d{{3}}[A-Z]?'
            headers = [m.start() for m in re.finditer(header_pattern, full_text, re.IGNORECASE)]
            
            if not headers:
                print(f"  Warning: No {self.code} headers found at this URL.")
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
                        title_preview = course_info.get('title', 'No title')[:50]
                        print(f"  Parsed: {course_info['code']} - {title_preview}")
                    elif self.force:
                        # If force mode, update with more complete data
                        existing = course_data.get(course_info['code'], {})
                        # Update if new data has more information
                        if (course_info.get('description') and len(course_info.get('description', '')) > len(existing.get('description', ''))) or \
                           (course_info.get('prerequisites') and not existing.get('prerequisites')):
                            course_data[course_info['code']] = course_info
                            print(f"  Updated: {course_info['code']}")
            
            print(f"\nScraped {len(course_data)} {self.code} courses")
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
        
        # Only process courses matching the subject code
        if not code or not code.startswith(self.code):
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
        
        # Update corequisites (combine with prerequisites if both exist)
        if scraped.get('corequisites'):
            if course.get('prerequisites'):
                course['prerequisites'] = f"{course['prerequisites']}\n\nCorequisites: {scraped['corequisites']}"
            else:
                course['prerequisites'] = f"Corequisites: {scraped['corequisites']}"
            updated = True
        
        return updated
    
    def process_curriculum_file(self, filename: str, scraped_data: Dict):
        """
        Process a curriculum JSON file and enrich courses matching the subject code.
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
                    
                    # Check if this is a matching course
                    code = course.get('code', '')
                    if code and code.startswith(self.code):
                        processed_courses += 1
                        if self.update_course(course, scraped_data):
                            updated_courses += 1
        
        print(f"\nSummary for {filename}:")
        print(f"  Total courses: {total_courses}")
        print(f"  {self.code} courses: {processed_courses}")
        print(f"  Updated courses: {updated_courses}")
        
        # Save the updated file
        if updated_courses > 0:
            self.save_json_file(data, filename)
        else:
            print(f"  No updates needed, skipping save")
    
    def run(self):
        """Main execution method"""
        print("=" * 60)
        print(f"{self.code} Course Details Scraper")
        print("=" * 60)
        if self.force:
            print("Mode: FORCE (re-scraping all courses)")
        else:
            print("Mode: NORMAL (skip courses with existing details)")
        print(f"Subject URL: {self.subject}")
        print(f"Course Code: {self.code}")
        print(f"Curriculum directory: {self.curriculum_dir}")
        print("=" * 60)
        
        # Step A: Scrape course list and build dictionary
        print(f"\n[Step A] Scraping {self.code} courses from UBC Calendar...")
        scraped_data = self.scrape_course_list()
        
        if not scraped_data:
            print("Error: No course data scraped. Exiting.")
            return
        
        print(f"\nScraped {len(scraped_data)} {self.code} courses")
        print("\nSample courses:")
        for i, (code, data) in enumerate(list(scraped_data.items())[:5]):
            title = data.get('title', 'No title')
            desc = data.get('description', '')[:60]
            print(f"  {code}: {title} - {desc}...")
        
        # Step B: Update all JSON files
        print(f"\n[Step B] Updating curriculum JSON files...")
        
        if not os.path.exists(self.curriculum_dir):
            print(f"Error: Directory not found: {self.curriculum_dir}")
            return
        
        # Get all JSON files in the directory
        json_files = [f for f in os.listdir(self.curriculum_dir) if f.endswith('.json')]
        
        if not json_files:
            print("No JSON files found in curriculum directory")
            return
        
        for filename in sorted(json_files):
            self.process_curriculum_file(filename, scraped_data)
            time.sleep(0.5)  # Brief pause between files
        
        print(f"\n{'='*60}")
        print("Scraping Complete!")
        print(f"{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Scrape UBC course details for any subject',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/scrape_course_details.py --subject mathv --code MATH
  python scripts/scrape_course_details.py --subject physv --code PHYS --force
  python scripts/scrape_course_details.py --subject apscv --code APSC --curriculum-dir custom/path
        """
    )
    
    parser.add_argument(
        '--subject',
        type=str,
        required=True,
        help='Subject code for URL (e.g., mathv, physv, apscv)'
    )
    
    parser.add_argument(
        '--code',
        type=str,
        required=True,
        help='Course code prefix (e.g., MATH, PHYS, APSC)'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force re-scraping even if course already has details'
    )
    
    parser.add_argument(
        '--curriculum-dir',
        type=str,
        default=None,
        help='Path to curriculum JSON files (default: src/data/curriculum/applied-science)'
    )
    
    args = parser.parse_args()
    
    scraper = UBCCourseDetailsScraper(
        subject=args.subject,
        code=args.code,
        force=args.force,
        curriculum_dir=args.curriculum_dir
    )
    scraper.run()
