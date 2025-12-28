# Engineering Prerequisites Scraper

This script scrapes prerequisite data for all 13 UBC Engineering majors from the official UBC Engineering course planning page.

## Usage

### Basic Usage (Headless)
```bash
cd scraper
python scrape_engineering_prereqs.py
```

### Debug Mode (Visible Browser)
```bash
cd scraper
python scrape_engineering_prereqs.py --debug
```

## Output

The script generates `src/data/engineering_prereqs.json` with the following structure:

```json
{
  "BMEG": [
    {
      "course": "APSC 100",
      "direct": "BMEG 245",
      "affected": ""
    },
    ...
  ],
  "CHBE": [...],
  ...
}
```

## Dependencies

All dependencies are already in `requirements.txt`:
- selenium
- beautifulsoup4
- webdriver-manager

## Troubleshooting

### If the script can't find buttons/tables:

1. Run in debug mode to see what's happening:
   ```bash
   python scrape_engineering_prereqs.py --debug
   ```

2. Check the debug HTML output in `scraper/data/engineering_prereqs_debug.html`

3. The page structure may have changed. You may need to:
   - Update XPath selectors in `find_major_button()`
   - Update table selectors in `wait_for_table()` and `extract_table_data()`
   - Adjust wait times if the page loads slowly

### Common Issues

- **Timeout errors**: Increase wait times in `wait_for_table()`
- **Button not found**: The page structure may have changed - check selectors
- **Empty data**: Verify the table is fully loaded before extraction

## Engineering Majors

The script processes these 13 majors in order:
- BMEG (Biomedical Engineering)
- CHBE (Chemical and Biological Engineering)
- CIVL (Civil Engineering)
- CPEN (Computer Engineering)
- ELEC (Electrical Engineering)
- ENPH (Engineering Physics)
- ENVL (Environmental Engineering)
- GEOE (Geological Engineering)
- IGEN (Integrated Engineering)
- MANU (Manufacturing Engineering)
- MECH (Mechanical Engineering)
- MINE (Mining Engineering)
- MTRL (Materials Engineering)

