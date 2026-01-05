"""
UBC Science Single Major Curriculum Scraper
Scrapes curriculum data for a single UBC Science major from the UBC Academic Calendar.

Usage:
    source venv/bin/activate
    python scraper/curriculum/scrape_single_science_major.py biology
    python scraper/curriculum/scrape_single_science_major.py "Computer Science"
    python scraper/curriculum/scrape_single_science_major.py chemistry
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import sys
import os
from typing import Dict, List, Optional, Tuple

class UBCSingleScienceMajorScraper:
    def __init__(self, major_name: str):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.major_name = major_name.strip()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Convert major name to URL slug
        self.url_slug = self.major_name.lower().replace(' ', '-').replace('&', 'and')
        self.major_url = f"{self.base_url}/faculties-colleges-and-schools/faculty-science/bachelor-science/{self.url_slug}"
        
        # Output directory - write to the main science_curriculum.json file that the frontend uses
        script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.output_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'science')
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Also keep track of the main science_curriculum.json path for merging
        self.main_curriculum_file = os.path.join(self.output_dir, 'science_curriculum.json')
    
    def extract_sup_ids_and_remove(self, cell) -> List[str]:
        """Extract numeric footnote ids from <sup> (supports '8,9' and '10'), then remove <sup> tags."""
        ids = []
        for sup in cell.find_all("sup"):
            txt = sup.get_text(" ", strip=True)
            ids += re.findall(r"\d+", txt)  # grabs 8,9,10,11,12...
            sup.decompose()
        return ids

    def is_table_footnote_row(self, tds) -> bool:
        """
        Footnote rows in UBC tables are often:
        - colspan=2 with <sup>n</sup> at start, OR
        - 2 columns where second column is blank/&nbsp; and first starts with <sup>.
        """
        if not tds:
            return False

        first = tds[0]
        if first.get("colspan") == "2" and first.find("sup"):
            return True

        if len(tds) >= 2:
            second_text = tds[1].get_text(" ", strip=True).replace("\xa0", "").strip()
            if (second_text == "") and first.find("sup"):
                # common pattern: <td><sup>2</sup> ...</td><td>&nbsp;</td>
                return True

        return False
    
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
    
    def extract_footnotes(self, soup: BeautifulSoup, table_element) -> Dict[str, str]:
        """
        Extract footnotes from the page, typically found after tables.
        Returns a dictionary mapping footnote IDs (numeric strings) to their text.
        """
        footnotes = {}
        
        # Look for footnote text after the table
        current = table_element
        for _ in range(10):  # Check up to 10 siblings
            current = current.find_next_sibling()
            if current is None:
                break
            
            # Look for text containing footnote symbols
            text = current.get_text()
            
            # Match patterns like "¹ Text", "² Text", etc. (Unicode superscripts)
            # Map them to numeric IDs
            unicode_to_num = {'¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
                            '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0'}
            footnote_pattern = r'([¹²³⁴⁵⁶⁷⁸⁹⁰])\s+(.+)'
            matches = re.findall(footnote_pattern, text)
            
            for symbol, note_text in matches:
                if symbol in unicode_to_num:
                    footnotes[unicode_to_num[symbol]] = note_text.strip()
            
            # Also check for numbered footnotes like "1. Text", "2. Text" (direct numeric)
            numbered_pattern = r'(\d+)\.\s+(.+)'
            numbered_matches = re.findall(numbered_pattern, text)
            
            for num, note_text in numbered_matches:
                footnotes[num] = note_text.strip()
        
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
        Note: This method is kept for backward compatibility, but superscripts are now
        extracted before text parsing in parse_table_for_courses.
        """
        # 1. Identify superscripts
        superscripts = "".join(re.findall(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', raw_text))
        
        # 2. Strip superscripts and _V from the display text
        clean_text = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', '', raw_text)
        clean_text = self.clean_course_code(clean_text)
        
        # 3. Map superscripts to actual footnote text
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
        is_combined_years = False
        
        # --- Step 1: Extract footnotes inside the SAME table ---
        internal_footnotes = {}
        rows = table.find_all("tr")

        for row in rows:
            tds = row.find_all("td")
            if not tds:
                continue

            if self.is_table_footnote_row(tds):
                first_cell = tds[0]
                ids = self.extract_sup_ids_and_remove(first_cell)
                note_text = first_cell.get_text(" ", strip=True)
                for fid in ids:
                    internal_footnotes[fid] = note_text
        
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
                is_combined_years = False
                if "first" in header_text or "first" in first_cell_lower:
                    current_year_key = "1"
                elif "second" in header_text or "second" in first_cell_lower:
                    current_year_key = "2"
                elif "third" in header_text or "third" in first_cell_lower:
                    if "fourth" in header_text or "fourth" in first_cell_lower or "four" in header_text or "four" in first_cell_lower:
                        current_year_key = "3"
                        is_combined_years = True
                        print(f"  Detected combined 'Third and Fourth Years' - adding to both Year 3 and Year 4")
                    else:
                        current_year_key = "3"
                elif "fourth" in header_text or "fourth" in first_cell_lower or "four" in header_text or "four" in first_cell_lower:
                    current_year_key = "4"
                
                if current_year_key:
                    print(f"  Processing Year {current_year_key}")
                continue

            # Skip footnote rows (already processed in Step 1)
            tds = row.find_all("td")
            if self.is_table_footnote_row(tds):
                continue

            # Early exit if we hit the end
            if "total credits for degree" in first_cell_lower or "credits for degree" in first_cell_lower:
                break
                
            # Skip total credits rows
            if "total credits" in first_cell_lower:
                continue

            if current_year_key and len(cells) >= 2:
                # --- course row parse ---
                first_cell = cells[0]
                footnote_ids = self.extract_sup_ids_and_remove(first_cell)  # removes <sup> so code won't become 33510
                first_cell_text = first_cell.get_text(" ", strip=True).replace("\xa0", " ").strip()
                first_cell_lower = first_cell_text.lower()

                credit_text = cells[1].get_text(" ", strip=True)
                credits = self.extract_credits(credit_text) if credit_text else 0

                clean_code = self.clean_course_code(first_cell_text)

                # attach notes
                found_notes = [all_footnotes[fid] for fid in footnote_ids if fid in all_footnotes]
                note = " ".join(found_notes)
                
                # Skip empty rows (0 credits and empty/whitespace code)
                if credits == 0 and (not clean_code or not clean_code.strip()):
                    continue
                
                # Special case for Communication Requirement
                if "additional communication requirement" in first_cell_lower:
                    note = comm_requirement_courses
                    clean_code = "Additional Communication Requirement"
                elif "communication requirement" in first_cell_lower:
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
                
                # Special case for Forensic Science: Add "at BCIT campus" to FSCT courses
                if self.major_name.lower() == "forensic science" and "fsct" in clean_code.lower():
                    if note:
                        note += ". " + "at BCIT campus"
                    else:
                        note = "at BCIT campus"
                
                # Determine target years (both 3 and 4 if combined, otherwise just current)
                target_years = ["3", "4"] if is_combined_years else [current_year_key]
                
                # Add course to all target years
                course_data = {
                    "code": clean_code,
                    "credits": credits,
                    "title": "",
                    "notes": note
                }
                
                for year_key in target_years:
                    years_data[year_key].append(course_data)

        return years_data
    
    def normalize_curriculum_years(self, years_data: Dict) -> Dict:
        """
        Normalize curriculum years by filling missing years based on adjacent years.
        Handles cases where majors combine years (e.g., "Third and Fourth Years").
        Special handling for Biotechnology: Year 2 & 3 at BCIT, Year 4 & 5.
        """
        # Special case: Biotechnology has a 5-year structure
        if self.major_name.lower() == "biotechnology":
            y1 = years_data.get("1", [])
            y2 = years_data.get("2", [])
            y3 = years_data.get("3", [])
            y4 = years_data.get("4", [])
            
            # Biotechnology structure: Year 1, Year 2 & 3 (at BCIT), Year 4 & 5
            # Merge Year 2 and Year 3 into Year 2 (Year 2 & 3 at BCIT campus)
            if y2 and y3:
                # Combine Year 2 and Year 3 courses into Year 2
                years_data["2"] = y2 + y3
                print(f"  [Biotechnology] Merged Year 2 and Year 3 into Year 2 (BCIT campus)")
                # Clear Year 3
                years_data["3"] = []
            
            # Move Year 4 data to both Year 4 and Year 5
            if y4:
                years_data["5"] = y4.copy()
                print(f"  [Biotechnology] Created Year 5 from Year 4 data")
            
            return years_data
        
        # Standard normalization for other majors
        y1 = years_data.get("1", [])
        y2 = years_data.get("2", [])
        y3 = years_data.get("3", [])
        y4 = years_data.get("4", [])
        
        # Case 1: 1, 2, and 4 exist -> Copy Year 4 to Year 3
        if y1 and y2 and y4 and not y3:
            years_data["3"] = y4.copy()
            print(f"  Duplicated Year 4 into Year 3")

        # Case 2: 1, 2, and 3 exist -> Copy Year 3 to Year 4
        elif y1 and y2 and y3 and not y4:
            years_data["4"] = y3.copy()
            print(f"  Duplicated Year 3 into Year 4")

        # Case 3: 1, 3, and 4 exist -> Copy Year 3 to Year 2
        elif y1 and y3 and y4 and not y2:
            years_data["2"] = y3.copy()
            print(f"  Duplicated Year 3 into Year 2")
        
        return years_data
    
    def scrape_major_curriculum(self) -> Optional[Dict]:
        """
        Scrape curriculum for the specified Science major.
        Returns a dictionary with years 1-4 as keys, each containing a list of courses.
        """
        print(f"\n{'='*70}")
        print(f"Scraping {self.major_name}")
        print(f"URL: {self.major_url}")
        print(f"{'='*70}")
        
        try:
            response = self.session.get(self.major_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract communication requirement courses
            comm_requirement_courses = self.extract_communication_requirement_courses(soup)
            
            # Find all tables in "Degree Requirements" section
            tables = soup.find_all('figure', class_='responsive-figure-table')
            if not tables:
                # Fallback: look for any table
                tables = soup.find_all('table')
            
            print(f"  Found {len(tables)} table(s)")
            
            years_data = {
                "1": [],
                "2": [],
                "3": [],
                "4": []
            }
            
            for table in tables:
                # 1. Check if this table is actually a requirement table
                table_text = table.get_text().lower()
                if "year" not in table_text and "credits" not in table_text:
                    continue

                # Extract footnotes for this table
                footnotes = self.extract_footnotes(soup, table)
                
                # Parse the table
                table_years_data = self.parse_table_for_courses(
                    table, 
                    footnotes=footnotes,
                    comm_requirement_courses=comm_requirement_courses
                )
                
                # 2. Merge data (allow duplicates for "Electives")
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

                # 3. Stop after finding the primary requirement table
                if "total credits for degree" in table_text or "total credits" in table_text:
                    if has_data:
                        print(f"  Primary requirement table found. Stopping.")
                        break
            
            # Normalize years (fill missing years)
            years_data = self.normalize_curriculum_years(years_data)
            
            # Report results
            total_courses = sum(len(courses) for courses in years_data.values())
            print(f"\n  Extracted {total_courses} courses:")
            for year in ["1", "2", "3", "4"]:
                count = len(years_data[year])
                if count > 0:
                    print(f"    Year {year}: {count} courses")
            
            return years_data
            
        except requests.exceptions.HTTPError as e:
            print(f"  Error: HTTP {e.response.status_code} - Could not access page")
            print(f"  Please check if the major name is correct: '{self.major_name}'")
            return None
        except Exception as e:
            print(f"  Error scraping {self.major_name}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def run(self):
        """Main execution method"""
        print("=" * 70)
        print("UBC Single Science Major Curriculum Scraper")
        print("=" * 70)
        print(f"\nMajor: {self.major_name}")
        print(f"URL Slug: {self.url_slug}")
        
        # Scrape the major
        curriculum = self.scrape_major_curriculum()
        
        if not curriculum:
            print("\n" + "=" * 70)
            print("Scraping Failed!")
            print("=" * 70)
            return
        
        # Save results
        print(f"\n{'='*70}")
        print("Saving results...")
        print(f"{'='*70}")
        
        # Merge into main science_curriculum.json file
        main_file = os.path.join(self.output_dir, 'science_curriculum.json')
        
        # Load existing data if file exists
        if os.path.exists(main_file):
            with open(main_file, 'r', encoding='utf-8') as f:
                all_curriculum = json.load(f)
        else:
            all_curriculum = {}
        
        # Find the correct key (case-insensitive match) or use capitalized version
        # This ensures we update the existing "Biology" entry, not create a duplicate "biology"
        existing_key = None
        for key in all_curriculum.keys():
            if key.lower() == self.major_name.lower():
                existing_key = key
                break
        
        # Use existing key if found, otherwise capitalize the first letter of each word
        if existing_key:
            major_key = existing_key
            print(f"  Found existing key: {major_key}")
        else:
            # Capitalize first letter of each word (e.g., "Computer Science")
            major_key = ' '.join(word.capitalize() for word in self.major_name.split())
            print(f"  Using new key: {major_key}")
        
        # Remove any duplicate lowercase entries
        keys_to_remove = [k for k in all_curriculum.keys() if k.lower() == self.major_name.lower() and k != major_key]
        for key in keys_to_remove:
            del all_curriculum[key]
            print(f"  Removed duplicate entry: {key}")
        
        # Update the specific major's data
        all_curriculum[major_key] = curriculum
        
        # Save updated data
        with open(main_file, 'w', encoding='utf-8') as f:
            json.dump(all_curriculum, f, indent=2, ensure_ascii=False)
        
        print(f"\n  Updated: {main_file}")
        print(f"  Updated major: {major_key}")
        print(f"  Total courses: {sum(len(courses) for courses in curriculum.values())}")
        
        # Also save as separate file for backup
        safe_filename = self.major_name.lower().replace(' ', '_').replace('&', 'and')
        backup_file = os.path.join(self.output_dir, f'{safe_filename}_curriculum.json')
        backup_data = {self.major_name: curriculum}
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        print(f"  Backup saved: {backup_file}")
        
        print("\n" + "=" * 70)
        print("Scraping Complete!")
        print("=" * 70)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python scrape_single_science_major.py <major_name>")
        print("\nExamples:")
        print("  python scrape_single_science_major.py biology")
        print("  python scrape_single_science_major.py \"Computer Science\"")
        print("  python scrape_single_science_major.py chemistry")
        print("\nAvailable majors:")
        print("  - Astronomy")
        print("  - Atmospheric Science")
        print("  - Behavioural Neuroscience")
        print("  - Biochemistry")
        print("  - Biology")
        print("  - Biotechnology")
        print("  - Botany")
        print("  - Cellular and Physiological Sciences")
        print("  - Chemistry")
        print("  - Cognitive Systems")
        print("  - Combined Major in Science")
        print("  - Computer Science")
        print("  - Data Science")
        print("  - Earth and Ocean Sciences")
        print("  - Environmental Sciences")
        print("  - Forensic Science")
        print("  - General Science")
        print("  - Geographical Sciences")
        print("  - Geological Sciences")
        print("  - Geophysics")
        print("  - Integrated Sciences")
        print("  - Mathematics")
        print("  - Microbiology and Immunology")
        print("  - Neuroscience")
        print("  - Oceanography")
        print("  - Pharmacology")
        print("  - Physics")
        print("  - Statistics")
        print("  - Zoology")
        sys.exit(1)
    
    # Get major name from command line arguments
    major_name = ' '.join(sys.argv[1:])  # Join all arguments in case of spaces
    
    scraper = UBCSingleScienceMajorScraper(major_name)
    scraper.run()


if __name__ == "__main__":
    main()

