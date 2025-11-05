package no.sogn.plantdata.enums

enum class RelationshipType { BENEFICIAL, NEUTRAL, ANTAGONISTIC }
enum class RelationshipSubtype { PEST_DETERRENT, NUTRIENT_SUPPORT, SHADE, STRUCTURAL, OTHER }
enum class ConfidenceLevel { HIGH, MEDIUM, LOW }
enum class EvidenceType { SCIENTIFIC, TRADITIONAL, ANECDOTAL }
enum class RootDepth { SHALLOW, MEDIUM, DEEP }
enum class FeederType { HEAVY, MODERATE, LIGHT }
enum class PlantCycle { ANNUAL, PERENNIAL, BIENNIAL }
enum class GrowthHabit { BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING, OTHER }
enum class SunNeeds { FULL_SUN, PART_SHADE, SHADE }
enum class WaterNeeds { LOW, MODERATE, HIGH, FREQUENT }
enum class ToxicityLevel { NONE, LOW, MODERATE, HIGH }
enum class PrimaryNutrientContribution { NITROGEN, POTASSIUM, PHOSPHORUS, NONE }
enum class SourceType { WEBSITE, BOOK, JOURNAL, INTERNAL }
enum class ConflictResolutionStrategy { PREFER_TREFLE, PREFER_PERENUAL, MANUAL }
enum class PlantCategory { VEGETABLE, FRUIT, HERB }
enum class SeverityLevel { LOW, MEDIUM, HIGH, CRITICAL }

