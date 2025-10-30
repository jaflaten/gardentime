package no.sogn.plantdata.scraper

import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import org.springframework.stereotype.Component

@Component
class AlmanacScraper(
    config: ScraperConfig,
    rateLimiter: RateLimiter
) : BaseScraper(config, rateLimiter) {
    
    override val domain = "almanac.com"
    override val sourceName = "Almanac.com"
    
    override fun buildUrl(slug: String): String {
        return "https://www.almanac.com/plant/$slug"
    }
    
    override fun extractCommonName(doc: Document): String? {
        return try {
            // Try h1 title first
            doc.select("h1.page-title").firstOrNull()?.text()?.trim()
                // Fallback to title tag
                ?: doc.title().split("|").firstOrNull()?.trim()
        } catch (e: Exception) {
            log.warn("Failed to extract common name", e)
            null
        }
    }
    
    override fun extractDescription(doc: Document): String? {
        return try {
            // Look for intro/description section
            doc.select(".field--name-body .field__item p").firstOrNull()?.text()?.trim()
                ?: doc.select("article .content p").firstOrNull()?.text()?.trim()
        } catch (e: Exception) {
            log.warn("Failed to extract description", e)
            null
        }
    }
    
    override fun extractCompanionSection(doc: Document): String? {
        return try {
            // Look for companion planting section
            val companionHeadings = doc.select("h2, h3").filter { heading ->
                heading.text().contains("companion", ignoreCase = true) ||
                heading.text().contains("plant with", ignoreCase = true)
            }
            
            if (companionHeadings.isNotEmpty()) {
                val heading = companionHeadings.first()
                extractTextAfterHeading(heading)
            } else {
                // Try to find in the content by keywords
                val allParagraphs = doc.select("article .content p, .field--name-body p")
                val companionParagraphs = allParagraphs.filter { p ->
                    val text = p.text()
                    text.contains("companion", ignoreCase = true) ||
                    text.contains("plant with", ignoreCase = true) ||
                    text.contains("grows well with", ignoreCase = true) ||
                    text.contains("avoid planting", ignoreCase = true)
                }
                
                companionParagraphs.joinToString("\n\n") { it.text().trim() }
                    .takeIf { it.isNotBlank() }
            }
        } catch (e: Exception) {
            log.warn("Failed to extract companion section", e)
            null
        }
    }
    
    override fun extractPlantingGuide(doc: Document): String? {
        return try {
            val plantingHeadings = doc.select("h2, h3").filter { heading ->
                heading.text().contains("planting", ignoreCase = true) ||
                heading.text().contains("when to plant", ignoreCase = true) ||
                heading.text().contains("how to plant", ignoreCase = true)
            }
            
            if (plantingHeadings.isNotEmpty()) {
                plantingHeadings.joinToString("\n\n") { heading ->
                    val text = extractTextAfterHeading(heading)
                    "### ${heading.text()}\n$text"
                }
            } else {
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to extract planting guide", e)
            null
        }
    }
    
    override fun extractCareInstructions(doc: Document): String? {
        return try {
            val careHeadings = doc.select("h2, h3").filter { heading ->
                heading.text().contains("care", ignoreCase = true) ||
                heading.text().contains("growing", ignoreCase = true) ||
                heading.text().contains("watering", ignoreCase = true) ||
                heading.text().contains("fertiliz", ignoreCase = true)
            }
            
            if (careHeadings.isNotEmpty()) {
                careHeadings.joinToString("\n\n") { heading ->
                    val text = extractTextAfterHeading(heading)
                    "### ${heading.text()}\n$text"
                }
            } else {
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to extract care instructions", e)
            null
        }
    }
    
    override fun extractHarvestInfo(doc: Document): String? {
        return try {
            val harvestHeadings = doc.select("h2, h3").filter { heading ->
                heading.text().contains("harvest", ignoreCase = true) ||
                heading.text().contains("when to harvest", ignoreCase = true) ||
                heading.text().contains("how to harvest", ignoreCase = true)
            }
            
            if (harvestHeadings.isNotEmpty()) {
                harvestHeadings.joinToString("\n\n") { heading ->
                    val text = extractTextAfterHeading(heading)
                    "### ${heading.text()}\n$text"
                }
            } else {
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to extract harvest info", e)
            null
        }
    }
    
    override fun extractPestsAndDiseases(doc: Document): String? {
        return try {
            val pestHeadings = doc.select("h2, h3").filter { heading ->
                heading.text().contains("pest", ignoreCase = true) ||
                heading.text().contains("disease", ignoreCase = true) ||
                heading.text().contains("problem", ignoreCase = true)
            }
            
            if (pestHeadings.isNotEmpty()) {
                pestHeadings.joinToString("\n\n") { heading ->
                    val text = extractTextAfterHeading(heading)
                    "### ${heading.text()}\n$text"
                }
            } else {
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to extract pest/disease info", e)
            null
        }
    }
    
    /**
     * Extract text content after a heading until the next heading or section
     */
    private fun extractTextAfterHeading(heading: Element): String {
        val content = mutableListOf<String>()
        var sibling = heading.nextElementSibling()
        
        while (sibling != null) {
            // Stop at next heading
            if (sibling.tagName() in listOf("h1", "h2", "h3", "h4")) {
                break
            }
            
            // Collect paragraphs, lists, etc.
            when (sibling.tagName()) {
                "p" -> content.add(sibling.text().trim())
                "ul", "ol" -> {
                    val items = sibling.select("li").map { "- ${it.text().trim()}" }
                    content.addAll(items)
                }
                "div" -> {
                    // Check if div contains useful content
                    val text = sibling.text().trim()
                    if (text.isNotBlank() && text.length > 20) {
                        content.add(text)
                    }
                }
            }
            
            sibling = sibling.nextElementSibling()
        }
        
        return content.joinToString("\n").trim()
    }
}
