package no.sogn.plantdata.service

import com.fasterxml.jackson.databind.ObjectMapper
import no.sogn.plantdata.dto.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Paths

@Service
class BulkPlantImportService(
    private val importService: PlantAttributeImportService,
    private val objectMapper: ObjectMapper
) {
    
    private val log = LoggerFactory.getLogger(javaClass)
    
    /**
     * Import all plant attribute JSON files from a directory
     */
    fun bulkImport(directory: String): BulkImportResponse {
        log.info("Starting bulk import from directory: $directory")
        
        val dirPath = Paths.get(directory)
        if (!Files.exists(dirPath) || !Files.isDirectory(dirPath)) {
            log.error("Directory does not exist: $directory")
            return BulkImportResponse(
                totalProcessed = 0,
                successful = 0,
                failed = 0,
                results = emptyList()
            )
        }
        
        val results = mutableListOf<ImportResponse>()
        var successCount = 0
        var failCount = 0
        
        // Find all JSON files in directory
        Files.walk(dirPath, 1)
            .filter { Files.isRegularFile(it) }
            .filter { it.toString().endsWith(".json") }
            .forEach { jsonFile ->
                try {
                    log.info("Processing file: ${jsonFile.fileName}")
                    
                    // Read and parse JSON
                    val json = Files.readString(jsonFile)
                    val attributes = objectMapper.readValue(json, ParsedPlantAttributesDto::class.java)
                    
                    // Import the plant
                    val request = ImportPlantAttributesRequest(
                        attributes = attributes,
                        source = "Almanac.com"
                    )
                    val result = importService.importPlantAttributes(request)
                    results.add(result)
                    
                    if (result.success) {
                        successCount++
                    } else {
                        failCount++
                    }
                    
                } catch (e: Exception) {
                    log.error("Failed to process file: ${jsonFile.fileName}", e)
                    failCount++
                    results.add(ImportResponse(
                        success = false,
                        plantId = null,
                        commonName = jsonFile.fileName.toString(),
                        message = "Failed to parse file: ${e.message}"
                    ))
                }
            }
        
        log.info("Bulk import complete. Successful: $successCount, Failed: $failCount")
        
        return BulkImportResponse(
            totalProcessed = results.size,
            successful = successCount,
            failed = failCount,
            results = results
        )
    }
}
