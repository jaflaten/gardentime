# Scraping Implementation Plan

## Overview
We will use a hybrid approach to scraping where manual analysis guides DOM extraction. Then we scrape and store the data, pass through with regex, and finally use LLM parsing to store results in the database and files.

---

## Phase 1: Project Setup & DOM Analysis

### 1.1 Add Dependencies
- [ ] Add JSoup to Gradle dependencies
- [ ] Add Jackson for JSON handling
- [ ] Set up logging framework

### 1.2 Create Documentation Structure
- [ ] Create `/docs/scraping/` folder in project
- [ ] Create `/docs/scraping/dom-structures/` subfolder
- [ ] Create template: `dom-structure-template.md`

### 1.3 Manual DOM Documentation (You do this)
- [ ] Visit Almanac.com/plant/tomatoes
- [ ] Open DevTools (F12)
- [ ] Copy HTML snippets for each data point
- [ ] Paste into `docs/scraping/dom-structures/almanac-com.md`
- [ ] Repeat for 2-3 sample plants to verify consistency

### 1.4 Build DOM Analyzer Tool
- [ ] Create `DOMAnalyzer.kt` service
- [ ] Implement structure analysis method
- [ ] Create report generator
- [ ] Add CLI command or endpoint to run analyzer
- [ ] Test analyzer on documented sites

---

## Phase 2: Core Scraper Infrastructure

### 2.1 Create Base Classes
- [ ] Create `BaseScraper` abstract class
- [ ] Implement `RateLimiter` class (3-5 second delays)
- [ ] Create `ScraperConfig` for settings
- [ ] Add retry logic with exponential backoff

### 2.2 Create Data Models
- [ ] Create `ScrapedPlantData` data class
- [ ] Create `CompanionRelationship` data class
- [ ] Create `PlantingGuide` data class
- [ ] Create `CareInstructions` data class
- [ ] Create `HarvestInfo` data class

### 2.3 Database Schema for Raw Data
- [ ] Create `scraped_raw_data` table
- [ ] Create `scraped_sections` table for extracted text

---

## Phase 3: Site-Specific Scrapers

### 3.1 Almanac.com Scraper
- [ ] Create `AlmanacScraper.kt` extending `BaseScraper`
- [ ] Implement URL builder (template: `/plant/{slug}`)
- [ ] Implement HTML extraction methods:
  - [ ] `extractCommonName(doc: Document)`
  - [ ] `extractDescription(doc: Document)`
  - [ ] `extractCompanionSection(doc: Document)`
  - [ ] `extractPlantingGuide(doc: Document)`
  - [ ] `extractCareInstructions(doc: Document)`
  - [ ] `extractHarvestInfo(doc: Document)`
  - [ ] `extractPestsAndDiseases(doc: Document)`
- [ ] Use DOM documentation to implement selectors
- [ ] Add fallback selectors for each extraction
- [ ] Store raw HTML to database

### 3.2 Create Plant URL Manager
- [ ] Create hardcoded list of top 50 plant slugs
- [ ] Organize by category (vegetables, fruits, herbs)
- [ ] Add metadata (priority, common_name)

---

## Phase 4: File Output System

### 4.1 Create Output Directory Structure
- [ ] Create `/docs/scrapers/raw-html/` folder
- [ ] Create `/docs/scrapers/extracted-text/` folder
- [ ] Create `/docs/scrapers/parsed-json/` folder
- [ ] Create `/docs/scrapers/parsed-json/regex-results/` subfolder
- [ ] Create `/docs/scrapers/parsed-json/llm-results/` subfolder

### 4.2 Implement File Writers
- [ ] Create `FileOutputService.kt`
- [ ] Method: `saveRawHtml(slug, html)`
- [ ] Method: `saveSectionText(slug, sectionType, text)`
- [ ] Method: `saveParsedJson(slug, jsonData)`
- [ ] Add file naming conventions
- [ ] Add timestamp to filenames

### 4.3 Create Extraction Report
- [ ] Generate `extraction-report.md` after scraping

---

## Phase 5: Regex-Based Parsing (First Pass)

### 5.1 Create Regex Parsers
- [ ] Create `CompanionTextParser.kt`
- [ ] Implement patterns for beneficial companions:
  - [ ] "plant with X, Y, and Z"
  - [ ] "grows well with X"
  - [ ] "good companions: X, Y"
  - [ ] "benefits from X"
- [ ] Implement patterns for antagonists:
  - [ ] "avoid planting with X"
  - [ ] "keep away from X"
  - [ ] "don't plant near X"
- [ ] Create plant name extractor (split by delimiters)
- [ ] Create plant name normalizer

### 5.2 Apply Regex Parsing
- [ ] Run regex parser on all extracted text files
- [ ] Output to `parsed-json/regex-results/`
- [ ] Include confidence scores (HIGH if clear pattern, LOW if ambiguous)
- [ ] Generate `regex-parsing-report.md`

### 5.3 Review Regex Results
- [ ] Manually review 10 sample plants
- [ ] Document what regex catches well
- [ ] Document what regex misses
- [ ] Create list of plants needing LLM parsing

---

## Phase 6: LLM-Assisted Parsing (Manual with Copilot)

### 6.1 Create LLM Prompt Templates
- [ ] Create `/docs/llm-prompts/parse-companion-data.md`

### 6.2 Manual LLM Parsing Workflow
- [ ] Open extracted text file in Copilot
- [ ] Use prompt template
- [ ] Copilot generates JSON
- [ ] Save to `/scraped-output/parsed-json/llm-results/`
- [ ] Repeat for each plant (or batch process)

### 6.3 Create Validation Script
- [ ] Create `validateParsedData.kt` script
- [ ] Check JSON structure
- [ ] Validate plant names exist
- [ ] Check for duplicates
- [ ] Generate validation report

---

## Phase 7: Data Aggregation & Normalization

### 7.1 Create Plant Name Matching Service
- [ ] Build canonical plant names list
- [ ] Implement fuzzy matching (Levenshtein distance)
- [ ] Map variations to canonical names:
  - [ ] "tomato" → "Tomatoes"
  - [ ] "basil plant" → "Basil"
  - [ ] "hot pepper" → "Peppers"
- [ ] Create manual override file for ambiguous cases

### 7.2 Merge Parsed Data into Database
- [ ] Create `DataIngestionService.kt`
- [ ] Read all JSON files from `parsed-json/`
- [ ] Normalize plant names
- [ ] Insert into database tables:
  - [ ] `plants`
  - [ ] `companion_relationships`
  - [ ] `growing_guides`
- [ ] Handle duplicates (merge or skip)
- [ ] Track data source (scraped vs manual)

### 7.3 Create Data Quality Reports
- [ ] Plants with complete data
- [ ] Plants missing companion info
- [ ] Plants with conflicts (multiple sources disagree)
- [ ] Confidence score distribution

---

## Phase 8: Orchestration & Batch Processing

### 8.1 Create Scraping Orchestrator
- [ ] Create `ScrapingOrchestrator.kt`
- [ ] Method: `scrapeAllPlants()`
- [ ] Method: `scrapePlant(slug: String)`
- [ ] Progress tracking and logging
- [ ] Error handling and recovery
- [ ] Generate summary report

### 8.2 Create Admin Endpoints
- [ ] Create `ScrapingController.kt`
- [ ] `POST /api/admin/scraping/start` - Start scraping
- [ ] `GET /api/admin/scraping/status` - Get scraping status
- [ ] `POST /api/admin/scraping/scrape-single/{slug}` - Scrape specific plant
- [ ] `GET /api/admin/scraping/report` - Get scraping report

### 8.3 Create CLI Commands (Optional)
- [ ] `scrape:all` - Scrape all plants
- [ ] `scrape:plant {slug}` - Scrape specific plant
- [ ] `scrape:analyze-dom {url}` - Analyze page structure
- [ ] `scrape:report` - Generate scraping report

---

## Phase 9: DOM Analyzer Implementation

### 9.1 Build Structure Analyzer
- [ ] Create `DOMAnalyzer.kt`
- [ ] Method: `analyzePageStructure(url: String)`
- [ ] Identify common patterns:
  - [ ] Headings (h1, h2, h3)
  - [ ] Sections (by id, class)
  - [ ] Lists (ul, ol)
  - [ ] Tables
- [ ] Generate suggested selectors

### 9.2 Create Analysis Report
- [ ] Output format: JSON or Markdown
- [ ] Include:
  - [ ] Page title
  - [ ] Main headings and their selectors
  - [ ] Identified sections
  - [ ] Potential companion planting sections
  - [ ] Suggested CSS selectors
- [ ] Save to `/docs/scraping/analysis-reports/`

### 9.3 Make Analyzer Interactive
- [ ] CLI or web endpoint
- [ ] Input: URL
- [ ] Output: Analysis report
- [ ] Copy-paste friendly selector suggestions

---

## Phase 10: Testing & Validation

### 10.1 Unit Tests
- [ ] Test rate limiter
- [ ] Test HTML extraction methods
- [ ] Test regex patterns
- [ ] Test plant name normalization
- [ ] Test file output

### 10.2 Integration Tests
- [ ] Test full scraping flow for 1 plant
- [ ] Test error handling (404, timeout, etc.)
- [ ] Test data ingestion pipeline

### 10.3 Manual Testing
- [ ] Scrape 5 test plants end-to-end
- [ ] Verify files created correctly
- [ ] Parse with Copilot
- [ ] Ingest into database
- [ ] Query API to verify data

---

## Phase 11: Expansion to Additional Sources

### 11.1 Document New Sites
- [ ] Create DOM structure docs for GrowVeg.com
- [ ] Create DOM structure docs for Johnny's Selected Seeds
- [ ] Create DOM structure docs for University extension sites

### 11.2 Create Additional Scrapers
- [ ] `GrowVegScraper.kt`
- [ ] `JohnnysSeedsScraper.kt`
- [ ] Follow same pattern as Almanac scraper

### 11.3 Multi-Source Merging
- [ ] Implement conflict resolution
- [ ] Prioritize sources (scientific > traditional > anecdotal)
- [ ] Flag disagreements for manual review

---

## Phase 12: Maintenance & Updates

### 12.1 Create Change Detection
- [ ] Store hash of raw HTML
- [ ] Detect when page structure changes
- [ ] Alert when scraping fails

### 12.2 Scheduled Re-Scraping
- [ ] Monthly refresh of all plants
- [ ] Compare new vs old data
- [ ] Update only if changed

### 12.3 Documentation
- [ ] Document scraper architecture
- [ ] Document LLM parsing workflow
- [ ] Create troubleshooting guide
- [ ] Document how to add new plants
- [ ] Document how to add new sources

---

## Progress Tracking

**Completed Phases:** 0/12  
**Overall Progress:** 0/150+ tasks

**Next Immediate Actions:**
1. Add JSoup dependency
2. Create directory structure
3. Manual DOM documentation for Almanac.com
