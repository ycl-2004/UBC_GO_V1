#!/usr/bin/env python3
"""
UBC Single Course Scraper (robust)
Scrapes details for a SINGLE specific course (e.g., "MATH 255") from the UBC Calendar
and updates the curriculum JSON files.

Works best by:
1) Trying the per-course page first: /course-descriptions/courses/<subject>-<number>
2) Falling back to the subject page: /course-descriptions/subject/<subject>

Usage:
    python scripts/scrape_single_course.py --course "MATH 255" --subject mathv
    python scripts/scrape_single_course.py --course "MATH 255" --subject mathv --force
"""

import argparse
import json
import os
import random
import re
import time
from typing import Dict, Optional, Tuple, Union

import requests
from bs4 import BeautifulSoup


class SingleCourseScraper:
    def __init__(self, target_course: str, subject_suffix: str, force: bool = False):
        self.target_course = self.clean_input_code(target_course)  # e.g. "MATH 255"
        self.subject_suffix = subject_suffix.lower().strip()       # e.g. "mathv"

        parts = self.target_course.split()
        if len(parts) != 2:
            raise ValueError(f"Invalid course format: '{target_course}'. Expected 'MATH 255'.")

        self.code_prefix = parts[0].upper()
        self.course_number = parts[1]  # keep as string

        self.base_url = "https://vancouver.calendar.ubc.ca"

        # Subject page URL: ensure it ends with 'v' (UBC Vancouver subjects do)
        if not self.subject_suffix.endswith("v"):
            self.subject_suffix += "v"
        self.course_list_url = f"{self.base_url}/course-descriptions/subject/{self.subject_suffix}"

        # Per-course page URL: typically looks like .../course-descriptions/courses/mathv-255
        self.course_page_url = f"{self.base_url}/course-descriptions/courses/{self.subject_suffix}-{self.course_number.lower()}"

        self.force = force
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        })

        # Path to curriculum JSON files (same as your original)
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.curriculum_dir = os.path.join(script_dir, "src", "data", "curriculum", "applied-science")

    # ----------------------------
    # Helpers
    # ----------------------------
    def clean_input_code(self, code: str) -> str:
        """Standardizes input to 'ABCD 123' format."""
        return re.sub(r"\s+", " ", code.strip().upper())

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

    def fetch_soup(self, url: str) -> Optional[BeautifulSoup]:
        print(f"Fetching: {url}")
        self._random_delay()
        try:
            r = self.session.get(url, timeout=20)
            if self._blocked(r.text):
                print("  ⚠️ BLOCKED by site security (bot protection). Try again later / change network / add longer delays.")
                return None
            r.raise_for_status()
            return BeautifulSoup(r.content, "html.parser")
        except requests.HTTPError as e:
            print(f"  ❌ HTTP error: {e}")
            return None
        except Exception as e:
            print(f"  ❌ Request error: {e}")
            return None

    def clean_text(self, text: str) -> str:
        """Clean description/prereq/coreq text without killing URLs."""
        if not text:
            return ""

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
    # Parsing a single course chunk
    # ----------------------------
    def parse_course_chunk(self, chunk_text: str) -> Optional[Dict]:
        """
        Parse a course block (header + title + description + prereq/coreq).
        Designed to work with subject-page or course-page extracted blocks.
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
        header_pattern = rf"{re.escape(self.code_prefix)}(?:_V)?\s+(\d{{3}}[A-Z]?)\s*(?:\(([\d-]+)\))?"
        code_match = re.search(header_pattern, chunk_text, re.IGNORECASE)
        if not code_match:
            return None

        number = code_match.group(1)
        credits_raw = code_match.group(2) if code_match.lastindex and code_match.group(2) else None

        raw_course_code = code_match.group(0)
        course_code = self.clean_course_code(raw_course_code)

        # Ensure we only accept the target course number
        if number.upper() != self.course_number.upper():
            return None

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
        code_pattern = rf"{re.escape(self.code_prefix)}(?:_V)?\s+{re.escape(number)}"
        title = re.sub(code_pattern, "", title, flags=re.IGNORECASE).strip()
        title = re.sub(r"\[\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*\*?\s*\]", "", title).strip()
        title = re.sub(r"\s+", " ", title).strip().rstrip(".").strip()

        # Extract prereq/coreq/equiv from body
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
    # Extract course block from HTML (preferred on subject page)
    # ----------------------------
    def extract_course_block_from_subject_page(self, soup: BeautifulSoup) -> Optional[str]:
        """
        On the subject page, courses are usually listed with a header element (h3/h4) per course.
        We locate the header for the target and then collect following siblings until the next course header.
        """
        # A course header on the subject page usually contains the whole line:
        # "MATH_V 255 (3) Ordinary Differential Equations"
        header_re = re.compile(
            rf"\b{re.escape(self.code_prefix)}(?:_V)?\s+{re.escape(self.course_number)}\b",
            re.IGNORECASE,
        )

        # Candidate header tags (site-dependent, but these cover most layouts)
        header_tags = soup.find_all(["h2", "h3", "h4", "h5"])
        target_header = None
        for tag in header_tags:
            txt = tag.get_text(" ", strip=True)
            if header_re.search(txt):
                target_header = tag
                break

        if not target_header:
            return None

        # Stop when we hit the next header that looks like ANY course header, not just this prefix.
        any_course_header_re = re.compile(r"^[A-Z]{2,6}(?:_V)?\s+\d{3}[A-Z]?\s*\(", re.IGNORECASE)

        parts = [target_header.get_text(" ", strip=True)]
        for sib in target_header.find_all_next():
            # If we hit another course header tag, stop
            if sib.name in ["h2", "h3", "h4", "h5"]:
                sib_txt = sib.get_text(" ", strip=True)
                if any_course_header_re.match(sib_txt):
                    break
            # Collect paragraphs/lists that belong to this course
            if sib.name in ["p", "div", "ul", "ol"]:
                s = sib.get_text(" ", strip=True)
                if s:
                    parts.append(s)

        return "\n".join(parts).strip()

    # ----------------------------
    # Fallback: text-chunk scanning (safer delimiter)
    # ----------------------------
    def extract_course_block_from_text(self, soup: BeautifulSoup) -> Optional[str]:
        main = soup.select_one("main") or soup.select_one("article") or soup.body or soup
        full_text = main.get_text(separator="\n", strip=False)

        # Anchor headers to line start and require credits "(" to avoid matching inside prerequisites
        target_header_pattern = re.compile(
            rf"(?mi)^{re.escape(self.code_prefix)}(?:_V)?\s+{re.escape(self.course_number)}[A-Z]?\s*\(",
            re.IGNORECASE | re.MULTILINE,
        )
        m = target_header_pattern.search(full_text)
        if not m:
            return None

        start = m.start()

        next_header_pattern = re.compile(r"(?mi)^[A-Z]{2,6}(?:_V)?\s+\d{3}[A-Z]?\s*\(", re.IGNORECASE | re.MULTILINE)
        m2 = next_header_pattern.search(full_text, m.end())
        end = m2.start() if m2 else len(full_text)

        return full_text[start:end].strip()

    # ----------------------------
    # Scrape target course (course page first, then subject page)
    # ----------------------------
    def scrape_target_course(self) -> Optional[Dict]:
        # 1) Try per-course page (usually the cleanest)
        soup = self.fetch_soup(self.course_page_url)
        if soup:
            block = (soup.select_one("main") or soup.body or soup).get_text(separator="\n", strip=False)
            parsed = self.parse_course_chunk(block)
            if parsed and parsed.get("description"):
                print("  ✅ Parsed from per-course page")
                return parsed
            print("  ⚠️ Per-course page parse failed or incomplete, falling back to subject page...")

        # 2) Subject page fallback
        soup = self.fetch_soup(self.course_list_url)
        if not soup:
            return None

        block = self.extract_course_block_from_subject_page(soup)
        if not block:
            block = self.extract_course_block_from_text(soup)

        if not block:
            print(f"❌ Could not locate course {self.target_course} on subject page.")
            return None

        parsed = self.parse_course_chunk(block)
        if parsed:
            print("  ✅ Parsed from subject page")
        return parsed

    # ----------------------------
    # JSON updating
    # ----------------------------
    def update_course_obj(self, course_obj: Dict, scraped: Dict) -> bool:
        """
        Update a single course object in your JSON structure.
        Returns True if updated.
        """
        raw_code = course_obj.get("code", "")
        code_norm = self.clean_input_code(self.clean_course_code(raw_code))
        target_norm = self.clean_input_code(self.target_course)

        if code_norm != target_norm:
            return False

        # Skip if not forcing and already has key fields
        if not self.force and course_obj.get("description") and course_obj.get("prerequisites"):
            return False

        updated = False

        # Title
        scraped_title = (scraped.get("title") or "").strip()
        if scraped_title:
            cur_title = (course_obj.get("title") or "").strip()
            if self.force:
                if scraped_title != cur_title and scraped_title != target_norm:
                    course_obj["title"] = scraped_title
                    updated = True
            else:
                if not cur_title or (scraped_title != cur_title and scraped_title != target_norm):
                    course_obj["title"] = scraped_title
                    updated = True

        # Description
        if scraped.get("description"):
            course_obj["description"] = scraped["description"]
            updated = True

        # Prerequisites
        if scraped.get("prerequisites"):
            course_obj["prerequisites"] = scraped["prerequisites"]
            updated = True

        # Corequisites (keep separate if your schema supports it; else append)
        if scraped.get("corequisites"):
            # If your JSON schema has "corequisites" field, prefer that:
            if "corequisites" in course_obj:
                course_obj["corequisites"] = scraped["corequisites"]
            else:
                # Fallback: append into prerequisites text
                if course_obj.get("prerequisites"):
                    course_obj["prerequisites"] = f"{course_obj['prerequisites']}\n\nCorequisites: {scraped['corequisites']}"
                else:
                    course_obj["prerequisites"] = f"Corequisites: {scraped['corequisites']}"
            updated = True

        # Credits (optional; only update if your schema wants it)
        if scraped.get("credits") is not None:
            course_obj["credits"] = scraped["credits"]
            updated = True

        return updated

    def update_json_files(self, scraped_course: Dict):
        print(f"\nSearching for {self.target_course} in JSON files...")

        if not os.path.isdir(self.curriculum_dir):
            print(f"❌ curriculum_dir not found: {self.curriculum_dir}")
            return

        json_files = [f for f in os.listdir(self.curriculum_dir) if f.endswith(".json")]
        updated_any = False
        updated_count = 0

        for filename in json_files:
            filepath = os.path.join(self.curriculum_dir, filename)

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                print(f"  ❌ Error reading {filename}: {e}")
                continue

            file_updated = False

            for year in data.get("years", []):
                for term in year.get("terms", []):
                    for course_obj in term.get("courses", []):
                        if self.update_course_obj(course_obj, scraped_course):
                            file_updated = True
                            updated_any = True
                            updated_count += 1

            if file_updated:
                try:
                    with open(filepath, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    print(f"  ✅ Updated in {filename}")
                except Exception as e:
                    print(f"  ❌ Error saving {filename}: {e}")

        if not updated_any:
            print(f"⚠️ Course {self.target_course} was not found in your JSON files (or required no update).")
        else:
            print(f"\n✅ Successfully updated {self.target_course} in {updated_count} place(s).")

    # ----------------------------
    # Runner
    # ----------------------------
    def run(self):
        print("=" * 60)
        print(f"Single Course Scraper: {self.target_course}")
        print(f"Subject page: {self.course_list_url}")
        print(f"Course page:  {self.course_page_url}")
        print("=" * 60)

        result = self.scrape_target_course()
        if not result:
            print(f"\n❌ Failed to scrape {self.target_course}")
            return

        print("\n📋 Scraped Data:")
        print(f"   Code: {result.get('code')}")
        print(f"   Title: {result.get('title') or '(No title)'}")
        print(f"   Credits: {result.get('credits')}")
        desc = result.get("description") or ""
        prereq = result.get("prerequisites") or ""
        coreq = result.get("corequisites") or ""
        print(f"   Description: {desc[:140]}{'...' if len(desc) > 140 else ''}")
        print(f"   Prerequisites: {prereq[:140]}{'...' if len(prereq) > 140 else ''}")
        print(f"   Corequisites: {coreq[:140]}{'...' if len(coreq) > 140 else ''}")

        self.update_json_files(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape single course details from UBC Calendar")
    parser.add_argument("--course", required=True, help="Course code (e.g. 'MATH 255')")
    parser.add_argument("--subject", required=True, help="Subject suffix (e.g. 'mathv')")
    parser.add_argument("--force", action="store_true", help="Force update even if data exists")

    args = parser.parse_args()
    scraper = SingleCourseScraper(args.course, args.subject, args.force)
    scraper.run()
