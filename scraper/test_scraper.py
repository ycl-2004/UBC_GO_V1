"""
Test script to debug the scraper
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
import time

def test_page_structure():
    """Test to see what elements are actually on the page"""
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        url = "https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/#british-columbia"
        print(f"Navigating to: {url}")
        driver.get(url)
        time.sleep(5)
        
        # Save page source for inspection
        with open('scraper/data/page_source.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print("✓ Saved page source to scraper/data/page_source.html")
        
        # Try to find all select elements
        print("\nLooking for select elements...")
        selects = driver.find_elements(By.TAG_NAME, 'select')
        print(f"Found {len(selects)} select elements")
        
        for i, select in enumerate(selects):
            print(f"\nSelect {i+1}:")
            print(f"  ID: {select.get_attribute('id')}")
            print(f"  Class: {select.get_attribute('class')}")
            print(f"  Name: {select.get_attribute('name')}")
            
            try:
                sel = Select(select)
                options = sel.options[:5]  # First 5 options
                print(f"  Options (first 5): {[opt.text for opt in options]}")
            except:
                print(f"  Could not get options")
        
        # Try to find degree dropdown specifically
        print("\n\nTrying to find degree dropdown...")
        selectors = [
            "//select[contains(@id, 'degree')]",
            "//select[contains(@class, 'degree')]",
            "//select[.//option[contains(text(), 'Arts')]]",
            "//select[.//option[contains(text(), 'Select a degree')]]",
        ]
        
        for selector in selectors:
            try:
                element = driver.find_element(By.XPATH, selector)
                print(f"✓ Found with selector: {selector}")
                print(f"  ID: {element.get_attribute('id')}")
                print(f"  Class: {element.get_attribute('class')}")
                
                sel = Select(element)
                print(f"  Total options: {len(sel.options)}")
                print(f"  First 3 options: {[opt.text for opt in sel.options[:3]]}")
                break
            except:
                print(f"✗ Not found with: {selector}")
        
    finally:
        driver.quit()
        print("\n✓ Browser closed")


if __name__ == "__main__":
    import os
    os.makedirs('scraper/data', exist_ok=True)
    test_page_structure()

