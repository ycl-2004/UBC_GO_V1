#!/usr/bin/env python3
"""
Test script to verify that we're scraping province-specific course codes
like "English Language Arts 30-1" instead of generic "A Grade 12 English"
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import re

def test_alberta_applied_biology():
    print("=" * 80)
    print("Testing: Alberta - Applied Biology")
    print("=" * 80)
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Navigate to Alberta requirements page
        url = "https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/#alberta"
        print(f"\n1. Navigating to: {url}")
        driver.get(url)
        time.sleep(5)
        print("   ✓ Page loaded")
        
        # Select Applied Biology
        print("\n2. Selecting 'Applied Biology' from dropdown...")
        degree_select = Select(driver.find_element(By.CLASS_NAME, "select-programs-list"))
        degree_select.select_by_visible_text("Applied Biology")
        
        # CRITICAL: Wait longer for province-specific course codes to load
        print("   ⏳ Waiting 8 seconds for province-specific content...")
        time.sleep(8)
        
        # Wait for requirements section
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "section-requirements"))
            )
            print("   ✓ Requirements section found")
        except:
            print("   ⚠ Timeout waiting for requirements section")
        
        # Additional wait for dynamic content
        time.sleep(4)
        print("   ✓ Additional wait complete")
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find Grade 12 requirements
        print("\n3. Extracting Grade 12 requirements...")
        grade_12_section = None
        for tag in ['h5', 'h4', 'h3', 'h2']:
            grade_12_section = soup.find(tag, string=re.compile(r'Grade 12 requirements?', re.I))
            if grade_12_section:
                print(f"   ✓ Found with tag: <{tag}>")
                break
        
        if grade_12_section:
            ul = grade_12_section.find_next('ul')
            if ul:
                print("\n   📋 Grade 12 Requirements:")
                for li in ul.find_all('li', recursive=False):
                    # Use separator=' ' to preserve text from nested elements
                    text = li.get_text(separator=' ', strip=True)
                    print(f"      • {text}")
                    
                    # Check if we got specific course codes
                    if "30-1" in text or "30-2" in text or "Math 30" in text or "Math 31" in text:
                        print(f"        ✅ FOUND SPECIFIC COURSE CODE!")
                    elif "Grade 12" in text and "A Grade 12" in text:
                        print(f"        ❌ WARNING: Still getting generic description")
            else:
                print("   ✗ No <ul> found after heading")
        else:
            print("   ✗ Grade 12 requirements section not found")
        
        # Find Grade 11 requirements
        print("\n4. Extracting Grade 11 requirements...")
        grade_11_section = None
        for tag in ['h5', 'h4', 'h3', 'h2']:
            grade_11_section = soup.find(tag, string=re.compile(r'Grade 11 requirements?', re.I))
            if grade_11_section:
                print(f"   ✓ Found with tag: <{tag}>")
                break
        
        if grade_11_section:
            ul = grade_11_section.find_next('ul')
            if ul:
                print("\n   📋 Grade 11 Requirements:")
                for li in ul.find_all('li', recursive=False):
                    text = li.get_text(separator=' ', strip=True)
                    print(f"      • {text}")
            else:
                print("   ✗ No <ul> found after heading")
        else:
            print("   ✗ Grade 11 requirements section not found")
        
        print("\n" + "=" * 80)
        print("Test complete!")
        print("=" * 80)
        
    finally:
        driver.quit()
        print("\n✓ Browser closed")

if __name__ == "__main__":
    test_alberta_applied_biology()

