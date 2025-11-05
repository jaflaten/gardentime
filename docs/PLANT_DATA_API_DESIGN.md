# Plant Data API Design for Crop Rotation Planning

**Version:** 1.0  
**Date:** 2025-11-05  
**Purpose:** Provide comprehensive plant data for intelligent crop rotation planning in GardenTime

---

## API Design Philosophy

The Plant Data API will serve as the **authoritative source** for all plant-related information needed for:
1. **Crop rotation validation** (family-based rotation rules)
2. **Companion planting suggestions** (beneficial/unfavorable relationships)
3. **Seasonal planning** (planting dates, maturity times, climate requirements)
4. **Pest & disease management** (preventive rotation strategies)
5. **Nutrient planning** (heavy feeders, nitrogen fixers, soil health)

---

## Base URL Structure

```
/api/v1/plant-data/...
```

Using versioning for API stability as the plant database evolves.

---

## Core Endpoints

### 1. Plant Information

#### GET `/api/v1/plant-data/plants`
**Purpose:** List all available plants with filtering

**Query Parameters:**
- `family` - Filter by botanical family (e.g., "Solanaceae")
- `feederType` - Filter by nutrient needs (HEAVY, MODERATE, LIGHT, NITROGEN_FIXER)
- `cycle` - Filter by lifecycle (ANNUAL, PERENNIAL, BIENNIAL)
- `sunNeeds` - Filter by sun requirements (FULL_SUN, PART_SHADE, SHADE)
- `frostTolerant` - Boolean filter for frost tolerance
- `containerSuitable` - Boolean filter for container growing
- `search` - Text search in name, scientific name, common name
- `page` - Pagination page number (default: 0)
- `size` - Results per page (default: 50)

**Response:**
```json
{
  "plants": [
    {
      "id": 73,
      "name": "Tomato",
      "slug": "tomatoes",
      "scientificName": "Solanum lycopersicum",
      "family": {
        "id": 1,
        "name": "Solanaceae",
        "commonName": "Nightshade family",
        "rotationYearsMin": 3,
        "rotationYearsMax": 4
      },
      "genus": "Solanum",
      "cycle": "ANNUAL",
      "sunNeeds": "FULL_SUN",
      "waterNeeds": "FREQUENT",
      "rootDepth": "DEEP",
      "growthHabit": "FRUITING",
      "feederType": "HEAVY",
      "isNitrogenFixer": false,
      "frostTolerant": false,
      "containerSuitable": true,
      "edibleParts": ["fruit"],
      "spacing": {
        "minInches": 24,
        "maxInches": 36
      },
      "maturity": {
        "minDays": null,
        "maxDays": null
      }
    }
  ],
  "pagination": {
    "page": 0,
    "size": 50,
    "totalElements": 76,
    "totalPages": 2
  }
}
```

#### GET `/api/v1/plant-data/plants/{slug}`
**Purpose:** Get detailed information for a specific plant

**Path Parameters:**
- `slug` - URL-friendly plant identifier (e.g., "tomatoes", "carrots")

**Response:**
```json
{
  "id": 73,
  "name": "Tomato",
  "slug": "tomatoes",
  "scientificName": "Solanum lycopersicum",
  "family": {
    "id": 1,
    "name": "Solanaceae",
    "commonName": "Nightshade family",
    "rotationYearsMin": 3,
    "rotationYearsMax": 4,
    "description": "Tomatoes, peppers, potatoes, eggplants. Prone to similar diseases."
  },
  "genus": "Solanum",
  "cycle": "ANNUAL",
  "growthRequirements": {
    "sunNeeds": "FULL_SUN",
    "waterNeeds": "FREQUENT",
    "wateringInchesPerWeek": 2.0,
    "soilTempMinF": 55,
    "soilTempOptimalF": 70,
    "soilPhMin": null,
    "soilPhMax": null
  },
  "plantingDetails": {
    "rootDepth": "DEEP",
    "growthHabit": "FRUITING",
    "spacingMinInches": 24,
    "spacingMaxInches": 36,
    "plantingDepthInches": 0.5,
    "frostTolerant": false,
    "containerSuitable": true
  },
  "careRequirements": {
    "requiresStaking": true,
    "requiresPruning": true,
    "fertilizingFrequencyWeeks": 2,
    "mulchRecommended": true
  },
  "harvest": {
    "daysToMaturityMin": null,
    "daysToMaturityMax": null,
    "edibleParts": ["fruit"]
  },
  "rotationData": {
    "feederType": "HEAVY",
    "isNitrogenFixer": false,
    "familyRotationYears": 3
  },
  "notes": "Heat-loving. Needs full sun 8-10 hours. Deep watering promotes strong roots. Vining types need staking and sucker removal.",
  "companionCount": {
    "beneficial": 9,
    "unfavorable": 6,
    "neutral": 42
  },
  "pestCount": 8,
  "diseaseCount": 17
}
```

---

### 2. Plant Families (for Rotation Planning)

#### GET `/api/v1/plant-data/families`
**Purpose:** List all plant families with rotation information

**Response:**
```json
{
  "families": [
    {
      "id": 1,
      "name": "Solanaceae",
      "commonName": "Nightshade family",
      "rotationYearsMin": 3,
      "rotationYearsMax": 4,
      "description": "Tomatoes, peppers, potatoes, eggplants. Prone to similar diseases like blight and wilt.",
      "plantCount": 6,
      "examplePlants": ["Tomato", "Pepper", "Eggplant", "Potato"]
    },
    {
      "id": 2,
      "name": "Brassicaceae",
      "commonName": "Cabbage family",
      "rotationYearsMin": 3,
      "rotationYearsMax": 4,
      "description": "Cabbage, broccoli, kale, radish. Susceptible to clubroot which persists 7-20 years.",
      "plantCount": 14,
      "examplePlants": ["Cabbage", "Broccoli", "Kale", "Cauliflower"]
    }
  ]
}
```

#### GET `/api/v1/plant-data/families/{familyName}/plants`
**Purpose:** Get all plants in a specific family

**Path Parameters:**
- `familyName` - Botanical family name (e.g., "Solanaceae")

**Response:**
```json
{
  "family": {
    "name": "Solanaceae",
    "commonName": "Nightshade family",
    "rotationYearsMin": 3,
    "rotationYearsMax": 4
  },
  "plants": [
    {
      "id": 73,
      "name": "Tomato",
      "slug": "tomatoes",
      "feederType": "HEAVY",
      "cycle": "ANNUAL"
    },
    {
      "id": 55,
      "name": "Pepper",
      "slug": "peppers",
      "feederType": "HEAVY",
      "cycle": "ANNUAL"
    }
  ]
}
```

---

### 3. Companion Planting

#### GET `/api/v1/plant-data/plants/{slug}/companions`
**Purpose:** Get companion planting information for a plant

**Path Parameters:**
- `slug` - Plant slug

**Query Parameters:**
- `relationship` - Filter by type (BENEFICIAL, UNFAVORABLE, NEUTRAL)

**Response:**
```json
{
  "plant": {
    "id": 73,
    "name": "Tomato",
    "slug": "tomatoes"
  },
  "companions": {
    "beneficial": [
      {
        "id": 3,
        "name": "Basil",
        "slug": "basil",
        "reason": "Repels aphids and flies, improves tomato flavor"
      },
      {
        "id": 15,
        "name": "Carrot",
        "slug": "carrots",
        "reason": "Helps aerate soil for tomato roots"
      }
    ],
    "unfavorable": [
      {
        "id": 13,
        "name": "Cabbage",
        "slug": "cabbage",
        "reason": "Competes for nutrients, inhibits growth"
      },
      {
        "id": 56,
        "name": "Potato",
        "slug": "potatoes",
        "reason": "Both are nightshades, spread same diseases"
      }
    ],
    "neutral": [
      {
        "id": 8,
        "name": "Bean",
        "slug": "beans"
      }
    ]
  },
  "summary": {
    "beneficialCount": 9,
    "unfavorableCount": 6,
    "neutralCount": 42
  }
}
```

#### POST `/api/v1/plant-data/companions/check`
**Purpose:** Check compatibility between multiple plants

**Request Body:**
```json
{
  "plantSlugs": ["tomatoes", "basil", "potatoes", "carrots"]
}
```

**Response:**
```json
{
  "compatible": false,
  "relationships": [
    {
      "plant1": "tomatoes",
      "plant2": "basil",
      "relationship": "BENEFICIAL",
      "reason": "Repels aphids and flies, improves tomato flavor"
    },
    {
      "plant1": "tomatoes",
      "plant2": "potatoes",
      "relationship": "UNFAVORABLE",
      "reason": "Both are nightshades, spread same diseases",
      "severity": "HIGH"
    },
    {
      "plant1": "tomatoes",
      "plant2": "carrots",
      "relationship": "BENEFICIAL"
    }
  ],
  "warnings": [
    {
      "severity": "HIGH",
      "message": "Tomatoes and Potatoes are incompatible - both susceptible to late blight"
    }
  ],
  "suggestions": [
    "Remove Potatoes to improve plan compatibility",
    "Add Onions as they benefit Tomatoes and Carrots"
  ]
}
```

---

### 4. Rotation Planning

#### POST `/api/v1/plant-data/rotation/validate`
**Purpose:** Validate crop rotation for a grow area

**Request Body:**
```json
{
  "currentPlant": {
    "slug": "tomatoes",
    "plantingYear": 2025
  },
  "history": [
    {
      "slug": "potatoes",
      "plantingYear": 2024
    },
    {
      "slug": "peppers",
      "plantingYear": 2023
    },
    {
      "slug": "lettuce",
      "plantingYear": 2022
    }
  ]
}
```

**Response:**
```json
{
  "valid": false,
  "score": 45,
  "issues": [
    {
      "severity": "ERROR",
      "type": "FAMILY_ROTATION_VIOLATION",
      "message": "Solanaceae family planted 2024 (Potatoes) - requires 3-4 year rotation",
      "recommendation": "Wait until 2027 to plant nightshades (tomatoes, peppers, eggplants) in this area"
    },
    {
      "severity": "WARNING",
      "type": "HEAVY_FEEDER_SUCCESSION",
      "message": "Multiple heavy feeders in succession depletes soil",
      "recommendation": "Plant light feeders or nitrogen fixers to restore soil health"
    }
  ],
  "benefits": [
    {
      "type": "ROOT_DEPTH_VARIETY",
      "message": "Good mix of deep (tomatoes) and shallow (lettuce) root depths"
    }
  ],
  "recommendations": {
    "betterChoices": [
      {
        "slug": "beans",
        "name": "Bean",
        "family": "Fabaceae",
        "score": 95,
        "reasons": [
          "Nitrogen fixer - improves soil for next crop",
          "Different family (3+ years since last Fabaceae)",
          "Light feeder after heavy feeders"
        ]
      },
      {
        "slug": "lettuce",
        "name": "Lettuce",
        "family": "Asteraceae",
        "score": 88,
        "reasons": [
          "Light feeder - restores soil",
          "Shallow roots complement previous deep roots",
          "Different family"
        ]
      }
    ]
  }
}
```

#### GET `/api/v1/plant-data/rotation/recommendations`
**Purpose:** Get plant recommendations for rotation

**Query Parameters:**
- `previousFamily` - Last family planted
- `feederTypeHistory` - Comma-separated feeder types (HEAVY,MODERATE,LIGHT)
- `growAreaSunLevel` - Sun availability (FULL_SUN, PART_SHADE, SHADE)
- `season` - Current season (SPRING, SUMMER, FALL, WINTER)
- `excludePlants` - Comma-separated slugs to exclude

**Response:**
```json
{
  "recommendations": [
    {
      "rank": 1,
      "plant": {
        "id": 8,
        "name": "Bean",
        "slug": "beans",
        "family": "Fabaceae"
      },
      "score": 95,
      "rotationBenefits": [
        "Nitrogen fixer - improves soil",
        "3+ years since last Fabaceae",
        "Light feeder after heavy feeder"
      ],
      "growthCompatibility": [
        "Matches sun requirements",
        "Suitable for current season"
      ]
    },
    {
      "rank": 2,
      "plant": {
        "id": 41,
        "name": "Lettuce",
        "slug": "lettuce",
        "family": "Asteraceae"
      },
      "score": 88,
      "rotationBenefits": [
        "Light feeder - soil restoration",
        "Different root depth",
        "No recent Asteraceae"
      ]
    }
  ],
  "avoidPlants": [
    {
      "slug": "tomatoes",
      "name": "Tomato",
      "family": "Solanaceae",
      "reason": "Same family as previous crop - wait 2 more years"
    }
  ]
}
```

---

### 5. Pest & Disease Information

#### GET `/api/v1/plant-data/plants/{slug}/pests`
**Purpose:** Get pest information for a plant

**Response:**
```json
{
  "plant": {
    "name": "Tomato",
    "slug": "tomatoes"
  },
  "pests": [
    {
      "id": 145,
      "name": "Tomato Hornworm",
      "commonName": "Hornworm",
      "description": "Large green caterpillar that defoliates plants",
      "severity": "HIGH",
      "isSoilBorne": false
    },
    {
      "id": 12,
      "name": "Aphid",
      "commonName": "Aphids",
      "severity": "MODERATE",
      "isSoilBorne": false
    }
  ],
  "totalCount": 8
}
```

#### GET `/api/v1/plant-data/plants/{slug}/diseases`
**Purpose:** Get disease information for a plant

**Response:**
```json
{
  "plant": {
    "name": "Tomato",
    "slug": "tomatoes"
  },
  "diseases": [
    {
      "id": 34,
      "name": "Late Blight",
      "commonName": "Blight",
      "description": "Fungal disease affecting tomatoes and potatoes",
      "severity": "HIGH",
      "isSoilBorne": false,
      "persistenceYears": 0,
      "affectedFamilies": ["Solanaceae"],
      "rotationImpact": "Not soil-borne but spores overwinter on debris"
    },
    {
      "id": 35,
      "name": "Fusarium Wilt",
      "severity": "HIGH",
      "isSoilBorne": true,
      "persistenceYears": 7,
      "affectedFamilies": ["Solanaceae"],
      "rotationImpact": "CRITICAL - persists 5-7 years in soil, avoid Solanaceae"
    }
  ],
  "soilBorneCount": 3,
  "totalCount": 17
}
```

#### GET `/api/v1/plant-data/diseases/soil-borne`
**Purpose:** Get all soil-borne diseases for rotation planning

**Response:**
```json
{
  "diseases": [
    {
      "id": 35,
      "name": "Fusarium Wilt",
      "persistenceYears": 7,
      "affectedFamilies": ["Solanaceae"],
      "description": "Fungal disease affecting nightshades. Persists 5-7 years."
    },
    {
      "id": 42,
      "name": "Clubroot",
      "persistenceYears": 20,
      "affectedFamilies": ["Brassicaceae"],
      "description": "Devastating disease of cabbage family. Persists 7-20 years!"
    }
  ],
  "criticalRotationDiseases": [
    "Clubroot (20 years) - Brassicaceae",
    "White Rot (15 years) - Alliums",
    "Fusarium Wilt (7 years) - Solanaceae"
  ]
}
```

---

### 6. Seasonal Planning Support

#### GET `/api/v1/plant-data/plants/seasonal`
**Purpose:** Get plants suitable for a specific season and climate

**Query Parameters:**
- `season` - SPRING, SUMMER, FALL, WINTER
- `zone` - USDA hardiness zone (e.g., "5a", "9b")
- `frostDateFirst` - First frost date (ISO date)
- `frostDateLast` - Last frost date (ISO date)
- `sunLevel` - Available sun (FULL_SUN, PART_SHADE, SHADE)

**Response:**
```json
{
  "season": "SPRING",
  "zone": "7a",
  "directSow": [
    {
      "slug": "lettuce",
      "name": "Lettuce",
      "soilTempMinF": 40,
      "frostTolerant": true,
      "daysToMaturity": "45-60",
      "plantingWindow": {
        "start": "2025-03-15",
        "end": "2025-05-01"
      }
    },
    {
      "slug": "peas",
      "name": "Pea",
      "soilTempMinF": 40,
      "frostTolerant": true,
      "daysToMaturity": "60-70"
    }
  ],
  "indoorStart": [
    {
      "slug": "tomatoes",
      "name": "Tomato",
      "weeksBeforeLastFrost": 6,
      "transplantAfterFrost": true,
      "soilTempMinF": 55
    }
  ],
  "notRecommended": [
    {
      "slug": "basil",
      "name": "Basil",
      "reason": "Requires warm soil (50°F+), wait until late spring"
    }
  ]
}
```

---

### 7. Bulk Operations

#### POST `/api/v1/plant-data/plants/bulk`
**Purpose:** Get details for multiple plants at once

**Request Body:**
```json
{
  "slugs": ["tomatoes", "basil", "carrots", "lettuce", "beans"]
}
```

**Response:**
```json
{
  "plants": [
    {
      "slug": "tomatoes",
      "name": "Tomato",
      "family": "Solanaceae",
      // ... full plant details
    }
  ],
  "notFound": []
}
```

---

## Data Models

### Core DTOs

```kotlin
// Plant Summary (for list views)
data class PlantSummaryDTO(
    val id: Long,
    val name: String,
    val slug: String,
    val scientificName: String?,
    val family: FamilySummaryDTO?,
    val cycle: String?,
    val sunNeeds: String?,
    val feederType: String?,
    val isNitrogenFixer: Boolean,
    val frostTolerant: Boolean
)

// Plant Detail (for single plant views)
data class PlantDetailDTO(
    val id: Long,
    val name: String,
    val slug: String,
    val scientificName: String?,
    val family: FamilyDetailDTO?,
    val genus: String?,
    val cycle: String?,
    val growthRequirements: GrowthRequirementsDTO,
    val plantingDetails: PlantingDetailsDTO,
    val careRequirements: CareRequirementsDTO,
    val harvest: HarvestDTO,
    val rotationData: RotationDataDTO,
    val notes: String?,
    val companionCount: CompanionCountDTO,
    val pestCount: Int,
    val diseaseCount: Int
)

// Family
data class FamilyDetailDTO(
    val id: Long,
    val name: String,
    val commonName: String?,
    val rotationYearsMin: Int,
    val rotationYearsMax: Int,
    val description: String?
)

// Companion
data class CompanionDTO(
    val id: Long,
    val name: String,
    val slug: String,
    val relationship: String,
    val reason: String?
)

// Rotation Validation
data class RotationValidationDTO(
    val valid: Boolean,
    val score: Int, // 0-100
    val issues: List<RotationIssueDTO>,
    val benefits: List<RotationBenefitDTO>,
    val recommendations: RotationRecommendationsDTO?
)
```

---

## Implementation Plan

### Phase 1: Core Plant Data (Week 1)
1. ✅ Database schema complete
2. ✅ Data imported
3. ⏳ Create repository layer
4. ⏳ Create service layer
5. ⏳ Create DTOs
6. ⏳ Implement basic CRUD endpoints

### Phase 2: Companion Planting (Week 2)
1. ⏳ Companion endpoints
2. ⏳ Compatibility checking service
3. ⏳ Bulk companion queries

### Phase 3: Rotation Planning (Week 3)
1. ⏳ Rotation validation service
2. ⏳ Rotation scoring algorithm
3. ⏳ Recommendation engine
4. ⏳ Historical analysis

### Phase 4: Advanced Features (Week 4)
1. ⏳ Pest/disease endpoints
2. ⏳ Seasonal planning support
3. ⏳ Search optimization
4. ⏳ Caching strategy

---

## Technical Decisions

### API Design Patterns
- **RESTful** with clear resource hierarchy
- **DTO layer** to decouple domain models from API
- **Pagination** for list endpoints
- **Filtering** via query parameters
- **Bulk operations** for performance

### Performance Optimizations
- ✅ Database indexes on common queries
- ⏳ Response caching (Redis/Caffeine)
- ⏳ Lazy loading for relationships
- ⏳ Projection queries (fetch only needed fields)
- ⏳ Async processing for heavy computations

### Error Handling
- Standard HTTP status codes
- Consistent error response format
- Validation errors with field-level details
- Rate limiting for expensive operations

### Documentation
- OpenAPI/Swagger specification
- Interactive API explorer
- Code examples for each endpoint
- Versioning strategy

---

## Success Criteria

✅ **Complete plant data access** - All 76 plants with full details  
✅ **Companion data coverage** - 47% plants (36/76) with relationships  
✅ **Family-based rotation** - All families with rotation intervals  
⏳ **Rotation validation** - Score-based recommendations  
⏳ **Performance** - <100ms response for most queries  
⏳ **API documentation** - Complete OpenAPI spec  
⏳ **Testing** - 80%+ code coverage  

---

## Next Steps

1. Review and approve API design
2. Create repository interfaces
3. Implement service layer with rotation logic
4. Build controller endpoints
5. Add comprehensive tests
6. Generate API documentation
7. Create client SDK (TypeScript)
