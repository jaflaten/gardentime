package no.sogn.plantdata.scraper

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import no.sogn.plantdata.scraper.model.ExtractedSection
import no.sogn.plantdata.scraper.model.ScrapedPlantData
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardOpenOption
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Service
class FileOutputService(
    private val config: ScraperConfig,
    private val objectMapper: ObjectMapper
) {
    
    private val log = LoggerFactory.getLogger(javaClass)
    private val timestampFormatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
        .withZone(ZoneId.systemDefault())
    
    init {
        // Configure Jackson for pretty printing
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT)
        
        // Create directory structure
        ensureDirectoryStructure()
    }
    
    private fun ensureDirectoryStructure() {
        val baseDir = Paths.get(config.outputBaseDir)
        listOf(
            baseDir.resolve("rawhtml"),
            baseDir.resolve("extracted-text"),
            baseDir.resolve("parsed"),
            baseDir.resolve("reports")
        ).forEach { dir ->
            if (!Files.exists(dir)) {
                Files.createDirectories(dir)
                log.info("Created directory: $dir")
            }
        }
    }
    
    /**
     * Save raw HTML for a plant
     */
    fun saveRawHtml(slug: String, html: String, timestamp: Instant = Instant.now()): Path {
        val filename = "${slug}_${formatTimestamp(timestamp)}.html"
        val path = Paths.get(config.outputBaseDir, "rawhtml", filename)
        
        Files.writeString(path, html, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        log.info("Saved raw HTML: $path")
        
        return path
    }
    
    /**
     * Save extracted text section
     */
    fun saveSectionText(section: ExtractedSection, timestamp: Instant = Instant.now()): Path {
        val filename = "${section.slug}_${section.sectionType.name.lowercase()}_${formatTimestamp(timestamp)}.txt"
        val path = Paths.get(config.outputBaseDir, "extracted-text", filename)
        
        Files.writeString(path, section.text, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        log.debug("Saved section text: $path")
        
        return path
    }
    
    /**
     * Save complete scraped data as JSON
     */
    fun saveScrapedData(data: ScrapedPlantData): Path {
        val filename = "${data.slug}_scraped_${formatTimestamp(data.scrapedAt)}.json"
        val path = Paths.get(config.outputBaseDir, "parsed", filename)
        
        val json = objectMapper.writeValueAsString(data)
        Files.writeString(path, json, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        log.info("Saved scraped data: $path")
        
        return path
    }
    
    /**
     * Append to extraction report
     */
    fun appendToReport(message: String) {
        val reportPath = Paths.get(config.outputBaseDir, "reports", "extraction-report.md")
        
        if (!Files.exists(reportPath)) {
            val header = """
                # Scraping Extraction Report
                
                Generated: ${Instant.now()}
                
                ---
                
            """.trimIndent()
            Files.writeString(reportPath, header, StandardOpenOption.CREATE)
        }
        
        val entry = "\n## ${Instant.now()}\n$message\n"
        Files.writeString(reportPath, entry, StandardOpenOption.APPEND)
    }
    
    /**
     * Generate summary report
     */
    fun generateSummaryReport(results: List<ScrapedPlantData>): Path {
        val reportPath = Paths.get(config.outputBaseDir, "reports", "summary_${formatTimestamp(Instant.now())}.md")
        
        val successful = results.filter { it.successful }
        val failed = results.filter { !it.successful }
        
        val report = buildString {
            appendLine("# Scraping Summary Report")
            appendLine()
            appendLine("Generated: ${Instant.now()}")
            appendLine()
            appendLine("## Statistics")
            appendLine()
            appendLine("- Total plants: ${results.size}")
            appendLine("- Successful: ${successful.size}")
            appendLine("- Failed: ${failed.size}")
            appendLine("- Success rate: ${if (results.isNotEmpty()) "%.1f%%".format(successful.size * 100.0 / results.size) else "N/A"}")
            appendLine()
            
            if (successful.isNotEmpty()) {
                appendLine("## Successful Scrapes")
                appendLine()
                appendLine("| Slug | Common Name | Has Companions | Has Planting Guide |")
                appendLine("|------|-------------|----------------|-------------------|")
                successful.forEach { data ->
                    appendLine("| ${data.slug} | ${data.commonName ?: "N/A"} | ${if (data.companionSection?.isNotBlank() == true) "✓" else "✗"} | ${if (data.plantingGuide?.isNotBlank() == true) "✓" else "✗"} |")
                }
                appendLine()
            }
            
            if (failed.isNotEmpty()) {
                appendLine("## Failed Scrapes")
                appendLine()
                appendLine("| Slug | Error |")
                appendLine("|------|-------|")
                failed.forEach { data ->
                    appendLine("| ${data.slug} | ${data.errorMessage ?: "Unknown error"} |")
                }
                appendLine()
            }
        }
        
        Files.writeString(reportPath, report, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        log.info("Generated summary report: $reportPath")
        
        return reportPath
    }
    
    private fun formatTimestamp(instant: Instant): String {
        return timestampFormatter.format(instant)
    }
}
