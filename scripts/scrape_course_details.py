#!/usr/bin/env python3
"""
UBC Course Details Scraper (Universal Subject Version)
Scrapes course descriptions, prerequisites, and corequisites from UBC Calendar
and enriches existing curriculum JSON files for any specified subject.

Uses the exact same robust parsing logic as scrape_single_course.py, adapted for multiple courses.

Usage:
    source venv/bin/activate
    python scripts/scrape_course_details.py --subject mathv --code MATH [--force] [--curriculum-dir PATH]
    python scripts/scrape_course_details.py --subject physv --code PHYS --force
    python scripts/scrape_course_details.py --subject apscv --code APSC
    
Options:
    --subject         Subject code for URL (e.g., mathv, physv, apscv)
    --code            Course code prefix (e.g., MATH, PHYS, APSC)
    --force           Force re-scraping even if course already has details
    --curriculum-dir  Path to curriculum JSON files (default: src/data/curriculum/applied-science)
"""

import argparse
import json
import os
import random
import re
import time
from typing import Dict, List, Optional, Union

import requests
from bs4 import BeautifulSoup


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
    
    # ----------------------------
    # Helpers (exact copy from scrape_single_course.py)
    # ----------------------------
    def clean_course_code(self, code: str) -> str:
        """Convert SUBJECT_V to SUBJECT and normalize whitespace."""
        code = re.sub(r"_V\s*", " ", code.strip())
        code = re.sub(r"\s+", " ", code)
        return code.strip()

    def _random_delay(self):
        time.sleep(random.uniform(0.8, 2.2))

    def _blocked(self, html_text: str) -> bool:
        t = html_text.lower()
        blocking_phrases = [
            "your request has been blocked",
            "security system",
            "potentially automated",
            "access denied",
            "blocked by security",
            "security check",
        ]
        return any(p in t for p in blocking_phrases)

    def clean_text(self, text: str) -> str:
        """Clean description/prereq/coreq text without killing URLs."""
        if not text:
            return ""

        # Remove common scraped artifacts (navigation text, etc.)
        text = re.sub(r'\nCourse Descriptions.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
        text = re.sub(r'\nIntroduction.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
        text = re.sub(r'\nCourses by Subject.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
        text = re.sub(r'\nCourses by Faculty.*$', '', text, flags=re.IGNORECASE | re.MULTILINE)

        # Remove credit vectors like [3-0-0], [3-0-1*], [3-0-1.5; 3-0-1.5], etc.
        text = re.sub(
            r"\[\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*\*?"
            r"(?:\s*;\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*\*?)*\s*\]",
            "",
            text,
        )

        # Remove Credit/D/Fail boilerplate (optional)
        text = re.sub(r"This course is not eligible for Credit/D/Fail grading\.?", "", text, flags=re.IGNORECASE)

        # Normalize whitespace
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"\s+\n", "\n", text)
        text = re.sub(r"\n\s+", "\n", text)

        # Normalize period spacing
        text = re.sub(r"\s*\.\s*\.", ".", text)
        return text.strip()

    # ----------------------------
    # Parsing a single course chunk (adapted from scrape_single_course.py)
    # ----------------------------
    def parse_course_chunk(self, chunk_text: str) -> Optional[Dict]:
        """
        Parse a course block (header + title + description + prereq/coreq).
        Designed to work with subject-page or course-page extracted blocks.
        Adapted from scrape_single_course.py for multiple courses.
        KEY DIFFERENCE: Does not filter by specific course number - accepts any course in the chunk.
        """
        if not chunk_text or not chunk_text.strip():
            return None

        # Reject chunks that are obviously just a list of codes
        chunk_stripped = chunk_text.strip()
        if re.match(
            r"^[A-Z]{2,6}_?V?\s+\d{3}[A-Z]?[,\s\n]+[A-Z]{2,6}_?V?\s+\d{3}[A-Z]?[,\s\n]*$",
            chunk_stripped[:250],
            re.IGNORECASE | re.MULTILINE,
        ):
            return None

        # Header pattern for THIS prefix + any _V + number + optional credits (3) or (2-6)
        # Example: MATH_V 255 (3) Ordinary Differential Equations
        # KEY: Use generic pattern (\d{3}[A-Z]?) to capture any course number
        header_pattern = rf"{re.escape(self.code)}(?:_V)?\s+(\d{{3}}[A-Z]?)\s*(?:\(([\d-]+)\))?"
        code_match = re.search(header_pattern, chunk_text, re.IGNORECASE)
        if not code_match:
            return None

        number = code_match.group(1)
        credits_raw = code_match.group(2) if code_match.lastindex >= 2 and code_match.group(2) else None

        raw_course_code = code_match.group(0)
        course_code = self.clean_course_code(raw_course_code)

        # NOTE: In scrape_single_course.py, we check if number matches self.course_number here
        # For the general scraper, we accept any course number found

        # Title + body extraction
        header_end = code_match.end()
        remaining = chunk_text[header_end:].lstrip()

        # If remaining starts with a credit vector or stray punctuation, skip it
        remaining = re.sub(r"^\s*\.?\s*", "", remaining)

        # Title is usually on the same line until newline
        title = ""
        body = remaining

        # Try same-line title
        # stop at newline; also allow a long title, but avoid swallowing whole sentences
        m = re.match(r"^([^\n]{2,120})\n(.*)$", remaining, flags=re.DOTALL)
        if m:
            candidate = m.group(1).strip()
            # Heuristic: title should not start with prerequisite/corequisite/equivalency
            if not re.match(r"^(Prerequisite|Prerequisites|Corequisite|Corequisites|Co-requisite|Equivalency)\b", candidate, re.IGNORECASE):
                title = candidate
                body = m.group(2).strip()

        # Fallback: if no newline, take first ~100 chars up to "Prerequisite:" if present
        if not title:
            m2 = re.search(r"^(.*?)(?:\s+(?:Prerequisite|Prerequisites|Corequisite|Corequisites|Co-requisite|Equivalency):\s)", remaining, re.IGNORECASE | re.DOTALL)
            if m2:
                candidate = m2.group(1).strip()
                if 2 < len(candidate) <= 120:
                    title = candidate
                    body = remaining[m2.end(1):].strip()

        # Clean title: remove embedded course code and credit vectors
        # Use the captured number from the regex match
        code_pattern = rf"{re.escape(self.code)}(?:_V)?\s+{re.escape(number)}"
        title = re.sub(code_pattern, "", title, flags=re.IGNORECASE).strip()
        title = re.sub(r"\[\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*\*?\s*\]", "", title).strip()
        title = re.sub(r"\s+", " ", title).strip().rstrip(".").strip()

        # Extract prereq/coreq/equiv from body (exact same patterns as scrape_single_course.py)
        full_text = body.strip()
        prereq = ""
        coreq = ""
        equiv = ""

        prereq_pattern = r"(?:Prerequisite|Prerequisites):\s*(.+?)(?=\s*(?:Corequisite|Co-requisite|Corequisites|Equivalency|This course|Credit will|Consult|$))"
        coreq_pattern = r"(?:Corequisite|Co-requisite|Corequisites):\s*(.+?)(?=\s*(?:Prerequisite|Prerequisites|Equivalency|This course|Credit will|Consult|$))"
        equiv_pattern = r"Equivalency:\s*(.+?)(?=\s*(?:Prerequisite|Prerequisites|Corequisite|Co-requisite|Corequisites|This course|Credit will|Consult|$))"

        pm = re.search(prereq_pattern, full_text, flags=re.IGNORECASE | re.DOTALL)
        if pm:
            prereq = pm.group(1).strip()
            full_text = full_text.replace(pm.group(0), "", 1)

        cm = re.search(coreq_pattern, full_text, flags=re.IGNORECASE | re.DOTALL)
        if cm:
            coreq = cm.group(1).strip()
            full_text = full_text.replace(cm.group(0), "", 1)

        em = re.search(equiv_pattern, full_text, flags=re.IGNORECASE | re.DOTALL)
        if em:
            equiv = em.group(1).strip()
            full_text = full_text.replace(em.group(0), "", 1)

        description = self.clean_text(full_text)
        prereq = self.clean_text(prereq)
        coreq = self.clean_text(coreq)
        equiv = self.clean_text(equiv)

        if equiv:
            prereq = f"{prereq}\n\nEquivalency: {equiv}" if prereq else f"Equivalency: {equiv}"

        # Parse credits into int or keep range string
        credits: Union[int, str, None] = None
        if credits_raw:
            credits_raw = credits_raw.strip()
            credits = int(credits_raw) if credits_raw.isdigit() else credits_raw  # e.g. "2-6"

        return {
            "code": course_code,         # "MATH 255"
            "title": title,              # "Ordinary Differential Equations"
            "credits": credits,          # 3 or "2-6"
            "description": description,
            "prerequisites": prereq,
            "corequisites": coreq,
        }

    # ----------------------------
    # Scrape course list (refactored to use re.finditer and robust parser)
    # ----------------------------
    def scrape_course_list(self) -> Dict[str, Dict]:
        """
        Scrapes the calendar and chunks the content by course header.
        Returns a dictionary mapping course codes to course data.
        Uses re.finditer to find all course headers and split into chunks.
        """
        print(f"Scraping {self.code} courses from: {self.course_list_url}")
        
        try:
            # Add random delay to avoid detection
            delay = random.uniform(1, 3)
            print(f"  Waiting {delay:.1f}s before request...")
            time.sleep(delay)
            
            response = self.session.get(self.course_list_url, timeout=15)
            
            # Validation: Check if response contains blocking messages
            if self._blocked(response.text):
                print(f"  ⚠️  BLOCKED: Request was blocked by UBC security system")
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
            
            # Use re.finditer to find all course headers
            # Pattern: SUBJECT(_V)? 123(A)? (credits)?
            header_pattern = rf'{re.escape(self.code)}(?:_V)?\s+(\d{{3}}[A-Z]?)\s*(?:\(([\d-]+)\))?'
            all_matches = list(re.finditer(header_pattern, full_text, re.IGNORECASE))
            
            if not all_matches:
                print(f"  Warning: No {self.code} headers found at this URL.")
                return {}
            
            print(f"  Found {len(all_matches)} potential course headers")
            
            # Filter out matches that are part of equivalency statements or prerequisites
            # (e.g., "MECH_V 486 or NAME_V 581" or "MECH_V 360 and fourth-year standing")
            valid_headers = []
            for m in all_matches:
                # Look ahead to see if this is part of an equivalency or prerequisite
                lookahead = full_text[m.end():m.end()+80].lower()
                lookbehind = full_text[max(0, m.start()-80):m.start()].lower()
                
                # Skip if followed by "or" + course code pattern (equivalency)
                is_equivalency_or = re.search(r'\s+or\s+[A-Z]{2,4}_?V?\s+\d', lookahead)
                # Skip if followed by comma + course code pattern
                is_equivalency_comma = re.search(r',\s*[A-Z]{2,4}_?V?\s+\d', lookahead)
                # Skip if followed by "and" + text that looks like a requirement (not a course code)
                is_prerequisite_and = re.search(r'\s+and\s+(?:fourth-year|third-year|second-year|all of|one of|either)', lookahead)
                # Skip if it's in an equivalency context
                is_equivalency_context = 'equivalency' in lookbehind or 'equivalency' in lookahead
                # Skip if preceded by "Prerequisite:" or "Corequisite:" (it's in a requirement list)
                is_in_requirement = re.search(r'(?:prerequisite|corequisite):', lookbehind)
                
                is_equivalency = (is_equivalency_or or is_equivalency_comma or is_prerequisite_and or 
                                 is_equivalency_context or is_in_requirement)
                
                if not is_equivalency:
                    valid_headers.append(m)
            
            if not valid_headers:
                print(f"  Warning: No valid {self.code} headers found after filtering.")
                return {}
            
            print(f"  Found {len(valid_headers)} valid course headers after filtering")
            
            # Extract chunks between headers (from Header A to Header B)
            chunks = []
            for i in range(len(valid_headers)):
                start = valid_headers[i].start()
                end = valid_headers[i + 1].start() if i + 1 < len(valid_headers) else len(full_text)
                chunk = full_text[start:end].strip()
                if chunk:
                    chunks.append(chunk)
            
            print(f"  Extracted {len(chunks)} course chunks")
            
            course_data = {}
            
            # Process each chunk using the robust parse_course_chunk method
            for chunk in chunks:
                chunk = chunk.strip()
                if not chunk:
                    continue
                
                course_info = self.parse_course_chunk(chunk)
                if course_info and course_info.get('code'):
                    code = course_info['code']
                    # Avoid duplicates - prefer entries with better titles
                    if code not in course_data:
                        course_data[code] = course_info
                        title_preview = course_info.get('title', 'No title')[:50]
                        print(f"  Parsed: {code} - {title_preview}")
                    elif self.force:
                        # In force mode, update if new data is better
                        existing = course_data.get(code, {})
                        existing_title = (existing.get('title') or '').strip()
                        new_title = (course_info.get('title') or '').strip()
                        
                        # Prefer entry with a proper title
                        has_better_title = (new_title and not existing_title) or \
                                          (new_title and existing_title and len(new_title) > len(existing_title))
                        
                        # Update if new data has better title or more complete description/prerequisites
                        should_update = False
                        if has_better_title:
                            should_update = True
                        elif (course_info.get('description') and len(course_info.get('description', '')) > len(existing.get('description', ''))) or \
                             (course_info.get('prerequisites') and not existing.get('prerequisites')):
                            should_update = True
                        
                        if should_update:
                            course_data[code] = course_info
                            print(f"  Updated: {code}")
            
            print(f"\nScraped {len(course_data)} {self.code} courses")
            return course_data
            
        except Exception as e:
            print(f"Error scraping course list: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    # ----------------------------
    # JSON file operations
    # ----------------------------
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
        
        # Update title (prefer scraped title if it exists and is better)
        if scraped.get('title') and scraped['title'].strip():
            scraped_title = scraped['title'].strip()
            current_title = (course.get('title') or '').strip()
            # In force mode, always update if scraped title is different and valid
            # Otherwise, only update if current title is missing/empty or scraped is better
            should_update_title = False
            if self.force:
                # In force mode, update if scraped title is different and not just the course code
                should_update_title = (scraped_title != current_title and scraped_title != code and len(scraped_title) > 0)
            else:
                # In normal mode, only update if current title is missing/empty or scraped is better
                should_update_title = (not current_title or (scraped_title != current_title and scraped_title != code))
            
            if should_update_title:
                course['title'] = scraped_title
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
        print(f"Subject URL: {self.course_list_url}")
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
