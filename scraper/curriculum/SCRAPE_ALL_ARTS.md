# How to Scrape All Arts Majors

## Option 1: Update Existing Successful Majors (Recommended)

This script uses the list of successful majors from `arts_scraping_results.json` and scrapes them with the latest scraper updates:

```bash
python scraper/curriculum/update_arts_curriculum.py
```

**What it does:**
- Loads the list of successful majors from `scraper/curriculum/arts_scraping_results.json`
- Scrapes each major using the updated scraper (with fixes for Political Science, Psychology, etc.)
- Merges new data with existing `src/data/curriculum/arts/arts_curriculum.json`
- Shows progress and summary

**Output:**
- Updates `src/data/curriculum/arts/arts_curriculum.json` with all scraped majors
- Website will automatically display the updated data

## Option 2: Scrape All Majors from Scratch

If you want to scrape all majors from scratch (useful if you've made major scraper changes):

```bash
python scraper/curriculum/scrape_all_arts_majors.py
```

This will:
1. Test all BA majors to find which URLs work
2. Save results to `scraper/curriculum/arts_scraping_results.json`
3. Then run `update_arts_curriculum.py` to actually scrape the curriculum data

## Option 3: Scrape Individual Major

To test or update a single major:

```bash
python scraper/curriculum/scrape_arts_curriculum.py --major "Political Science"
```

## What's Fixed in the Latest Scraper

- ✅ Handles `<p><strong>Lower-level Requirements</strong></p>` format (Political Science)
- ✅ Consolidates category-based course lists (e.g., "Behavioural Neuroscience: PSYC_V 301, 304..." → single "Electives" entry)
- ✅ Handles "or" options correctly
- ✅ Parses descriptive requirements properly

## Notes

- The scraper includes delays between requests to be polite to the server
- Existing data in `arts_curriculum.json` will be preserved and merged with new data
- Failed majors will be listed in the output for manual review
