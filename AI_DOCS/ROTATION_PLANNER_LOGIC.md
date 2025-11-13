# Crop Rotation Planner Logic Summary

## Core Concept
The rotation planner helps gardeners make informed decisions about what to plant by analyzing crop history in each grow area and scoring potential plantings based on established regenerative farming principles.

## Scoring System (0-100 points)

The rotation planner evaluates each potential planting across five key dimensions:

### 1. Family Rotation (35 points maximum)
**What it checks**: Ensures different plant families are grown in succession

**Why it matters**: Plants in the same family share susceptibility to the same diseases and pests. Rotating families breaks pest and disease cycles.

**How it scores**:
- Excellent (35 pts): No family repetition for 3+ years
- Good (28 pts): 2-year gap since same family
- Fair (20 pts): 1-year gap since same family  
- Poor (10 pts): Same family in consecutive years
- Critical (0 pts): Same plant species in consecutive plantings

**Example**: Don't plant tomatoes after peppers (both Solanaceae family)

### 2. Nutrient Balance (25 points maximum)
**What it checks**: Balances heavy feeders with nitrogen fixers and light feeders

**Why it matters**: Different crops have different nutrient needs. Strategic rotation maintains soil fertility without excessive fertilizer.

**How it scores**:
- Excellent (25 pts): Nitrogen fixer following heavy feeder, or optimal succession
- Good (20 pts): Light feeder following heavy feeder
- Fair (15 pts): Heavy feeder following nitrogen fixer
- Poor (10 pts): Heavy feeder following heavy feeder
- Critical (0 pts): Consecutive heavy feeders with same nutrient demands

**Example**: Plant peas (nitrogen fixer) after corn (heavy feeder), then lettuce (light feeder)

### 3. Disease Risk (20 points maximum)
**What it checks**: Identifies potential disease carryover from previous crops

**Why it matters**: Soil-borne pathogens can persist for years, infecting susceptible crops

**How it scores**:
- Excellent (20 pts): No shared disease vulnerabilities
- Good (15 pts): Low disease risk
- Fair (10 pts): Some shared susceptibilities  
- Poor (5 pts): Moderate disease risk
- Critical (0 pts): High disease risk from recent crops

**Example**: Don't plant brassicas (kale, cabbage) where clubroot was present

### 4. Root Depth Diversity (10 points maximum)
**What it checks**: Alternates between shallow and deep-rooted crops

**Why it matters**: Different root depths prevent soil compaction, access different nutrient layers, and improve soil structure

**How it scores**:
- Excellent (10 pts): Alternating root depths
- Good (7 pts): Some depth variation
- Fair (5 pts): Similar depth to previous crop
- Poor (3 pts): Consecutive shallow-rooted crops

**Example**: Follow shallow carrots with deep-rooted tomatoes

### 5. Companion Compatibility (10 points maximum)
**What it checks**: Considers beneficial and antagonistic plant relationships

**Why it matters**: Some plants help each other grow through pest deterrence, nutrient sharing, or physical support

**How it scores**:
- Excellent (10 pts): Beneficial companion relationships
- Good (7 pts): Compatible plantings
- Fair (5 pts): Neutral relationship
- Poor (0 pts): Antagonistic combinations

**Example**: Plant basil near tomatoes (beneficial) but not beans near onions (antagonistic)

## Grading System

Total scores translate to actionable recommendations:

- **EXCELLENT (85-100)**: "Perfect choice! This rotation follows best practices."
- **GOOD (70-84)**: "Good choice. Minor considerations but generally sound."
- **FAIR (50-69)**: "Acceptable with caveats. Consider alternatives if available."
- **POOR (0-49)**: "Not recommended. Significant rotation concerns."

## Issue Severity Levels

The planner categorizes concerns into three levels:

### CRITICAL Issues
- Same plant species in consecutive seasons
- High disease risk
- Severe nutrient imbalance
- Family rotation violations

**User Action**: Should choose a different plant

### WARNING Issues  
- Moderate disease risk
- Suboptimal nutrient succession
- Same family within 2 years

**User Action**: Proceed with caution and monitoring

### INFO Messages
- Suggestions for improvement
- Educational content
- Optional enhancements

**User Action**: Informational only

## How Recommendations Work

The planner evaluates all available plants and returns the best options:

1. **Fetch Grow Area History**: Gets last 3 years of plantings
2. **Score All Plants**: Evaluates each plant in the database
3. **Filter by Threshold**: Only returns plants above minimum score (default: 60)
4. **Sort by Score**: Highest-scoring plants appear first
5. **Group by Category**: 
   - Top picks (highest overall scores)
   - Soil builders (nitrogen fixers and cover crops)
   - By family (for crop diversity planning)
   - To avoid (low scores, significant issues)

## Educational Component

For each issue or benefit, the planner can provide:

### Detailed Explanation
A longer description of why this matters

### Scientific Basis
Research-backed reasoning for the recommendation

### Examples
Concrete scenarios illustrating the concept

### Expected Results
What the user can expect if they follow (or ignore) the advice

### Timeframe
When they'll see results or when risks will manifest

### External Links
Resources for deeper learning

## User-Friendly Communication

The planner translates complex agricultural science into clear, actionable guidance:

**Instead of**: "Solanaceae succession violates optimal rotation interval"
**It says**: "Planting tomatoes after peppers increases disease risk because both are in the nightshade family. Wait at least 2 years before planting another nightshade crop here."

**With Learn More**: Opens detailed explanation about late blight, verticillium wilt, and why family rotation matters, plus links to extension service resources.

## Practical Application

A typical workflow:

1. **User selects grow area**: "North Bed where I grew tomatoes last year"
2. **Planner analyzes**: Tomatoes are Solanaceae, heavy feeder, deep roots
3. **Recommendations appear**:
   - Beans (85 score): Different family, nitrogen fixer, adds nutrients
   - Lettuce (78 score): Different family, light feeder, shallow roots
   - Onions (65 score): Different family, neutral nutrients
4. **User explores**: Clicks on beans
5. **Detailed view shows**:
   - Score: 85 (EXCELLENT)
   - Benefits: "Adds nitrogen for next crop", "Breaks disease cycle"
   - No critical issues
   - Minor note: "Different watering needs than tomatoes"
6. **User adds beans**: With confidence based on clear reasoning

## Balancing Science and Usability

The planner strikes a balance:

**Scientific Rigor**: Based on established agricultural research and regenerative farming principles

**User Accessibility**: Explains complex concepts in simple terms without losing accuracy

**Actionable**: Always provides clear next steps, not just warnings

**Educational**: Helps users learn principles they can apply in future planning

**Flexible**: Allows users to override recommendations with full information

## Result

Users make better planting decisions, leading to:
- Healthier plants with less disease
- Better yields without excessive inputs
- Improved soil health over time
- Reduced pest pressure
- More sustainable gardening practices
- Increased knowledge and confidence
