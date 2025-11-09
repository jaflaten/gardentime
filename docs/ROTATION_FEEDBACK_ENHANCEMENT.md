# Rotation Planner Feedback Enhancement

## Overview
Enhance the rotation planner's user feedback to provide clear, educational explanations for why certain plant combinations work or don't work, with expandable details for users who want to learn more.

## Current State
The rotation planner provides:
- Severity levels: CRITICAL, WARNING, INFO
- Basic messages about issues
- Simple suggestions

## Enhancement Goals
1. **Clear, understandable messages** for all users
2. **Educational content** with "Read more" expandable sections
3. **Actionable suggestions** for resolving issues
4. **Context-aware explanations** based on specific crop history

## Implementation Plan

### Phase 1: Backend DTO Enhancements

#### 1.1 Enhanced RotationIssue Model
Add detailed explanation fields to `RotationIssue`:

```kotlin
data class RotationIssue(
    val severity: IssueSeverity,
    val category: String,
    val message: String,           // Short, clear message
    val suggestion: String?,       // What to do instead
    
    // NEW FIELDS
    val detailedExplanation: String?,  // Full explanation (2-3 sentences)
    val learnMore: LearnMoreContent?,  // Expandable educational content
    val affectedYears: List<Int>?,     // Which years caused this issue
    val relatedPlants: List<String>?   // Which plants in history relate to this
)

data class LearnMoreContent(
    val title: String,                 // e.g., "Why Family Rotation Matters"
    val content: String,               // 2-3 paragraph explanation
    val scientificBasis: String?,      // The science behind it
    val examples: List<String>?,       // Practical examples
    val externalLinks: List<ExternalLink>? // Optional links to resources
)

data class ExternalLink(
    val title: String,
    val url: String,
    val description: String?
)
```

#### 1.2 Enhanced RotationBenefit Model
Add detailed benefit explanations:

```kotlin
data class RotationBenefit(
    val category: String,
    val message: String,           // Short benefit statement
    val impact: String,            // Expected positive outcome
    
    // NEW FIELDS
    val detailedExplanation: String?,  // Why this is beneficial
    val expectedResults: List<String>?, // What to expect (e.g., "20-30% yield increase")
    val timeframe: String?             // When benefits appear (e.g., "within 2 years")
)
```

### Phase 2: Enhanced Scoring Service

#### 2.1 Detailed Message Generation
Create a new service: `RotationMessageService.kt`

```kotlin
@Service
class RotationMessageService {
    
    fun generateFamilyRotationIssue(
        family: String,
        yearsSince: Double,
        recommendedInterval: Int,
        diseaseHistory: List<DiseaseIncident>
    ): RotationIssue {
        
        val severity = when {
            yearsSince < 1 -> IssueSeverity.CRITICAL
            yearsSince < (recommendedInterval - 1) -> IssueSeverity.WARNING
            else -> IssueSeverity.INFO
        }
        
        val message = when (severity) {
            IssueSeverity.CRITICAL -> 
                "Same plant family planted ${yearsSince.roundToInt()} year(s) ago - too soon!"
            IssueSeverity.WARNING -> 
                "Plant family rotation interval shorter than recommended (${yearsSince.roundToInt()} vs ${recommendedInterval} years)"
            else -> 
                "Family rotation interval is adequate"
        }
        
        val suggestion = when (severity) {
            IssueSeverity.CRITICAL -> 
                "Wait at least ${recommendedInterval - yearsSince.roundToInt()} more year(s) or choose a different plant family"
            IssueSeverity.WARNING -> 
                "Consider waiting ${recommendedInterval - yearsSince.roundToInt()} more year(s) for optimal results"
            else -> null
        }
        
        val detailedExplanation = when (family) {
            "Solanaceae" -> 
                "Tomatoes, peppers, and eggplants (Solanaceae) are highly susceptible to soil-borne diseases like blight and verticillium wilt. These pathogens can persist in soil for ${RotationRules.familyIntervals[family]} years. Planting too soon risks disease buildup and crop failure."
            "Brassicaceae" -> 
                "Cabbage family plants (Brassicaceae) can develop clubroot disease, which persists in soil for up to 20 years. A ${RotationRules.familyIntervals[family]}-year rotation prevents spore buildup and maintains soil health."
            "Fabaceae" -> 
                "Legumes (peas and beans) can suffer from root rot diseases. While they fix nitrogen, they also deplete specific micronutrients. A ${RotationRules.familyIntervals[family]}-year rotation allows soil biology to rebalance."
            else -> 
                "$family plants should rotate every ${recommendedInterval} years to prevent disease buildup and nutrient depletion."
        }
        
        val learnMore = generateFamilyRotationLearnMore(family, diseaseHistory)
        
        return RotationIssue(
            severity = severity,
            category = "Family Rotation",
            message = message,
            suggestion = suggestion,
            detailedExplanation = detailedExplanation,
            learnMore = learnMore,
            affectedYears = listOf(yearsSince.roundToInt()),
            relatedPlants = diseaseHistory.map { it.plantName }
        )
    }
    
    private fun generateFamilyRotationLearnMore(
        family: String,
        diseaseHistory: List<DiseaseIncident>
    ): LearnMoreContent {
        
        val diseaseInfo = if (diseaseHistory.isNotEmpty()) {
            "In your garden history, ${family} plants have experienced: ${diseaseHistory.joinToString(", ") { it.diseaseNames }}. This makes proper rotation even more critical."
        } else {
            ""
        }
        
        return LearnMoreContent(
            title = "Understanding Plant Family Rotation",
            content = """
                Plant families share similar genetic traits, which means they're vulnerable to the same pests and diseases. 
                When you plant the same family in the same spot repeatedly, disease-causing organisms build up in the soil, 
                leading to weakened plants and reduced yields.
                
                Crop rotation breaks this cycle. By waiting the recommended interval before replanting the same family, 
                you starve soil pathogens and allow beneficial soil organisms to recover. This is especially important 
                for disease-prone families like Solanaceae (tomatoes) and Brassicaceae (cabbage).
                
                $diseaseInfo
            """.trimIndent(),
            scientificBasis = """
                Research shows that soil-borne pathogens like Verticillium dahliae (affecting Solanaceae) and 
                Plasmodiophora brassicae (clubroot in Brassicaceae) can persist as resistant spores for years. 
                Studies demonstrate that 3-4 year rotations reduce disease incidence by 60-90% compared to 
                continuous planting.
            """.trimIndent(),
            examples = listOf(
                "After tomatoes (Solanaceae), plant beans (Fabaceae) → then lettuce (Asteraceae) → then back to tomatoes",
                "After cabbage (Brassicaceae), plant corn (Poaceae) → then squash (Cucurbitaceae) → then beans → then back to cabbage",
                "Never plant tomatoes → peppers → eggplants in succession (all Solanaceae)"
            ),
            externalLinks = listOf(
                ExternalLink(
                    title = "Cornell University: Crop Rotation on Organic Farms",
                    url = "https://ecommons.cornell.edu/handle/1813/56161",
                    description = "Research-based guide to crop rotation principles"
                )
            )
        )
    }
    
    fun generateNutrientBalanceIssue(
        previousFeeding: String,
        currentFeeding: String,
        score: Int
    ): RotationIssue? {
        
        if (previousFeeding == "HEAVY" && currentFeeding == "HEAVY") {
            return RotationIssue(
                severity = IssueSeverity.WARNING,
                category = "Nutrient Balance",
                message = "Two heavy feeders in a row will deplete soil nutrients",
                suggestion = "Consider a nitrogen-fixing crop (beans, peas) or light feeder instead",
                detailedExplanation = """
                    Heavy feeders like tomatoes, corn, and brassicas extract large amounts of nitrogen and other 
                    nutrients from the soil. Planting heavy feeders consecutively exhausts the soil, requiring 
                    heavy fertilizer inputs and reducing soil health over time.
                """.trimIndent(),
                learnMore = LearnMoreContent(
                    title = "Nutrient-Balanced Crop Rotation",
                    content = """
                        Healthy soil has a balance of nutrients. Heavy feeders (tomatoes, corn, cabbage) take a lot 
                        of nitrogen. Light feeders (carrots, herbs) need less. Nitrogen fixers (beans, peas) actually 
                        add nitrogen to soil through their root nodules.
                        
                        The ideal rotation cycles through all three types: Heavy Feeder → Light Feeder → Nitrogen Fixer → 
                        Heavy Feeder. This creates a sustainable system where soil fertility is maintained naturally 
                        without excessive inputs.
                    """.trimIndent(),
                    scientificBasis = """
                        Legumes (Fabaceae) form symbiotic relationships with Rhizobium bacteria, which convert 
                        atmospheric nitrogen into plant-available forms. Studies show that a legume crop can add 
                        40-200 lbs of nitrogen per acre, depending on species and growing conditions.
                    """.trimIndent(),
                    examples = listOf(
                        "Heavy: Tomatoes → Light: Carrots → Fixer: Beans → Heavy: Cabbage",
                        "Heavy: Corn → Light: Lettuce → Fixer: Peas → Heavy: Squash",
                        "Avoid: Tomatoes → Corn → Cabbage (all heavy feeders)"
                    ),
                    externalLinks = null
                ),
                affectedYears = null,
                relatedPlants = null
            )
        }
        
        return null
    }
    
    fun generateRootDepthIssue(
        currentDepth: String,
        recentDepths: List<String>
    ): RotationIssue? {
        
        if (recentDepths.size >= 2 && recentDepths.all { it == currentDepth }) {
            return RotationIssue(
                severity = IssueSeverity.INFO,
                category = "Root Depth Diversity",
                message = "Same root depth repeated - soil compaction risk",
                suggestion = "Vary root depths to improve soil structure (shallow → medium → deep)",
                detailedExplanation = """
                    Planting crops with the same root depth repeatedly can lead to soil compaction in that layer 
                    and underutilization of other soil layers. Varying root depths helps break up compacted layers, 
                    improves drainage, and accesses nutrients from different soil zones.
                """.trimIndent(),
                learnMore = LearnMoreContent(
                    title = "Root Depth and Soil Structure",
                    content = """
                        Different crops explore different soil layers. Shallow-rooted plants (lettuce, herbs) work 
                        the top 6-12 inches. Medium-rooted plants (beans, brassicas) reach 12-24 inches. Deep-rooted 
                        plants (tomatoes, carrots) can go 24-48 inches or more.
                        
                        Rotating through different root depths naturally aerates the soil, breaks up hardpan layers, 
                        and brings nutrients from deeper layers to the surface as roots decompose. This is especially 
                        valuable for heavy clay soils prone to compaction.
                    """.trimIndent(),
                    scientificBasis = """
                        Research demonstrates that diverse root architectures improve soil aggregate stability and 
                        water infiltration. Deep-rooted crops can break through compacted layers, creating channels 
                        that benefit subsequent shallow-rooted crops.
                    """.trimIndent(),
                    examples = listOf(
                        "Shallow: Lettuce → Deep: Tomatoes → Medium: Beans",
                        "Deep: Carrots → Shallow: Radishes → Medium: Cabbage",
                        "Use cover crops like daikon radish (biodrilling) to break compaction"
                    ),
                    externalLinks = null
                ),
                affectedYears = null,
                relatedPlants = null
            )
        }
        
        return null
    }
    
    fun generateDiseaseRiskIssue(
        diseaseHistory: List<DiseaseIncident>,
        currentPlant: String
    ): RotationIssue? {
        
        val recentDiseases = diseaseHistory.filter { it.yearsAgo < 3 }
        
        if (recentDiseases.isNotEmpty()) {
            return RotationIssue(
                severity = IssueSeverity.WARNING,
                category = "Disease Risk",
                message = "Disease history detected in this area",
                suggestion = "Monitor closely for symptoms; consider resistant varieties",
                detailedExplanation = """
                    This growing area has a history of ${recentDiseases.joinToString(", ") { it.diseaseNames }} 
                    within the last 3 years. Some disease organisms can persist in soil, increasing risk for 
                    susceptible plants. Extra monitoring and prevention strategies are recommended.
                """.trimIndent(),
                learnMore = LearnMoreContent(
                    title = "Managing Disease History",
                    content = """
                        Once a disease appears in your garden, it's important to track it because some pathogens 
                        persist in soil for years. However, this doesn't mean you can never grow susceptible plants 
                        again - it means you need to be smart about it.
                        
                        Strategies for managing disease-prone areas: (1) Choose disease-resistant varieties, 
                        (2) Improve soil health with compost and beneficial microbes, (3) Practice excellent garden 
                        hygiene, (4) Consider solarization or biological soil amendments, (5) Monitor plants closely 
                        for early symptoms.
                    """.trimIndent(),
                    scientificBasis = """
                        Soil biodiversity is key to disease suppression. Research shows that healthy, biologically 
                        active soils can suppress soil-borne pathogens through competition and antagonism from 
                        beneficial microorganisms. Adding compost and reducing tillage supports this natural defense.
                    """.trimIndent(),
                    examples = diseaseHistory.map { 
                        "${it.plantName} - ${it.diseaseNames} (${it.yearsAgo.roundToInt()} years ago)"
                    },
                    externalLinks = null
                ),
                affectedYears = recentDiseases.map { it.yearsAgo.roundToInt() },
                relatedPlants = recentDiseases.map { it.plantName }
            )
        }
        
        return null
    }
    
    fun generateBenefits(
        score: RotationScore,
        currentPlant: String,
        isNitrogenFixer: Boolean
    ): List<RotationBenefit> {
        
        val benefits = mutableListOf<RotationBenefit>()
        
        // Good family rotation
        if (score.components.familyRotation.score >= 30) {
            benefits.add(RotationBenefit(
                category = "Disease Prevention",
                message = "Excellent family rotation interval",
                impact = "Significantly reduced disease risk",
                detailedExplanation = "The time since last planting this family allows soil pathogens to die off and beneficial organisms to recover.",
                expectedResults = listOf(
                    "60-90% reduction in soil-borne disease incidence",
                    "Healthier plants with stronger immune systems",
                    "Reduced need for disease management interventions"
                ),
                timeframe = "Benefits appear immediately this season"
            ))
        }
        
        // Good nutrient balance
        if (score.components.nutrientBalance.score >= 20) {
            benefits.add(RotationBenefit(
                category = "Soil Fertility",
                message = "Great nutrient balance in rotation",
                impact = "Improved soil fertility and structure",
                detailedExplanation = "This rotation sequence maintains balanced soil nutrients without depleting specific elements.",
                expectedResults = listOf(
                    "Reduced fertilizer requirements (20-40% savings)",
                    "Better soil structure and water retention",
                    "Improved long-term productivity"
                ),
                timeframe = "Cumulative benefits build over 2-3 years"
            ))
        }
        
        // Nitrogen fixer bonus
        if (isNitrogenFixer) {
            benefits.add(RotationBenefit(
                category = "Soil Enrichment",
                message = "Nitrogen-fixing crop builds soil fertility",
                impact = "Adds free nitrogen for next crop",
                detailedExplanation = "This legume will add nitrogen to the soil through symbiotic bacteria in its root nodules.",
                expectedResults = listOf(
                    "40-200 lbs nitrogen per acre added naturally",
                    "Next heavy feeder will thrive with minimal fertilizer",
                    "Improved soil biology and microbial diversity"
                ),
                timeframe = "Nitrogen available for next season's crop"
            ))
        }
        
        // Root diversity
        if (score.components.rootDepthDiversity.score >= 8) {
            benefits.add(RotationBenefit(
                category = "Soil Structure",
                message = "Good root depth diversity",
                impact = "Improved soil aeration and structure",
                detailedExplanation = "Varying root depths naturally aerates soil and accesses nutrients from different layers.",
                expectedResults = listOf(
                    "Better water infiltration and drainage",
                    "Reduced soil compaction",
                    "Access to nutrients from multiple soil layers"
                ),
                timeframe = "Improvements visible within 1-2 seasons"
            ))
        }
        
        return benefits
    }
}
```

### Phase 3: Frontend Type Definitions

Create `client-next/types/rotation.ts`:

```typescript
export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export interface ExternalLink {
  title: string;
  url: string;
  description?: string;
}

export interface LearnMoreContent {
  title: string;
  content: string;
  scientificBasis?: string;
  examples?: string[];
  externalLinks?: ExternalLink[];
}

export interface RotationIssue {
  severity: IssueSeverity;
  category: string;
  message: string;
  suggestion?: string;
  detailedExplanation?: string;
  learnMore?: LearnMoreContent;
  affectedYears?: number[];
  relatedPlants?: string[];
}

export interface RotationBenefit {
  category: string;
  message: string;
  impact: string;
  detailedExplanation?: string;
  expectedResults?: string[];
  timeframe?: string;
}

export interface ScoreComponent {
  score: number;
  maxScore: number;
  label: string;
  description: string;
}

export interface ScoreComponents {
  familyRotation: ScoreComponent;
  nutrientBalance: ScoreComponent;
  diseaseRisk: ScoreComponent;
  rootDepthDiversity: ScoreComponent;
  companionCompatibility: ScoreComponent;
}

export interface RotationScore {
  totalScore: number;
  grade: string;
  recommendation: string;
  components: ScoreComponents;
  issues: RotationIssue[];
  benefits: RotationBenefit[];
}

export interface PlantRecommendation {
  plantId: string;
  plantName: string;
  scientificName?: string;
  family: string;
  rotationScore: RotationScore;
  suitabilityReason: string;
  primaryBenefits: string[];
  warningFlags: string[];
}
```

### Phase 4: Frontend Components

#### 4.1 RotationIssueCard Component

Create `client-next/components/rotation/RotationIssueCard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { RotationIssue, IssueSeverity } from '@/types/rotation';

interface Props {
  issue: RotationIssue;
}

export default function RotationIssueCard({ issue }: Props) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    [IssueSeverity.CRITICAL]: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    [IssueSeverity.WARNING]: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    [IssueSeverity.INFO]: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
              {issue.category}
            </span>
            <span className={`text-xs ${config.textColor} opacity-75`}>
              {issue.severity}
            </span>
          </div>
          <p className={`mt-1 font-medium ${config.textColor}`}>
            {issue.message}
          </p>
          
          {issue.suggestion && (
            <p className={`mt-2 text-sm ${config.textColor} opacity-90`}>
              💡 <strong>Suggestion:</strong> {issue.suggestion}
            </p>
          )}
        </div>
      </div>

      {/* Detailed Explanation */}
      {issue.detailedExplanation && (
        <p className={`mt-3 text-sm ${config.textColor} opacity-80 leading-relaxed`}>
          {issue.detailedExplanation}
        </p>
      )}

      {/* Read More Section */}
      {issue.learnMore && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 text-sm font-medium ${config.textColor} hover:underline`}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Show less' : 'Learn more about this'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-4">
              {/* Main Content */}
              <div className={`text-sm ${config.textColor} opacity-90 leading-relaxed whitespace-pre-line`}>
                {issue.learnMore.content}
              </div>

              {/* Scientific Basis */}
              {issue.learnMore.scientificBasis && (
                <div>
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                    🔬 Scientific Basis
                  </h4>
                  <p className={`text-sm ${config.textColor} opacity-80 leading-relaxed`}>
                    {issue.learnMore.scientificBasis}
                  </p>
                </div>
              )}

              {/* Examples */}
              {issue.learnMore.examples && issue.learnMore.examples.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                    📋 Examples
                  </h4>
                  <ul className={`text-sm ${config.textColor} opacity-80 space-y-1`}>
                    {issue.learnMore.examples.map((example, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* External Links */}
              {issue.learnMore.externalLinks && issue.learnMore.externalLinks.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                    🔗 Further Reading
                  </h4>
                  <ul className="space-y-2">
                    {issue.learnMore.externalLinks.map((link, idx) => (
                      <li key={idx}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm ${config.textColor} hover:underline inline-flex items-center gap-1`}
                        >
                          {link.title}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        {link.description && (
                          <p className={`text-xs ${config.textColor} opacity-70 mt-1`}>
                            {link.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Plants/Years */}
              {(issue.relatedPlants || issue.affectedYears) && (
                <div className={`text-xs ${config.textColor} opacity-70 pt-2 border-t ${config.borderColor}`}>
                  {issue.affectedYears && issue.affectedYears.length > 0 && (
                    <span>Years affected: {issue.affectedYears.join(', ')} • </span>
                  )}
                  {issue.relatedPlants && issue.relatedPlants.length > 0 && (
                    <span>Related plants: {issue.relatedPlants.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 4.2 RotationBenefitCard Component

Create `client-next/components/rotation/RotationBenefitCard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { RotationBenefit } from '@/types/rotation';

interface Props {
  benefit: RotationBenefit;
}

export default function RotationBenefitCard({ benefit }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Sparkles className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-green-800">
              {benefit.category}
            </span>
          </div>
          <p className="mt-1 font-medium text-green-800">
            {benefit.message}
          </p>
          <p className="mt-1 text-sm text-green-700">
            ✨ <strong>Impact:</strong> {benefit.impact}
          </p>
        </div>
      </div>

      {/* Detailed Explanation */}
      {benefit.detailedExplanation && (
        <p className="mt-3 text-sm text-green-800 opacity-90 leading-relaxed">
          {benefit.detailedExplanation}
        </p>
      )}

      {/* Read More Section */}
      {(benefit.expectedResults || benefit.timeframe) && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-green-800 hover:underline"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Show less' : 'See expected results'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Expected Results */}
              {benefit.expectedResults && benefit.expectedResults.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-2">
                    📊 Expected Results
                  </h4>
                  <ul className="text-sm text-green-800 opacity-90 space-y-1">
                    {benefit.expectedResults.map((result, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>✓</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeframe */}
              {benefit.timeframe && (
                <div className="text-xs text-green-700 pt-2 border-t border-green-200">
                  ⏱️ <strong>Timeframe:</strong> {benefit.timeframe}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 4.3 Integration into Season Planner

Update the season planner to show rotation recommendations when adding crops.

### Phase 5: Testing Content

Create comprehensive test cases for message generation with real-world scenarios.

## Summary

This enhancement provides:

1. **Clear messaging** - Users immediately understand if there's a problem
2. **Educational content** - "Learn more" sections teach regenerative farming principles
3. **Actionable guidance** - Specific suggestions for what to do
4. **Context awareness** - Messages reference specific garden history
5. **Progressive disclosure** - Simple by default, detailed on demand
6. **Professional presentation** - Color-coded severity levels with appropriate icons

Users can quickly scan issues/benefits and dive deep into the science when they want to learn more.
