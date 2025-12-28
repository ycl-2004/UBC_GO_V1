"""
Scraper for UBC Engineering Prerequisites
Scrapes prerequisite data for all 13 engineering majors from:
https://academicservices.engineering.ubc.ca/degree-planning/course-planning/
"""

"""
python3 scrape_engineering_prereqs.py
"""
import json
import time
import re
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

# Engineering major codes in order
ENGINEERING_MAJORS = [
    'BMEG', 'CHBE', 'CIVL', 'CPEN', 'ELEC', 'ENPH', 
    'ENVL', 'GEOE', 'IGEN', 'MANU', 'MECH', 'MINE', 'MTRL'
]

# Target URL
BASE_URL = 'https://academicservices.engineering.ubc.ca/degree-planning/course-planning/'


def setup_driver(headless=True, debug=False):
    """Initialize and return a Chrome WebDriver instance using native Selenium Manager."""
    chrome_options = Options()
    if headless and not debug:
        chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # FIX: Use default Service() to let Selenium Manager handle the driver
    service = Service()
    
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    return driver


def clean_text(text):
    """Clean text by removing extra whitespace and newlines."""
    if not text:
        return ""
    # Remove newlines and extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    return text


def expand_all_accordions(driver):
    """Expand the main 'First Year Program' accordion AND the nested 'Pre-Requisites' accordion."""
    try:
        # 1. Expand Outer Accordion (First Year Program)
        outer_xpath = "//h2[contains(@class, 'c-accordion__title') and contains(text(), 'First Year Program')]"
        outer_header = driver.find_elements(By.XPATH, outer_xpath)
        
        if outer_header:
            el = outer_header[0]
            if el.get_attribute('aria-expanded') != 'true':
                driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", el)
                time.sleep(0.5)
                driver.execute_script("arguments[0].click();", el)
                print("✓ Expanded Outer Accordion: First Year Program")
                time.sleep(1) # Wait for animation

        # 2. Expand Inner Accordion (Pre-Requisites)
        # It is an <h4> tag inside the outer content
        inner_xpath = "//h4[contains(@class, 'c-accordion__title') and contains(text(), 'Pre-Requisites')]"
        # Wait specifically for this to be present (it might take a moment after outer expansion)
        try:
            WebDriverWait(driver, 3).until(EC.presence_of_element_located((By.XPATH, inner_xpath)))
            inner_header = driver.find_elements(By.XPATH, inner_xpath)
            
            if inner_header:
                el = inner_header[0]
                if el.get_attribute('aria-expanded') != 'true':
                    driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", el)
                    time.sleep(0.5)
                    driver.execute_script("arguments[0].click();", el)
                    print("✓ Expanded Inner Accordion: Pre-Requisites")
                    time.sleep(1)
        except:
            print("⚠ Could not find inner 'Pre-Requisites' header (might already be open or missing)")

    except Exception as e:
        print(f"⚠ Error expanding accordions: {e}")


def scroll_to_section(driver, section_text="Pre-Requisites for Engineering Programs"):
    """Scroll to the prerequisites section."""
    try:
        # Try to find the section by text
        section = driver.find_element(By.XPATH, f"//*[contains(text(), '{section_text}')]")
        driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", section)
        time.sleep(1)
        print(f"✓ Scrolled to '{section_text}' section")
        return True
    except Exception as e:
        print(f"⚠ Could not scroll to section: {e}")
        return False


def debug_page_structure(driver):
    """Print available buttons and tables for debugging."""
    print("\n🔍 Debugging page structure...")
    
    # Find all buttons
    buttons = driver.find_elements(By.TAG_NAME, 'button')
    print(f"\nFound {len(buttons)} buttons:")
    for i, btn in enumerate(buttons[:20]):  # Limit to first 20
        text = btn.text.strip()
        if text and any(major in text.upper() for major in ENGINEERING_MAJORS):
            print(f"  [{i}] '{text}' (id={btn.get_attribute('id')}, class={btn.get_attribute('class')})")
    
    # Find all links
    links = driver.find_elements(By.TAG_NAME, 'a')
    print(f"\nFound {len(links)} links (showing major-related):")
    for i, link in enumerate(links):
        text = link.text.strip()
        if text and any(major in text.upper() for major in ENGINEERING_MAJORS):
            print(f"  [{i}] '{text}' (id={link.get_attribute('id')}, class={link.get_attribute('class')})")
    
    # Find all tables
    tables = driver.find_elements(By.TAG_NAME, 'table')
    print(f"\nFound {len(tables)} tables:")
    for i, table in enumerate(tables):
        table_id = table.get_attribute('id') or 'no-id'
        table_class = table.get_attribute('class') or 'no-class'
        print(f"  [{i}] id='{table_id}', class='{table_class}'")
    
    print()


def find_major_button(driver, major_code):
    """Find the tab anchor for a major based on specific jQuery UI structure."""
    try:
        # Wait for the nav-tabs container to be visible first
        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//ul[contains(@class, 'nav-tabs')]"))
            )
        except:
            pass  # Continue even if container not found
        
        # Strategy: Look for the specific UI tab anchor class seen in screenshots
        # The text usually matches exactly (e.g. "CIVL")
        selectors = [
            # Exact match on the anchor tag class
            f"//a[contains(@class, 'ui-tabs-anchor')][text()='{major_code}']",
            # Fallback: Text contains match
            f"//a[contains(@class, 'ui-tabs-anchor')][contains(text(), '{major_code}')]",
            # Fallback: Look inside the specific list item class
            f"//li[contains(@class, 'ui-tabs-tab')]//a[contains(text(), '{major_code}')]"
        ]
        
        for xpath in selectors:
            try:
                element = driver.find_element(By.XPATH, xpath)
                if element.is_displayed():
                    return element
            except:
                continue
                
        return None
    except Exception as e:
        print(f"Error finding button for {major_code}: {e}")
        return None


def wait_for_table(driver, timeout=10):
    """Wait for the tablepress table to be visible."""
    try:
        # Target tablepress tables specifically, as seen in screenshots
        table_selectors = [
            "//div[contains(@class, 'ui-tabs-panel') and not(contains(@style, 'display: none'))]//table[contains(@class, 'tablepress')]",
            "//table[contains(@class, 'tablepress')]",
            "//table" # Fallback
        ]
        
        for selector in table_selectors:
            try:
                table = WebDriverWait(driver, timeout).until(
                    EC.visibility_of_element_located((By.XPATH, selector))
                )
                return table
            except:
                continue
        return None
    except TimeoutException:
        print("⚠ Table did not appear within timeout")
        return None


def ensure_all_rows_visible(driver):
    """Ensure all table rows are visible by setting pagination to 'All' if available."""
    try:
        # Look for pagination dropdown
        pagination_selectors = [
            "//select[@name='prereq-table_length']",
            "//select[contains(@class, 'length')]",
            "//select[contains(@name, 'length')]",
        ]
        
        for selector in pagination_selectors:
            try:
                dropdown = driver.find_element(By.XPATH, selector)
                if dropdown:
                    # Try to select 'All' option
                    driver.execute_script("""
                        var select = arguments[0];
                        var option = Array.from(select.options).find(opt => opt.value === '-1' || opt.text.toLowerCase().includes('all'));
                        if (option) {
                            select.value = option.value;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    """, dropdown)
                    time.sleep(1)
                    print("✓ Set pagination to 'All'")
                    return True
            except:
                continue
        
        print("ℹ No pagination dropdown found or already showing all rows")
        return False
    except Exception as e:
        print(f"⚠ Could not set pagination: {e}")
        return False


def extract_table_data(driver, major_code):
    """Extract data handling rowspan and tablepress structure."""
    try:
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # 1. Find the visible tab panel first
        # jQuery UI tabs use aria-hidden="false" or style="display: block" for the active panel
        active_panel = soup.find('div', {'class': 'ui-tabs-panel', 'aria-hidden': 'false'})
        
        if not active_panel:
            # Fallback: try to find panel by ID matching the major (e.g., id="CPEN-3")
            # We use regex because the ID might be "CPEN-3" or "CIVL-2"
            active_panel = soup.find('div', {'id': re.compile(f'{major_code}-\d+')})

        if not active_panel:
            print(f"⚠ Could not locate active panel for {major_code}")
            return []

        # 2. Find the table inside that panel
        table = active_panel.find('table', {'class': re.compile(r'tablepress')})
        if not table:
            print(f"⚠ No 'tablepress' table found in panel for {major_code}")
            return []

        # 3. Parse Rows with State (for Rowspan)
        rows = table.find('tbody').find_all('tr')
        prerequisites = []
        last_first_year_course = "" # State variable
        
        for row in rows:
            cells = row.find_all('td')
            if not cells: continue

            current_course = ""
            direct = ""
            affected = ""

            # Case 1: Full Row (3 columns)
            # The first column is the First-Year Course
            if len(cells) == 3:
                current_course = clean_text(cells[0].get_text())
                last_first_year_course = current_course # Update state
                direct = clean_text(cells[1].get_text())
                affected = clean_text(cells[2].get_text())

            # Case 2: Merged Row (2 columns)
            # This row belongs to the previous First-Year Course (Rowspan)
            elif len(cells) == 2:
                current_course = last_first_year_course # Use state
                direct = clean_text(cells[0].get_text())
                affected = clean_text(cells[1].get_text())

            # Only add if we have valid data
            if current_course and (direct or affected):
                prerequisites.append({
                    'course': current_course,
                    'direct': direct,
                    'affected': affected
                })
        
        print(f"✓ Extracted {len(prerequisites)} prerequisites for {major_code}")
        return prerequisites

    except Exception as e:
        print(f"⚠ Error extracting data for {major_code}: {e}")
        return []


def scrape_all_majors(driver):
    """Scrape prerequisites for all engineering majors."""
    all_data = {}
    
    # Navigate to the page
    print(f"🌐 Navigating to {BASE_URL}")
    driver.get(BASE_URL)
    time.sleep(3)  # Wait for page to load
    
    # Expand accordion if needed
    expand_all_accordions(driver)
    
    # Scroll to prerequisites section
    scroll_to_section(driver)
    
    # Debug mode: print page structure
    if '--debug' in sys.argv or '--no-headless' in sys.argv:
        debug_page_structure(driver)
        input("Press Enter to continue after reviewing page structure...")
    
    # Iterate through each major
    for major_code in ENGINEERING_MAJORS:
        print(f"\n📋 Processing {major_code}...")
        
        try:
            # Find and click the major button
            button = find_major_button(driver, major_code)
            if not button:
                print(f"⚠ Could not find button for {major_code}")
                all_data[major_code] = []
                continue
            
            # Click the button
            driver.execute_script("arguments[0].click();", button)
            time.sleep(2)  # Wait for tab to switch
            
            # Wait for table to appear
            table = wait_for_table(driver)
            if not table:
                print(f"⚠ Table did not appear for {major_code}")
                all_data[major_code] = []
                continue
            
            # Ensure all rows are visible
            ensure_all_rows_visible(driver)
            
            # Extract data
            prerequisites = extract_table_data(driver, major_code)
            all_data[major_code] = prerequisites
            
        except Exception as e:
            print(f"❌ Error processing {major_code}: {e}")
            all_data[major_code] = []
    
    return all_data


def save_data(data, output_path):
    """Save scraped data to JSON file."""
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Data saved to {output_path}")


def main():
    """Main execution function."""
    import sys
    
    # Check for debug flag
    debug = '--debug' in sys.argv or '--no-headless' in sys.argv
    
    print("🚀 Starting Engineering Prerequisites Scraper\n")
    if debug:
        print("🐛 Debug mode: Browser will be visible\n")
    
    driver = None
    try:
        # Setup driver
        driver = setup_driver(headless=not debug, debug=debug)
        
        # Scrape all majors
        data = scrape_all_majors(driver)
        
        # Save to JSON
        output_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'src', 'data', 'engineering_prereqs.json'
        )
        save_data(data, output_path)
        
        # Also save a debug HTML dump if in debug mode
        if debug:
            debug_dir = os.path.join(
                os.path.dirname(__file__),
                'data'
            )
            os.makedirs(debug_dir, exist_ok=True)
            
            debug_html_path = os.path.join(debug_dir, 'engineering_prereqs_debug.html')
            with open(debug_html_path, 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
            print(f"📄 Debug HTML saved to {debug_html_path}")
            
            # Save screenshot
            screenshot_path = os.path.join(debug_dir, 'engineering_prereqs_screenshot.png')
            driver.save_screenshot(screenshot_path)
            print(f"📸 Screenshot saved to {screenshot_path}")
        
        # Print summary
        print("\n📊 Summary:")
        for major, prereqs in data.items():
            print(f"  {major}: {len(prereqs)} prerequisites")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        if driver:
            driver.quit()
            print("\n🔒 Browser closed")


if __name__ == '__main__':
    main()

