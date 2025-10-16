# Curated Target Plant List (Initial 50)

Purpose: Limit Phase 1/2 aggregation to a high-impact subset of common home garden plants (vegetables, fruits, culinary herbs). Each entry has canonical scientific name (primary), category, growth cycle, and quick aggregation notes (synonyms / merge considerations / potential companion relevance).

Legend:
- Category: VEGETABLE / FRUIT / HERB (botanical fruits that gardeners treat as veg are under VEGETABLE)
- Cycle: ANNUAL / BIENNIAL / PERENNIAL (typical in temperate garden practice)
- Notes: Merge priorities, synonym hints, nitrogen fixation, invasive risk, etc.

## Vegetables (26)
| # | Common Name | Scientific (Canonical) | Cycle | Notes |
|---|-------------|------------------------|-------|-------|
| 1 | Tomato | Solanum lycopersicum | ANNUAL | Many cultivars; watch genus Solanum overlaps (eggplant, potato). Synonyms: "Tomate". |
| 2 | Potato | Solanum tuberosum | PERENNIAL (grown ANNUAL) | Trefle/Perenual may list as perennial; treat as annual for planning. |
| 3 | Carrot | Daucus carota subsp. sativus | BIENNIAL (grown ANNUAL) | Watch subspecies vs variety naming. |
| 4 | Lettuce | Lactuca sativa | ANNUAL | Rapid succession; needs water/part shade mapping. |
| 5 | Cucumber | Cucumis sativus | ANNUAL | Vine habit; needs trellis companion logic (structural). |
| 6 | Zucchini (Courgette) | Cucurbita pepo | ANNUAL | Shares species with other summer squash; cultivar duplicates likely. |
| 7 | Pumpkin | Cucurbita maxima | ANNUAL | Distinguish from C. pepo types to avoid merge conflicts. |
| 8 | Sweet Corn | Zea mays | ANNUAL | Wind pollinated; companion relevance: beans/squash (Three Sisters). |
| 9 | Pea | Pisum sativum | ANNUAL | Nitrogen fixer; capture N-fixing flag. |
|10 | Green Bean | Phaseolus vulgaris | ANNUAL | Nitrogen fixer (depending on rhizobia). |
|11 | Broccoli | Brassica oleracea var. italica | ANNUAL | Taxonomic variety field needed; may conflict with genus-only sources. |
|12 | Cabbage | Brassica oleracea var. capitata | ANNUAL | Same species group as broccoli/cauliflower/kale. Track variety in merge. |
|13 | Cauliflower | Brassica oleracea var. botrytis | ANNUAL | See brassica cluster handling. |
|14 | Kale | Brassica oleracea var. sabellica | ANNUAL / BIENNIAL | Extended cold tolerance; may persist. |
|15 | Spinach | Spinacia oleracea | ANNUAL | Cool season; soil pH sensitivity moderate. |
|16 | Onion | Allium cepa | BIENNIAL (grown ANNUAL) | Allium genus overlap (garlic, chives). |
|17 | Garlic | Allium sativum | PERENNIAL (grown ANNUAL) | Track cloves/propagation type. |
|18 | Beetroot | Beta vulgaris | BIENNIAL (grown ANNUAL) | Subspecies/cultivar (also chard). |
|19 | Radish | Raphanus sativus | ANNUAL | Fast maturity for succession interval field. |
|20 | Bell Pepper | Capsicum annuum | ANNUAL (tender PERENNIAL) | Group with chili; potential cultivar merges. |
|21 | Chili Pepper | Capsicum annuum (var.) | ANNUAL | Consider heat-level attribute (future). |
|22 | Eggplant | Solanum melongena | ANNUAL (tender PERENNIAL) | Solanum genus cross-conflict risk. |
|23 | Celery | Apium graveolens var. dulce | BIENNIAL (grown ANNUAL) | Stalk thickness & water needs high. |
|24 | Swiss Chard | Beta vulgaris subsp. cicla | BIENNIAL | Same species as beet; treat leaf vs root form. |
|25 | Arugula (Rocket) | Eruca vesicaria | ANNUAL | Synonym: Eruca sativa historically. Normalize. |
|26 | Parsnip | Pastinaca sativa | BIENNIAL (grown ANNUAL) | Overlaps with wild Pastinaca; ensure cultivar match. |

## Herbs (10)
| # | Common Name | Scientific (Canonical) | Cycle | Notes |
|---|-------------|------------------------|-------|-------|
|27 | Basil | Ocimum basilicum | ANNUAL | Companion benefit: pest deterrent near tomatoes/peppers. |
|28 | Parsley | Petroselinum crispum | BIENNIAL (often ANNUAL) | Distinguish flat vs curly in varieties (future). |
|29 | Cilantro / Coriander | Coriandrum sativum | ANNUAL | Dual use leaves/seeds; may need separate harvest timing fields. |
|30 | Dill | Anethum graveolens | ANNUAL | Attracts beneficial insects; flowering window important. |
|31 | Mint | Mentha × piperita | PERENNIAL | Potentially invasive; record invasive flag regionally. |
|32 | Oregano | Origanum vulgare | PERENNIAL | Aromatic pest deterrent; synonyms/cultivars common. |
|33 | Thyme | Thymus vulgaris | PERENNIAL | Drought tolerant moderate; low growth habit. |
|34 | Rosemary | Salvia rosmarinus | PERENNIAL | Formerly Rosmarinus officinalis – synonym mapping critical. |
|35 | Sage | Salvia officinalis | PERENNIAL | Distinguish ornamental vs culinary cultivars. |
|36 | Chives | Allium schoenoprasum | PERENNIAL | Pollinator friendly; Allium genus grouping. |

## Fruits & Fruit-Type Crops (14)
| # | Common Name | Scientific (Canonical) | Cycle | Notes |
|---|-------------|------------------------|-------|-------|
|37 | Strawberry | Fragaria × ananassa | PERENNIAL | Hybrid symbol ×; watch normalized canonical form (remove diacritics). |
|38 | Raspberry | Rubus idaeus | PERENNIAL | Distinguish primocane vs floricane (future attribute). |
|39 | Blackberry | Rubus fruticosus agg. | PERENNIAL | Aggregate species; may need cultivar-level later. |
|40 | Blueberry | Vaccinium corymbosum | PERENNIAL | Soil acidity critical (pH 4.5–5.5 typical). |
|41 | Apple | Malus domestica | PERENNIAL | Heavy cultivar variation; keep species-level first. |
|42 | Pear | Pyrus communis | PERENNIAL | Similar merge concerns as apple. |
|43 | Peach | Prunus persica | PERENNIAL | Chill hours attribute (future). |
|44 | Plum | Prunus domestica | PERENNIAL | Same genus with peach/cherry; genus conflicts possible. |
|45 | Cherry (Sweet) | Prunus avium | PERENNIAL | Distinguish sweet vs sour (P. cerasus) – sour cherry future add. |
|46 | Grape | Vitis vinifera | PERENNIAL | Trellis structural companion roles. |
|47 | Watermelon | Citrullus lanatus | ANNUAL | Warm season vine; space optimization interactions. |
|48 | Cantaloupe (Muskmelon) | Cucumis melo | ANNUAL | Distinguish from cucumber (same genus). |
|49 | Rhubarb | Rheum rhabarbarum | PERENNIAL | Toxic leaves (toxicity handling). |
|50 | Asparagus | Asparagus officinalis | PERENNIAL | Long-lived perennial; root depth DEEP; early spring harvest. |

## Prioritization Tiers for Initial Fetch
1. Tier 1 (Core annual veg): Tomato, Lettuce, Cucumber, Zucchini, Sweet Corn, Pea, Bean, Carrot, Onion, Pepper (bell + chili), Spinach.
2. Tier 2 (Brassica cluster + roots): Broccoli, Cabbage, Cauliflower, Kale, Radish, Beet, Parsnip, Potato, Garlic.
3. Tier 3 (Herbs high companion value): Basil, Parsley, Dill, Oregano, Thyme, Chives, Sage.
4. Tier 4 (Perennial fruits): Strawberry, Raspberry, Blueberry, Apple, Pear, Grape.
5. Tier 5 (Extended & specialty / structural): Pumpkin, Watermelon, Cantaloupe, Swiss Chard, Celery, Arugula, Mint (invasive), Rosemary, Peach, Plum, Cherry, Rhubarb, Asparagus, Eggplant.

## Merge & Synonym Strategy Notes
- Normalization: Lowercase, trim, remove hybrid markers ("×") only for canonical match; store original in synonyms.
- Variety Handling (Brassica, Beta vulgaris): For now treat taxonomic variety as part of canonical scientific name; later may split variety to separate attribute.
- Hybrid / Aggregate (Fragaria × ananassa, Rubus fruticosus agg.): Keep full form for scientific display; canonical key sans diacritic & punctuation for matching.
- Genus Overlaps: Solanum (tomato, potato, eggplant), Brassica cluster, Allium cluster, Prunus cluster – higher conflict likelihood, enable extra taxonomy validation.
- Nitrogen Fixers: Pea, Bean (Phaseolus) – mark `is_nitrogen_fixer = true` during attribute enrichment.
- Invasive Potential: Mint, Blackberry (some cultivars), Raspberry (regional), Asparagus minimal – flag where sources disagree.
- pH Sensitivity: Blueberry strongly acidic; add PH constraints early for plant_attributes mapping.
- Structural/Vining: Cucumber, Pumpkin, Watermelon, Grape – candidate for relationship_subtype STRUCTURAL in companion data.

## Implementation Steps
1. Create a seed configuration (YAML or JSON) listing these 50 entries with canonical scientific name + category + cycle.
2. Build a small resolver that hits Trefle & Perenual search endpoints by scientific name; capture first matching species ID per source.
3. Persist resolved source IDs into `plants` table (source_trefle_id, source_perenual_id) – log conflicts if taxonomy differs.
4. Add Flyway migration later for a `plant_seed` table if dynamic seeding required; otherwise treat static file + import job.
5. Extend `PlantAttributes` enrichment only for these 50 initially (smaller API quota footprint).
6. Use caching (Caffeine) keyed by canonical scientific name while resolving IDs to reduce duplicate calls.

## Future Add Candidates (Not in initial 50)
- Sour Cherry (Prunus cerasus)
- Sweet Potato (Ipomoea batatas)
- Pumpkin (alternate species Cucurbita moschata)
- Brussels Sprout (Brassica oleracea var. gemmifera)
- Blackberry cultivars (specific)
- Currants (Ribes nigrum)

---
Maintainer Actions: Mark any changes with checkboxes in `aggregator-plan.md` when seed import implemented.

