# Plant Information View - Feature Specification

## Overview
Create a comprehensive plant information system that provides users with detailed growing guides, care instructions, and aggregated data about each plant variety. This feature transforms the app from a simple tracking tool into an educational resource that helps users succeed in growing their crops.

---

## Vision

Users can:
1. Browse a library of plants (vegetables, herbs, flowers)
2. View detailed information about each plant (growing guides, care tips, varieties)
3. See their own historical data with that plant (success rate, yield averages)
4. Learn from community data (what grows well in similar climates)
5. Get AI-powered recommendations based on their location, season, and garden conditions

This builds upon the **plant-data-aggregator** service, which will collect and structure plant information from various sources.

---

## User Stories

### Discovery & Learning
- As a user, I want to browse all available plants so I can discover new crops to grow
- As a user, I want to search for plants by name or category so I can find specific information
- As a user, I want to see detailed growing guides so I know how to care for my plants
- As a user, I want to see photos of plants at different growth stages so I can identify problems

### Personal Insights
- As a user, I want to see my historical performance with each plant so I can learn from past results
- As a user, I want to know which plants succeed in my garden so I can focus on winners
- As a user, I want to see my average yield for each plant so I can plan quantities

### Planning & Recommendations
- As a user, I want plant recommendations based on my location and season
- As a user, I want to know companion plants for better yields
- As a user, I want to know which plants to avoid planting together
- As a user, I want suggestions for succession planting

---

## Plant Information View Structure

### Route: `/plants/[plantId]`

### Main Sections

#### 1. Plant Header
**Displays:**
- Plant name (common name)
- Scientific name (italic)
- Plant type badge (ROOT_VEGETABLE, LEAFY_GREEN, etc.)
- Plant family (for crop rotation)
- Hero image (high-quality photo)
- Rating/difficulty indicator (1-5 stars)
- "Add to My Garden" quick action button

**Example:**
```
╔════════════════════════════════════════════════════════╗
║  🍅 Tomato (Solanum lycopersicum)                     ║
║  [FRUIT_VEGETABLE]  [Solanaceae Family]              ║
║  ⭐⭐⭐⭐☆ Intermediate                                ║
║  [📷 Beautiful tomato plant photo]                    ║
║  [+ Add to My Garden]  [♥ Save to Favorites]          ║
╚════════════════════════════════════════════════════════╝
```

---

#### 2. Quick Facts Card
**Displays:**
- Growing season: Spring, Summer, Autumn, Winter
- Days to maturity: 70-80 days
- Hardiness zones: 3-10
- Sun requirements: Full Sun (6-8 hours)
- Water requirements: Moderate
- Spacing: 60 cm between plants
- Soil pH: 6.0-6.8
- Plant height: 1-2 meters
- Plant spread: 60-90 cm

**Visual:** 
- Icon-based grid layout
- Color-coded difficulty indicators
- Quick scan format

---

#### 3. Growing Guide (Tabbed Content)

##### Tab 1: Overview
**Content:**
- Description of the plant
- Origin and history
- Common varieties
- Why grow this plant (benefits, uses)
- Difficulty level explanation

##### Tab 2: Planting Guide
**Step-by-step instructions:**
1. **When to Plant**
   - Indoor seed starting: X weeks before last frost
   - Direct sowing: After last frost date
   - Succession planting: Every 2-3 weeks
   
2. **Soil Preparation**
   - Soil type preferences
   - pH requirements
   - Amendments needed (compost, fertilizer)
   - Drainage requirements

3. **Planting Technique**
   - Seed depth
   - Spacing between plants
   - Spacing between rows
   - Companion planting suggestions
   - Plants to avoid nearby

4. **Transplanting**
   - When to transplant
   - Hardening off process
   - Transplant spacing

##### Tab 3: Care & Maintenance
**Instructions:**
- **Watering Schedule**
  - Frequency
  - Amount
  - Signs of over/under watering
  
- **Fertilization**
  - Type of fertilizer
  - Application frequency
  - NPK ratio recommendations
  
- **Pruning/Training**
  - When to prune
  - How to prune
  - Staking/support requirements
  
- **Pest & Disease Management**
  - Common pests (with photos)
  - Common diseases (with photos)
  - Organic control methods
  - Prevention strategies

##### Tab 4: Harvesting
**Instructions:**
- Signs of readiness
- How to harvest (technique)
- Best time of day to harvest
- Harvest frequency (once, continuous, etc.)
- Expected yield per plant
- Post-harvest handling
- Storage tips

##### Tab 5: Varieties
**List of varieties:**
- Variety name
- Description
- Days to maturity
- Special characteristics
- Best uses (fresh eating, canning, cooking)
- Where to buy seeds

**Example Varieties for Tomato:**
- Cherokee Purple (heirloom, 80 days, excellent flavor)
- Roma (paste tomato, 75 days, good for sauce)
- Cherry Tomato (60 days, prolific, great for snacking)

##### Tab 6: Companion Planting
**Visual companion planting chart:**
- ✅ Good Companions (with reasons)
  - Basil → Improves flavor, repels aphids
  - Marigolds → Repels nematodes
  - Carrots → Don't compete for space
  
- ❌ Bad Companions (with reasons)
  - Brassicas → Compete for nutrients
  - Fennel → Allelopathic effect
  - Potatoes → Same family, disease risk

---

#### 4. Your Growing History (Personalized Data)

**Only visible if user has grown this plant before**

**Displays:**
- Total times planted: 15
- Total harvests: 12
- Success rate: 80%
- Average yield: 2.5 kg per plant
- Average days to harvest: 75 days (vs expected 70-80)
- Last grown: 3 months ago in Box 1
- Best outcome: EXCELLENT (Box 3, Summer 2024)
- Worst outcome: FAILED (Box 5, Spring 2023)

**Charts:**
- Yield over time (line chart)
- Success rate by season
- Performance by grow area (which boxes work best)

**Notes from Past Crops:**
- Displays user's own notes from previous crops
- "Struggled with aphids" - Box 5, Spring 2023
- "Excellent yield, planted with basil" - Box 3, Summer 2024

**Call to Action:**
- "Plant Again" button → Quick add to current garden

---

#### 5. Community Insights (Aggregated Data)

**Community Statistics:**
- Times grown by users: 1,245
- Average success rate: 85%
- Most common grow zone: Zone 7
- Most popular variety: Cherokee Purple
- Peak planting months: March-April, June-July

**Tips from Community:**
- Top-rated user tips (voted by community)
- Common problems and solutions
- Regional variations in growing success

**Note:** This requires user data aggregation with privacy protections (anonymized, opt-in)

---

#### 6. Recipes & Uses (Future Enhancement)

**Content:**
- Culinary uses
- Recipe ideas
- Preservation methods (canning, freezing, drying)
- Medicinal uses (if applicable)
- Links to recipe websites/blogs

---

#### 7. Related Resources

**Links to:**
- Extension office guides
- YouTube videos (growing guides)
- Seed suppliers
- Related plants (other varieties, similar plants)

**Embedded Content:**
- YouTube video embed for growing guide
- External article snippets

---

## Plant Browse & Search

### Route: `/plants`

### Layout

**Browse Page:**
- Grid of plant cards
- Filters sidebar:
  - Plant type (multi-select)
  - Growing season
  - Difficulty level
  - Sun requirements
  - Plant family
  - "Plants I've grown" checkbox
  - "Plants I've never grown" checkbox
  
- Sort options:
  - Alphabetical
  - Popularity (most grown)
  - Difficulty (easy → hard)
  - Days to maturity (fast → slow)
  - My success rate (for plants user has grown)

**Plant Card (in grid):**
- Photo thumbnail
- Plant name
- Plant type badge
- Difficulty stars
- Days to maturity
- Personal stats badge (if grown before):
  - "You've grown this 5 times"
  - "80% success rate"

**Search Bar:**
- Autocomplete search
- Search by common name, scientific name, or plant type
- "Did you mean...?" suggestions for typos

---

### Personalization Features

**Recommendations Section:**
- "Based on your location (Zone 7)"
- "Perfect for planting now (October)"
- "Similar to plants you've grown successfully"
- "Fill gaps in your garden (you haven't grown any root vegetables)"

**Your Plant Library:**
- Separate section showing plants user has grown
- Sort by success rate, total yield, times grown
- Quick access to familiar plants

---

## Backend Requirements (plant-data-aggregator)

The **plant-data-aggregator** service is responsible for collecting, enriching, and maintaining plant data from various sources.

### Data Sources to Aggregate

1. **USDA Plants Database**
   - Scientific names
   - Plant families
   - Native ranges
   - Hardiness zones

2. **Open Food Facts API**
   - Nutritional information (future)

3. **Growstuff API** (community gardening platform)
   - Growing guides
   - User experiences

4. **Wikipedia/Wikidata**
   - General information
   - Images
   - Taxonomy

5. **Extension Office Publications**
   - Growing guides by region
   - Pest/disease information

6. **Seed Company Data (scraped)**
   - Varieties
   - Days to maturity
   - Growing tips

7. **Manual Curation**
   - Expert-written guides
   - Curated photos
   - Tested growing instructions

---

### Plant Data Structure (Enhanced)

**plants table (current fields):**
- id
- name
- scientificName
- plantType
- maturityTime
- growingSeason
- sunReq
- waterReq
- soilType
- spaceReq

**Proposed additions:**

**plant_details table:**
```sql
CREATE TABLE plant_details (
  plant_id BIGINT PRIMARY KEY REFERENCES plants(id),
  family VARCHAR(100),  -- Plant family (Solanaceae, etc.)
  origin VARCHAR(255),  -- Geographic origin
  description TEXT,  -- Full description
  difficulty_level VARCHAR(50),  -- EASY, INTERMEDIATE, HARD
  hardiness_zones VARCHAR(50),  -- e.g., "3-10"
  height_cm_min INTEGER,
  height_cm_max INTEGER,
  spread_cm_min INTEGER,
  spread_cm_max INTEGER,
  soil_ph_min DECIMAL(3,1),
  soil_ph_max DECIMAL(3,1),
  seed_depth_cm DECIMAL(4,1),
  spacing_cm INTEGER,
  row_spacing_cm INTEGER,
  transplant_weeks_before_frost INTEGER,
  direct_sow_after_frost BOOLEAN,
  days_to_germination_min INTEGER,
  days_to_germination_max INTEGER,
  expected_yield VARCHAR(100),  -- e.g., "2-5 kg per plant"
  storage_tips TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**plant_care_guides table:**
```sql
CREATE TABLE plant_care_guides (
  id BIGINT PRIMARY KEY,
  plant_id BIGINT REFERENCES plants(id),
  guide_type VARCHAR(50),  -- PLANTING, CARE, HARVESTING, PEST_CONTROL
  title VARCHAR(255),
  content TEXT,  -- Markdown formatted
  step_order INTEGER,
  author_id UUID,  -- NULL for system guides
  source_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**plant_varieties table:**
```sql
CREATE TABLE plant_varieties (
  id BIGINT PRIMARY KEY,
  plant_id BIGINT REFERENCES plants(id),
  variety_name VARCHAR(255),
  description TEXT,
  days_to_maturity INTEGER,
  characteristics TEXT,  -- JSON array of characteristics
  is_heirloom BOOLEAN,
  is_hybrid BOOLEAN,
  best_uses VARCHAR(255),  -- "Fresh eating, canning"
  seed_sources TEXT,  -- JSON array of supplier links
  created_at TIMESTAMP DEFAULT NOW()
);
```

**plant_companions table:**
```sql
CREATE TABLE plant_companions (
  plant_id BIGINT REFERENCES plants(id),
  companion_plant_id BIGINT REFERENCES plants(id),
  relationship VARCHAR(50),  -- BENEFICIAL, HARMFUL, NEUTRAL
  reason TEXT,
  PRIMARY KEY (plant_id, companion_plant_id)
);
```

**plant_images table:**
```sql
CREATE TABLE plant_images (
  id BIGINT PRIMARY KEY,
  plant_id BIGINT REFERENCES plants(id),
  image_url VARCHAR(500),
  image_type VARCHAR(50),  -- HERO, SEEDLING, MATURE, HARVEST, FLOWER, PEST, DISEASE
  caption TEXT,
  source_attribution VARCHAR(255),
  is_primary BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**plant_resources table:**
```sql
CREATE TABLE plant_resources (
  id BIGINT PRIMARY KEY,
  plant_id BIGINT REFERENCES plants(id),
  resource_type VARCHAR(50),  -- VIDEO, ARTICLE, EXTENSION_GUIDE
  title VARCHAR(255),
  url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### API Endpoints (gardentime backend)

**GET /api/plants**
- List all plants (existing)
- Add query params: `type`, `difficulty`, `season`, `search`

**GET /api/plants/{plantId}**
- Get basic plant info (existing)

**GET /api/plants/{plantId}/full**
- NEW: Get complete plant information
- Includes: details, care guides, varieties, companions, images, resources
- Returns comprehensive JSON object

**GET /api/plants/{plantId}/my-history**
- NEW: Get user's historical data with this plant
- Requires authentication
- Returns: stats, yield data, past crop records

**GET /api/plants/{plantId}/community-stats**
- NEW: Get aggregated community data (anonymized)
- Returns: success rates, popular varieties, common issues

**GET /api/plants/recommendations**
- NEW: Get personalized plant recommendations
- Based on: user's location, season, past success, gaps in planting

---

### plant-data-aggregator Service Tasks

**High Priority:**
1. **Data Collection Scripts**
   - USDA API integration
   - Wikipedia/Wikidata scraping
   - Manual entry interface for curators

2. **Data Enrichment Pipeline**
   - Normalize plant names (common name → scientific name matching)
   - Image processing (resize, optimize)
   - Content formatting (convert to Markdown)

3. **Data Quality**
   - Deduplication
   - Validation rules
   - Conflict resolution (when sources disagree)

4. **Content Management**
   - Admin UI for adding/editing plants
   - Bulk import from CSV
   - Review and approval workflow

**Medium Priority:**
5. **Image Library**
   - Stock photo integration (Unsplash, Pixabay)
   - User-submitted photos (with moderation)
   - AI-generated tags for images

6. **Regional Customization**
   - Growing guides by USDA zone
   - Planting calendars by region
   - Frost date integration

**Low Priority:**
7. **Community Contributions**
   - User-submitted tips
   - Voting system for best tips
   - Moderation interface

8. **AI Integration**
   - ChatGPT integration for answering plant questions
   - Image recognition for pest/disease identification

---

## Frontend Implementation Plan

### Phase 1: Basic Plant View (2-3 days)
- Create `/plants/[plantId]` route
- Build plant header component
- Build quick facts card
- Build growing guide tabs (static content)
- Fetch data from existing `/api/plants/{id}` endpoint

### Phase 2: Enhanced Data (3-4 days)
- Extend backend with new tables and data
- Build plant varieties section
- Build companion planting chart
- Add images carousel
- Integrate new API endpoints

### Phase 3: Personal History (2 days)
- Build "Your Growing History" section
- Create yield charts
- Display personal notes
- Add "Plant Again" quick action

### Phase 4: Browse & Search (2-3 days)
- Create `/plants` browse page
- Build filter sidebar
- Build plant cards grid
- Implement search with autocomplete
- Add sort options

### Phase 5: Recommendations (2 days)
- Build recommendation algorithm (backend)
- Create recommendations section
- Implement location-based filtering
- Add seasonal recommendations

### Phase 6: Community Features (future)
- Community statistics
- User-submitted tips
- Photo gallery
- Recipe integration

---

## Design Mockups (Descriptions)

### Plant Detail Page Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Search: [________]  [My Gardens] [Profile]         │ ← Header
├─────────────────────────────────────────────────────────────┤
│ ← Back to Plants                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🍅 Tomato (Solanum lycopersicum)                        ││
│ │ [FRUIT_VEGETABLE] [Solanaceae]  ⭐⭐⭐⭐☆              ││
│ │ [────── Hero Image ──────]                               ││
│ │ [+ Add to Garden]  [♥ Save]                              ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌──────────────┐ ┌─────────────────────────────────────────┐
│ │ Quick Facts  │ │ Growing Guide Tabs                      │
│ │              │ │ [Overview] [Plant] [Care] [Harvest]...  │
│ │ 🌞 Full Sun  │ │                                          │
│ │ 💧 Moderate  │ │ Step-by-step planting instructions...   │
│ │ ⏱ 70-80 days│ │                                          │
│ │ 📏 60cm gap  │ │ [Images and diagrams]                    │
│ │              │ │                                          │
│ └──────────────┘ └─────────────────────────────────────────┘
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Your Growing History                                     ││
│ │ Times planted: 15  Success: 80%  Avg yield: 2.5kg       ││
│ │ [Chart showing yield over time]                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Companion Planting                                       ││
│ │ ✅ Good: Basil, Marigold, Carrots                       ││
│ │ ❌ Avoid: Brassicas, Fennel, Potatoes                   ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Content Creation Strategy

### Seed Data (Immediate)
- 20 most common vegetables (tomato, lettuce, carrot, etc.)
- 10 popular herbs (basil, parsley, cilantro, etc.)
- Basic information only (existing fields + short description)

### Phase 1 Expansion (1-2 months)
- 100 vegetables and herbs
- Full growing guides for top 50
- Variety information for top 20
- Companion planting data for top 30

### Phase 2 Expansion (3-6 months)
- 300+ plants
- Regional customization
- Complete care guides
- Extensive photo library

### Ongoing Maintenance
- Seasonal updates
- New varieties added
- User feedback incorporation
- Content improvements

---

## Success Metrics

### User Engagement
- % of users who visit plant pages
- Average time on plant pages
- Bounce rate
- "Add to Garden" click rate

### Educational Impact
- Survey: "Did you learn something new?"
- Correlation: Better success rates after reading guides?
- Feature requests for more content

### Content Quality
- % of plants with complete information
- Image coverage
- User ratings of guides
- Expert review scores

---

## Open Questions

1. **User-Generated Content:** Allow users to submit tips, photos, or guides?
   - Recommendation: Yes, but with moderation. Start with tips only.

2. **Localization:** Support multiple languages for plant information?
   - Recommendation: Not initially. English only, add i18n later if needed.

3. **Mobile App:** Build native plant ID feature using camera?
   - Recommendation: Future enhancement. Web-only for now.

4. **Seed Suppliers:** Integrate with seed companies for direct purchase links (affiliate program)?
   - Recommendation: Yes, but only reputable suppliers. Add affiliate links for monetization.

5. **AI Chat:** Add a plant care chatbot to answer specific questions?
   - Recommendation: Great idea for Phase 3. Use OpenAI API with RAG on plant data.

6. **Offline Access:** Allow downloading plant guides for offline use (PWA)?
   - Recommendation: Yes, good for gardeners without internet in garden areas.

---

## Related Features

This plant information system enables:
- Better crop recommendations (Step 41-44: Crop Rotation Intelligence)
- Plant-specific alerts and reminders (Step 85: Notifications)
- Yield prediction and planning (Step 91: Yield Analytics)
- Personalized planting calendar (Step 86: Calendar Integration)

It's a foundational feature that makes GardenTime more than just a tracker - it becomes an educational platform and decision-support system.
