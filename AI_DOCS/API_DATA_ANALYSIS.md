# API Data Analysis - What Can We Get from Trefle and Perenual?

_Last Updated: 2025-11-04_

---

## TREFLE API Analysis

### What Trefle PROVIDES ✓

#### 1. Plant Family ✓ CRITICAL
```kotlin
family: String  // "Solanaceae", "Brassicaceae", "Fabaceae"
genus: String
```
- **Usage**: THE most critical field for crop rotation
- **Quality**: Scientifically accurate, verified taxonomy
- **Coverage**: All plants in Trefle database
- **Reliability**: ⭐⭐⭐⭐⭐ Excellent

#### 2. Nitrogen Fixation ✓ CRITICAL
```kotlin
specifications.nitrogenFixation: String
```
- **Values**: Likely "none", "low", "medium", "high"
- **Usage**: Identifies legumes and soil-improving plants
- **How to use**:
  ```kotlin
  fun isNitrogenFixer(trefle: TrefleMainSpecies): Boolean {
      // Method 1: Check family (most reliable)
      if (trefle.family == "Fabaceae") return true
      
      // Method 2: Check nitrogen_fixation field
      if (trefle.specifications?.nitrogenFixation != null && 
          trefle.specifications.nitrogenFixation != "none") {
          return true
      }
      
      return false
  }
  ```
- **Reliability**: ⭐⭐⭐⭐⭐ Excellent (especially for Fabaceae family)

#### 3. Soil Nutriments ✓ USEFUL (for deriving feeder type)
```kotlin
growth.soilNutriments: Int  // 1-10 scale
```
- **Meaning**: How much nutrients the plant NEEDS (not depletes)
- **Usage**: Derive feeder type from this + family knowledge
- **How to derive feeder_type**:
  ```kotlin
  fun deriveFeederType(trefle: TrefleMainSpecies): FeederType {
      // First: Check family (most reliable)
      val familyFeederType = when (trefle.family) {
          "Solanaceae" -> FeederType.HEAVY      // Tomato, Pepper, Eggplant
          "Brassicaceae" -> FeederType.HEAVY    // Cabbage, Broccoli, Kale
          "Cucurbitaceae" -> FeederType.HEAVY   // Squash, Cucumber, Melon
          "Fabaceae" -> FeederType.LIGHT        // Beans, Peas (nitrogen fixers)
          "Allium" -> FeederType.LIGHT          // Onion, Garlic, Leek
          "Apiaceae" -> FeederType.MODERATE     // Carrot, Celery, Parsnip
          "Asteraceae" -> FeederType.LIGHT      // Lettuce, Sunflower
          "Amaranthaceae" -> FeederType.MODERATE // Beet, Spinach, Chard
          else -> null
      }
      
      if (familyFeederType != null) return familyFeederType
      
      // Fall back to soil nutriments value
      val soilNutriments = trefle.growth?.soilNutriments ?: 5
      return when {
          soilNutriments >= 8 -> FeederType.HEAVY
          soilNutriments >= 5 -> FeederType.MODERATE
          else -> FeederType.LIGHT
      }
  }
  ```
- **Reliability**: ⭐⭐⭐⭐ Very Good (family lookup is most reliable)

#### 4. Root Depth ✓ USEFUL
```kotlin
growth.minimumRootDepth: TrefleMeasurement (cm)
```
- **How to categorize**:
  ```kotlin
  fun deriveRootDepth(trefle: TrefleMainSpecies): RootDepth {
      val rootDepthCm = trefle.growth?.minimumRootDepth?.cm
      
      return when {
          rootDepthCm == null -> RootDepth.MEDIUM // default
          rootDepthCm <= 30 -> RootDepth.SHALLOW   // 0-12 inches
          rootDepthCm <= 60 -> RootDepth.MEDIUM    // 12-24 inches
          else -> RootDepth.DEEP                   // 24+ inches
      }
  }
  ```
- **Reliability**: ⭐⭐⭐ Good (but scraped data may be more reliable for vegetables)

#### 5. Growth Cycle ✓ USEFUL
```kotlin
duration: String  // "annual", "perennial", "biennial"
```
- **Direct mapping**: to PlantCycle enum
- **Reliability**: ⭐⭐⭐⭐⭐ Excellent

#### 6. Other Useful Fields
```kotlin
growth.daysToHarvest: Int
growth.phMinimum: Double
growth.phMaximum: Double
growth.rowSpacing: TrefleMeasurement (cm)
growth.spread: TrefleMeasurement (cm)
specifications.averageHeight: TrefleHeight (cm)
specifications.maximumHeight: TrefleHeight (cm)
specifications.growthRate: String
growth.growthMonths: List<String>
growth.bloomMonths: List<String>
growth.fruitMonths: List<String>
```

### What Trefle Does NOT Provide ✗

1. ✗ **Feeder Type** (direct) - Must derive from family + soilNutriments
2. ✗ **Pest Information** - No pest data
3. ✗ **Disease Information** - No disease data
4. ✗ **Rotation Intervals** - No rotation guidance
5. ✗ **Predecessor/Successor Preferences** - No sequence recommendations
6. ✗ **Specific Nutrient Depletion** (N, P, K separately)
7. ✗ **Cover Crop Suitability**
8. ✗ **Allelopathic Effects**

---

## PERENUAL API Analysis

### Pest/Disease Endpoints - FREE TIER TEST RESULTS

#### Test 1: Disease List Endpoint ✗
```
GET https://perenual.com/api/pest-disease-list?key={API_KEY}&type=disease

Response:
{
  "data": [],
  "to": null,
  "per_page": 30,
  "current_page": 1,
  "from": null,
  "last_page": 1,
  "total": 0
}
```
**Result**: ✗ **EMPTY** - No disease data on free tier

#### Test 2: Pest List Endpoint ✗
```
GET https://perenual.com/api/pest-disease-list?key={API_KEY}&type=pest

Response:
{
  "data": [],
  "to": null,
  "per_page": 30,
  "current_page": 1,
  "from": null,
  "last_page": 1,
  "total": 0
}
```
**Result**: ✗ **EMPTY** - No pest data on free tier

#### Test 3: Disease Detail Endpoint ✗
```
GET https://perenual.com/api/pest-disease-details/1?key={API_KEY}

Response: HTML "Not Found" page
```
**Result**: ✗ **NOT ACCESSIBLE** on free tier

### Conclusion: Perenual Pest/Disease Data

**FREE TIER**: ✗✗✗ **NO PEST/DISEASE DATA AVAILABLE**

The pest and disease endpoints return empty arrays on the free tier. This data appears to be **premium-only**.

According to Perenual documentation, pest/disease data likely requires:
- **Premium Plan**: $XX/month
- **Professional Plan**: $XX/month

**Recommendation**: ❌ **Do NOT rely on Perenual for pest/disease data**

---

## Alternative Data Sources for Pests/Diseases

### 1. Scraped Almanac Data ✓ BEST OPTION
**Location**: `pestsAndDiseases` field in scraped JSON

**Example** (Tomatoes):
```
### Pests/Diseases
Tomato Problems If no flowers form, plants may not be getting enough sun or water...
Provide good air circulation in the garden to help prevent disease...
Common tomato pests include tomato hornworms, aphids, whiteflies...
Common diseases: Late blight, Early blight, Fusarium wilt, Verticillium wilt...
```

**Advantages**:
- ✓ Already have the data (76 plants)
- ✓ Comprehensive coverage
- ✓ Practical gardening focus
- ✓ FREE

**Disadvantages**:
- ✗ Raw text, needs parsing
- ✗ Not structured
- ✗ Requires NLP or manual extraction

**Action Required**: Build parser to extract:
```kotlin
data class PestDiseaseExtraction(
    val pests: List<String>,        // ["Tomato Hornworm", "Aphids", "Whiteflies"]
    val diseases: List<String>,     // ["Late Blight", "Fusarium Wilt"]
    val problems: List<String>,     // General issues
    val solutions: List<String>     // Prevention/treatment
)
```

### 2. University Extension Services ✓ EXCELLENT FREE RESOURCE
**Sources**:
- Cornell University Integrated Pest Management (IPM)
- UC Davis Agriculture and Natural Resources
- Penn State Extension
- Ohio State Extension

**Advantages**:
- ✓ Scientifically accurate
- ✓ FREE
- ✓ Comprehensive
- ✓ Includes soil-borne disease info
- ✓ Rotation recommendations

**Disadvantages**:
- ✗ Manual research required
- ✗ No structured API
- ✗ Time-consuming to compile

**Action**: Build reference database from extension guides

### 3. Manual Curation ✓ MOST RELIABLE
**Approach**: Create curated pest/disease database for major families

**Example Structure**:
```kotlin
// Hardcode well-known pest/disease patterns by family
val FAMILY_PEST_DISEASE_DATA = mapOf(
    "Solanaceae" to FamilyPestDiseaseInfo(
        commonPests = listOf(
            PestInfo("Tomato Hornworm", severity = HIGH, affectsFamily = true),
            PestInfo("Aphids", severity = MEDIUM, affectsFamily = true),
            PestInfo("Colorado Potato Beetle", severity = HIGH, affectsFamily = true)
        ),
        commonDiseases = listOf(
            DiseaseInfo(
                name = "Verticillium Wilt",
                soilBorne = true,
                persistenceYears = 3-4,
                severity = HIGH,
                affectsFamily = true
            ),
            DiseaseInfo(
                name = "Fusarium Wilt",
                soilBorne = true,
                persistenceYears = 5-7,
                severity = HIGH,
                affectsFamily = true
            ),
            DiseaseInfo(
                name = "Late Blight",
                soilBorne = false, // Airborne
                severity = CRITICAL,
                affectsFamily = true
            )
        ),
        rotationIntervalYears = 3-4
    ),
    "Brassicaceae" to FamilyPestDiseaseInfo(
        commonPests = listOf(
            PestInfo("Cabbage Worm", severity = HIGH),
            PestInfo("Flea Beetles", severity = MEDIUM),
            PestInfo("Aphids", severity = MEDIUM)
        ),
        commonDiseases = listOf(
            DiseaseInfo(
                name = "Clubroot",
                soilBorne = true,
                persistenceYears = 7-20, // Can persist for decades!
                severity = CRITICAL,
                affectsFamily = true
            ),
            DiseaseInfo(
                name = "Black Rot",
                soilBorne = true,
                persistenceYears = 2-3,
                severity = HIGH
            )
        ),
        rotationIntervalYears = 3-4
    )
    // ... etc for all major families
)
```

**Advantages**:
- ✓ Most reliable
- ✓ Can focus on critical soil-borne diseases
- ✓ Directly supports rotation planning
- ✓ One-time effort for major families

**Disadvantages**:
- ✗ Manual work
- ✗ Limited to major families initially

---

## Recommended Data Strategy

### Phase 1: Use Trefle for Taxonomy ✓
```kotlin
// Import from Trefle:
plant.family = trefle.family
plant.genus = trefle.genus
plantAttributes.isNitrogenFixer = deriveNitrogenFixer(trefle)
plantAttributes.feederType = deriveFeederType(trefle)
plantAttributes.rootDepth = deriveRootDepth(trefle)
```

### Phase 2: Parse Scraped Data for Pests/Diseases 📋
```kotlin
// Build parser for scraped pestsAndDiseases text
fun parseP

estsAndDiseases(scrapedData: ScrapedPlantData): PestDiseaseData {
    val text = scrapedData.pestsAndDiseases ?: return PestDiseaseData.empty()
    
    // Extract with regex or NLP
    val pests = extractPests(text)
    val diseases = extractDiseases(text)
    
    return PestDiseaseData(pests, diseases)
}
```

### Phase 3: Add Manual Pest/Disease Database 📋
```kotlin
// Curate critical soil-borne diseases by family
// Focus on the TOP 8 families first:
1. Solanaceae (Nightshades)
2. Brassicaceae (Crucifers)
3. Fabaceae (Legumes)
4. Cucurbitaceae (Cucurbits)
5. Apiaceae (Umbellifers)
6. Amaranthaceae (Beet family)
7. Asteraceae (Composites)
8. Allium (Onion family)
```

### Phase 4: Build Rotation Rules Database 📋
```kotlin
// Hardcode rotation intervals by family
val ROTATION_RULES = mapOf(
    "Solanaceae" to RotationRule(minYears = 3, optimalYears = 4),
    "Brassicaceae" to RotationRule(minYears = 3, optimalYears = 4),
    "Fabaceae" to RotationRule(minYears = 2, optimalYears = 3),
    // etc...
)
```

---

## Summary: What We Can Get

### From Trefle API: ✓✓✓
1. ✓ Plant family (CRITICAL)
2. ✓ Nitrogen fixation (CRITICAL)
3. ✓ Soil nutriments → derive feeder type (CRITICAL)
4. ✓ Root depth (USEFUL)
5. ✓ Growth cycle (USEFUL)
6. ✓ pH, spacing, timing data (USEFUL)

### From Perenual API: ✗✗✗
- ✗ **NO pest/disease data on free tier**
- ✗ Empty responses for pest-disease-list endpoints
- ✗ Not accessible on free tier

### From Scraped Almanac Data: ✓✓✓
1. ✓ Pest/disease information (raw text, needs parsing)
2. ✓ 76 plants with comprehensive care info
3. ✓ Practical gardening focus
4. ✓ FREE and already collected

### Recommended Approach:
1. **Use Trefle** for: family, genus, nitrogen fixation
2. **Derive from Trefle** feeder type (family + soilNutriments)
3. **Parse scraped data** for pests/diseases (MVP: use raw text in notes)
4. **Manually curate** critical rotation rules for 8 major families
5. **Build iteratively**: Start with family-based rotation, add details later

---

## Implementation Code Snippets

### Derive Feeder Type from Trefle
```kotlin
object FeederTypeDeriver {
    private val FAMILY_FEEDER_TYPES = mapOf(
        "Solanaceae" to FeederType.HEAVY,
        "Brassicaceae" to FeederType.HEAVY,
        "Cucurbitaceae" to FeederType.HEAVY,
        "Fabaceae" to FeederType.LIGHT,
        "Allium" to FeederType.LIGHT,
        "Apiaceae" to FeederType.MODERATE,
        "Asteraceae" to FeederType.LIGHT,
        "Amaranthaceae" to FeederType.MODERATE
    )
    
    fun derive(trefleData: TrefleMainSpecies): FeederType {
        // 1. Check family lookup (most reliable)
        FAMILY_FEEDER_TYPES[trefleData.family]?.let { return it }
        
        // 2. Fall back to soilNutriments
        val soilNutriments = trefleData.growth?.soilNutriments ?: 5
        return when {
            soilNutriments >= 8 -> FeederType.HEAVY
            soilNutriments >= 5 -> FeederType.MODERATE
            else -> FeederType.LIGHT
        }
    }
}
```

### Identify Nitrogen Fixers
```kotlin
object NitrogenFixerIdentifier {
    private val NITROGEN_FIXING_FAMILIES = setOf("Fabaceae")
    
    fun isNitrogenFixer(trefleData: TrefleMainSpecies): Boolean {
        // 1. Check family
        if (trefleData.family in NITROGEN_FIXING_FAMILIES) return true
        
        // 2. Check nitrogen_fixation field
        val nitrogenFixation = trefleData.specifications?.nitrogenFixation
        return nitrogenFixation != null && 
               nitrogenFixation.lowercase() !in setOf("none", "no", "false")
    }
}
```

### Rotation Rules (Hardcoded)
```kotlin
data class RotationRule(
    val family: String,
    val minRotationYears: Int,
    val optimalRotationYears: Int,
    val criticalDiseases: List<String> = emptyList()
)

object RotationRules {
    val RULES = mapOf(
        "Solanaceae" to RotationRule(
            family = "Solanaceae",
            minRotationYears = 3,
            optimalRotationYears = 4,
            criticalDiseases = listOf("Verticillium Wilt", "Fusarium Wilt", "Late Blight")
        ),
        "Brassicaceae" to RotationRule(
            family = "Brassicaceae",
            minRotationYears = 3,
            optimalRotationYears = 4,
            criticalDiseases = listOf("Clubroot", "Black Rot")
        ),
        "Fabaceae" to RotationRule(
            family = "Fabaceae",
            minRotationYears = 2,
            optimalRotationYears = 3,
            criticalDiseases = listOf("Root Rot", "White Mold")
        ),
        "Cucurbitaceae" to RotationRule(
            family = "Cucurbitaceae",
            minRotationYears = 2,
            optimalRotationYears = 3,
            criticalDiseases = listOf("Powdery Mildew", "Fusarium Wilt")
        ),
        "Apiaceae" to RotationRule(
            family = "Apiaceae",
            minRotationYears = 2,
            optimalRotationYears = 3,
            criticalDiseases = emptyList()
        ),
        "Amaranthaceae" to RotationRule(
            family = "Amaranthaceae",
            minRotationYears = 2,
            optimalRotationYears = 3,
            criticalDiseases = emptyList()
        ),
        "Asteraceae" to RotationRule(
            family = "Asteraceae",
            minRotationYears = 2,
            optimalRotationYears = 2,
            criticalDiseases = emptyList()
        ),
        "Allium" to RotationRule(
            family = "Allium",
            minRotationYears = 2,
            optimalRotationYears = 3,
            criticalDiseases = listOf("White Rot")
        )
    )
    
    fun getRotationInterval(family: String): Int {
        return RULES[family]?.minRotationYears ?: 2 // default
    }
}
```

---

## Conclusion

**Trefle**: ✓ Excellent for taxonomy and botanical data  
**Perenual**: ✗ No pest/disease data on free tier - don't use  
**Scraped Data**: ✓✓✓ Best source for practical pest/disease info (needs parsing)  
**Manual Curation**: ✓✓✓ Essential for rotation rules and critical diseases

**Recommendation**: Build rotation planner using Trefle family data + hardcoded rotation rules + scraped pest/disease text
