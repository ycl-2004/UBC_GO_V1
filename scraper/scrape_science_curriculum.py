"""
UBC Science Curriculum Scraper
Scrapes curriculum data for all UBC Science majors from the UBC Academic Calendar.

Usage:
    python scraper/scrape_science_curriculum.py
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

class UBCScienceCurriculumScraper:
    def __init__(self):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.directory_url = f"{self.base_url}/faculties-colleges-and-schools/faculty-science/bachelor-science"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Output directory
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.output_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'science')
        os.makedirs(self.output_dir, exist_ok=True)
        
        # List of all Science majors
        self.all_majors = [
            "Astronomy", "Atmospheric Science", "Behavioural Neuroscience",
            "Biochemistry", "Biology", "Biotechnology", "Botany",
            "Cellular and Physiological Sciences", "Chemistry", "Cognitive Systems",
            "Combined Major in Science", "Computer Science", "Data Science",
            "Earth and Ocean Sciences", "Environmental Sciences", "Forensic Science",
            "General Science", "Geographical Sciences", "Geological Sciences",
            "Geophysics", "Integrated Sciences", "Mathematics",
            "Microbiology and Immunology", "Neuroscience", "Oceanography",
            "Pharmacology", "Physics", "Statistics", "Zoology"
        ]
    
    def clean_course_code(self, code: str) -> str:
        """Clean course code: Remove _V suffix and normalize spacing"""
        code = re.sub(r'_V\s*', ' ', code.strip())
        code = re.sub(r'\s+', ' ', code)
        return code.strip()
    
    def extract_credits(self, text: str) -> int:
        """Extract credit value from text"""
        if text.strip().isdigit():
            return int(text.strip())
        match = re.search(r'\(?(\d+)\s*(?:credits?|cr\.?)?\)?', text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 3  # Default to 3 credits
    
    def find_major_links(self) -> List[Tuple[str, str]]:
        """
        Crawl the directory page to find all major links.
        Returns list of (major_name, url_slug) tuples.
        """
        print(f"\n{'='*70}")
        print("Step 1: Crawling Science directory page...")
        print(f"URL: {self.directory_url}")
        print(f"{'='*70}")
        
        try:
            response = self.session.get(self.directory_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            major_links = []
            
            # Find all links that point to major pages
            # Look for links in the content area that match major patterns
            content_area = soup.find('main') or soup.find('article') or soup.find('body')
            
            if content_area:
                # Find all links
                links = content_area.find_all('a', href=True)
                
                for link in links:
                    href = link.get('href', '')
                    text = link.get_text(strip=True)
                    
                    # Check if this looks like a major link
                    # Major pages are typically like /faculty-science/bachelor-science/computer-science
                    if '/faculty-science/bachelor-science/' in href:
                        # Extract the slug (last part of URL)
                        slug = href.split('/')[-1]
                        
                        # Try to match with our known majors
                        # Normalize text for comparison
                        normalized_text = text.strip()
                        
                        # Check if text matches any of our known majors (case-insensitive, partial match)
                        for major in self.all_majors:
                            if major.lower() in normalized_text.lower() or normalized_text.lower() in major.lower():
                                # Use the major name from our list for consistency
                                major_links.append((major, slug))
                                print(f"  Found: {major} -> {slug}")
                                break
                
                # Remove duplicates while preserving order
                seen = set()
                unique_links = []
                for major, slug in major_links:
                    if (major, slug) not in seen:
                        seen.add((major, slug))
                        unique_links.append((major, slug))
                
                print(f"\n  Total majors found: {len(unique_links)}")
                return unique_links
            else:
                print("  Warning: Could not find content area")
                return []
                
        except Exception as e:
            print(f"  Error crawling directory: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def extract_footnotes(self, soup: BeautifulSoup, table_element) -> Dict[str, str]:
        """
        Extract footnotes from the page, typically found after tables.
        Returns a dictionary mapping footnote symbols to their text.
        """
        footnotes = {}
        
        # Look for footnote text after the table
        # Footnotes are often in <p> tags or <div> tags with specific classes
        current = table_element
        for _ in range(10):  # Check up to 10 siblings
            current = current.find_next_sibling()
            if current is None:
                break
            
            # Look for text containing footnote symbols
            text = current.get_text()
            
            # Match patterns like "¹ Text", "² Text", etc.
            footnote_pattern = r'([¹²³⁴⁵⁶⁷⁸⁹⁰])\s+(.+)'
            matches = re.findall(footnote_pattern, text)
            
            for symbol, note_text in matches:
                footnotes[symbol] = note_text.strip()
            
            # Also check for numbered footnotes like "1. Text", "2. Text"
            numbered_pattern = r'(\d+)\.\s+(.+)'
            numbered_matches = re.findall(numbered_pattern, text)
            
            for num, note_text in numbered_matches:
                # Map numbers to superscript symbols
                symbol_map = {'1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵'}
                if num in symbol_map:
                    footnotes[symbol_map[num]] = note_text.strip()
        
        return footnotes
    
    def extract_communication_requirement_courses(self, soup: BeautifulSoup) -> str:
        """
        Extract the list of acceptable Communication Requirement courses from the page.
        Common courses: SCIE 113, ENGL 110, ENGL 111, ENGL 112, ENGL 120, ENGL 121
        """
        # Look for text mentioning communication requirement
        page_text = soup.get_text()
        
        # Common communication requirement courses
        common_courses = [
            "SCIE 113", "ENGL 110", "ENGL 111", "ENGL 112", 
            "ENGL 120", "ENGL 121", "WRDS 150"
        ]
        
        # Try to find a section that lists communication requirements
        # Look for patterns like "One of: SCIE 113, ENGL 110, ..."
        comm_pattern = r'(?:communication|writing|english|scie).*?(?:one of|choose|select).*?((?:[A-Z]{2,4}\s+\d{3}[A-Z]?(?:\s*,\s*)?)+)'
        match = re.search(comm_pattern, page_text, re.IGNORECASE)
        
        if match:
            courses_text = match.group(1)
            # Extract course codes
            course_codes = re.findall(r'([A-Z]{2,4}\s+\d{3}[A-Z]?)', courses_text)
            if course_codes:
                return ', '.join(course_codes)
        
        # Fallback to common courses
        return ', '.join(common_courses)
    
    def clean_text_and_extract_notes(self, raw_text: str, footnotes_dict: Dict[str, str]) -> Tuple[str, str]:
        """
        Separates the course text from superscript footnotes.
        Example: 'BIOL_V 112¹' -> Code: 'BIOL 112', Note: 'Students without...'
        Also handles trailing digits: 'MATH 2007' -> 'MATH 200'
        """
        # 1. Identify superscripts
        superscripts = "".join(re.findall(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', raw_text))
        
        # 2. Strip superscripts and _V from the display text
        clean_text = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', '', raw_text)
        clean_text = self.clean_course_code(clean_text)
        
        # 3. Fix trailing digits in course codes (e.g., "MATH 2007" -> "MATH 200")
        # Pattern: Course code followed by digits that are too long (4+ digits after space)
        # This handles cases where superscripts were incorrectly parsed as digits
        course_code_pattern = r'^([A-Z]{2,4})\s+(\d{3})(\d+)(?:\s|$)'
        match = re.match(course_code_pattern, clean_text)
        if match:
            dept = match.group(1)
            course_num = match.group(2)  # Take only first 3 digits
            clean_text = f"{dept} {course_num}"
        
        # 4. Map superscripts to actual footnote text
        found_notes = []
        for char in superscripts:
            if char in footnotes_dict:
                found_notes.append(footnotes_dict[char])
                
        return clean_text, " ".join(found_notes)
    
    def parse_table_for_courses(self, table, footnotes: Dict[str, str] = None, 
                                comm_requirement_courses: str = "") -> Dict[str, List[Dict]]:
        """
        Parse a table element using sticky headers and an early-exit stopping condition.
        Handles superscript footnotes correctly and extracts footnotes from within the table.
        """
        if footnotes is None:
            footnotes = {}
        
        years_data = {
            "1": [],
            "2": [],
            "3": [],
            "4": []
        }
        current_year_key = None
        
        # --- Step 1: Pre-parse footnotes inside the table ---
        # These are usually rows with colspan or rows that start with a superscript
        internal_footnotes = {}
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) == 1 or (len(cells) > 0 and cells[0].get('colspan') == "2"):
                text = cells[0].get_text(strip=True)
                # Match superscript at start: e.g., "¹ Students without..."
                match = re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰])\s*(.*)', text)
                if match:
                    symbol, note_content = match.groups()
                    internal_footnotes[symbol] = note_content
        
        # Merge external footnotes with internal ones (internal takes precedence)
        all_footnotes = {**footnotes, **internal_footnotes}

        # --- Step 2: Parse Course Rows ---
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if not cells:
                continue
            
            first_cell_text = cells[0].get_text(strip=True)
            first_cell_lower = first_cell_text.lower()

            # Check for Year Headers (look for <strong> tag or year text)
            strong_tag = row.find('strong')
            if strong_tag:
                header_text = strong_tag.get_text(strip=True).lower()
            else:
                header_text = first_cell_lower
            
            if "year" in header_text or "year" in first_cell_lower:
                if "first" in header_text or "first" in first_cell_lower:
                    current_year_key = "1"
                elif "second" in header_text or "second" in first_cell_lower:
                    current_year_key = "2"
                elif "third" in header_text or "third" in first_cell_lower:
                    if "fourth" in header_text or "fourth" in first_cell_lower or "four" in header_text or "four" in first_cell_lower:
                        current_year_key = "3"
                    else:
                        current_year_key = "3"
                elif "fourth" in header_text or "fourth" in first_cell_lower or "four" in header_text or "four" in first_cell_lower:
                    current_year_key = "4"
                continue

            # Early exit if we hit the end
            if "total credits for degree" in first_cell_lower or "credits for degree" in first_cell_lower:
                break
                
            # Skip total rows and the footnote rows we already parsed
            if "total credits" in first_cell_lower or re.match(r'^[¹²³⁴⁵⁶⁷⁸⁹⁰]', first_cell_text):
                continue

            if current_year_key and len(cells) >= 2:
                # Extract Credits from the second column
                credit_text = cells[1].get_text(strip=True)
                credits = self.extract_credits(credit_text) if credit_text else 0
                
                # Clean course code and attach notes
                clean_code, note = self.clean_text_and_extract_notes(first_cell_text, all_footnotes)
                
                # Skip empty rows (0 credits and empty/whitespace code)
                if credits == 0 and (not clean_code or not clean_code.strip()):
                    continue
                
                # Special case for Communication Requirement
                if "communication requirement" in first_cell_lower or "additional communication requirement" in first_cell_lower:
                    note = comm_requirement_courses
                    clean_code = "Communication Requirement"
                elif "elective" in first_cell_lower:
                    clean_code = "Electives"
                    # Also check for "Arts" or other requirements in the text
                    if 'arts' in first_cell_lower or 'faculty of arts' in first_cell_lower:
                        if note:
                            note += ". " + "At least some credits must be from the Faculty of Arts"
                        else:
                            note = "At least some credits must be from the Faculty of Arts"
                
                years_data[current_year_key].append({
                    "code": clean_code,
                    "credits": credits,
                    "title": "",
                    "notes": note
                })

        return years_data
    
    def normalize_curriculum_years(self, all_data: Dict) -> Dict:
        """
        Normalize curriculum years by filling missing years based on adjacent years.
        Handles cases where majors combine years (e.g., "Third and Fourth Years").
        """
        for major, years in all_data.items():
            y1 = years.get("1", [])
            y2 = years.get("2", [])
            y3 = years.get("3", [])
            y4 = years.get("4", [])
            
            # Case 1: 1, 2, and 4 exist -> Copy Year 4 to Year 3
            # (This happens when "Third and Fourth Years" was saved as Year 4)
            if y1 and y2 and y4 and not y3:
                years["3"] = y4.copy()
                print(f"  [{major}] Duplicated Year 4 into Year 3")

            # Case 2: 1, 2, and 3 exist -> Copy Year 3 to Year 4
            # (This happens when "Third and Fourth Years" was saved as Year 3)
            elif y1 and y2 and y3 and not y4:
                years["4"] = y3.copy()
                print(f"  [{major}] Duplicated Year 3 into Year 4")

            # Case 3: 1, 3, and 4 exist -> Copy Year 3 to Year 2
            # (Edge case: missing Year 2)
            elif y1 and y3 and y4 and not y2:
                years["2"] = y3.copy()
                print(f"  [{major}] Duplicated Year 3 into Year 2")
            
        return all_data
    
    def scrape_major_curriculum(self, major_name: str, url_slug: str) -> Optional[Dict]:
        """
        Scrape curriculum for a specific Science major.
        Returns a dictionary with years 1-4 as keys, each containing a list of courses.
        """
        url = f"{self.base_url}/faculties-colleges-and-schools/faculty-science/bachelor-science/{url_slug}"
        
        print(f"\n  Scraping {major_name}...")
        print(f"    URL: {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract communication requirement courses
            comm_requirement_courses = self.extract_communication_requirement_courses(soup)
            
            # Find all tables in "Degree Requirements" section
            # Look for tables wrapped in figure.responsive-figure-table
            tables = soup.find_all('figure', class_='responsive-figure-table')
            if not tables:
                # Fallback: look for any table
                tables = soup.find_all('table')
            
            print(f"    Found {len(tables)} table(s)")
            
            years_data = {
                "1": [],
                "2": [],
                "3": [],
                "4": []
            }
            
            for table in tables:
                # 1. Check if this table is actually a requirement table
                # Requirement tables almost always contain "Year" or "Credits"
                table_text = table.get_text().lower()
                if "year" not in table_text and "credits" not in table_text:
                    continue

                # Extract footnotes for this table
                footnotes = self.extract_footnotes(soup, table)
                
                # Parse the table - now returns a dict with all years
                table_years_data = self.parse_table_for_courses(
                    table, 
                    footnotes=footnotes,
                    comm_requirement_courses=comm_requirement_courses
                )
                
                # 2. Merge data (allow duplicates for "Electives" as they can appear in multiple years)
                has_data = False
                for year_key in ["1", "2", "3", "4"]:
                    if year_key in table_years_data and table_years_data[year_key]:
                        # For non-Electives, check for duplicates
                        existing_codes = {c["code"] for c in years_data[year_key] if c["code"] != "Electives"}
                        for course in table_years_data[year_key]:
                            # Always allow Electives, or if it's a new course code
                            if course["code"] == "Electives" or course["code"] not in existing_codes:
                                years_data[year_key].append(course)
                                if course["code"] != "Electives":
                                    existing_codes.add(course["code"])
                        has_data = True

                # 3. CRITICAL FIX: If this table contained the "Total Credits for Degree" row,
                # it is the primary major table. Stop scraping further tables.
                if "total credits for degree" in table_text or "total credits" in table_text:
                    if has_data:
                        print(f"    Primary requirement table found for {major_name}. Stopping.")
                        break  # Exit the 'for table in tables' loop
            
            # Report results
            total_courses = sum(len(courses) for courses in years_data.values())
            print(f"    Extracted {total_courses} courses:")
            for year in ["1", "2", "3", "4"]:
                count = len(years_data[year])
                if count > 0:
                    print(f"      Year {year}: {count} courses")
            
            return years_data
            
        except Exception as e:
            print(f"    Error scraping {major_name}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def run(self):
        """Main execution method"""
        print("=" * 70)
        print("UBC Science Curriculum Scraper")
        print("=" * 70)
        
        # Step 1: Find all major links
        major_links = self.find_major_links()
        
        if not major_links:
            print("\n  Warning: No major links found. Using fallback method...")
            # Fallback: try to construct URLs from known major names
            major_links = []
            for major in self.all_majors:
                # Convert major name to URL slug
                slug = major.lower().replace(' ', '-').replace('&', 'and')
                major_links.append((major, slug))
        
        print(f"\n  Will scrape {len(major_links)} majors")
        
        # Step 2: Scrape each major
        print(f"\n{'='*70}")
        print("Step 2: Scraping individual major pages...")
        print(f"{'='*70}")
        
        all_curriculum = {}
        successful = 0
        failed = 0
        
        for i, (major_name, url_slug) in enumerate(major_links, 1):
            print(f"\n[{i}/{len(major_links)}] Processing {major_name}...")
            
            curriculum = self.scrape_major_curriculum(major_name, url_slug)
            
            if curriculum:
                all_curriculum[major_name] = curriculum
                successful += 1
            else:
                failed += 1
                print(f"    Failed to scrape {major_name}")
            
            # Rate limiting
            if i < len(major_links):
                time.sleep(2)  # 2 second delay between requests
        
        # Step 3: Normalize curriculum years (fill missing years)
        print(f"\n{'='*70}")
        print("Step 3: Normalizing curriculum years...")
        print(f"{'='*70}")
        all_curriculum = self.normalize_curriculum_years(all_curriculum)
        
        # Step 4: Save results
        print(f"\n{'='*70}")
        print("Step 4: Saving results...")
        print(f"{'='*70}")
        
        output_file = os.path.join(self.output_dir, 'science_curriculum.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_curriculum, f, indent=2, ensure_ascii=False)
        
        print(f"\n  Saved: {output_file}")
        print(f"  Total majors scraped: {successful}")
        print(f"  Failed: {failed}")
        print(f"  Total courses: {sum(len(courses) for major_data in all_curriculum.values() for courses in major_data.values())}")
        
        print("\n" + "=" * 70)
        print("Scraping Complete!")
        print("=" * 70)


if __name__ == "__main__":
    scraper = UBCScienceCurriculumScraper()
    scraper.run()

