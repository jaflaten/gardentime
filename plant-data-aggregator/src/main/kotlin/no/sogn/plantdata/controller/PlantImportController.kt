package no.sogn.plantdata.controller

import no.sogn.plantdata.dto.*
import no.sogn.plantdata.service.BulkPlantImportService
import no.sogn.plantdata.service.PlantAttributeImportService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/import")
class PlantImportController(
    private val importService: PlantAttributeImportService,
    private val bulkImportService: BulkPlantImportService
) {
    
    /**
     * Import a single plant's attributes from LLM-parsed JSON
     * 
     * Example:
     * POST /api/admin/import/plant-attributes
     * {
     *   "attributes": {
     *     "commonName": "Tomato",
     *     "cycle": "ANNUAL",
     *     "sunNeeds": "FULL_SUN",
     *     ...
     *   },
     *   "scientificName": "Solanum lycopersicum",  // optional
     *   "source": "Almanac.com"
     * }
     */
    @PostMapping("/plant-attributes")
    fun importPlantAttributes(
        @RequestBody request: ImportPlantAttributesRequest
    ): ResponseEntity<ImportResponse> {
        val result = importService.importPlantAttributes(request)
        
        return if (result.success) {
            ResponseEntity.ok(result)
        } else {
            ResponseEntity.badRequest().body(result)
        }
    }
    
    /**
     * Bulk import from a directory of JSON files
     * 
     * Example:
     * POST /api/admin/import/bulk-attributes
     * {
     *   "directory": "docs/scrapers/extracted-text"
     * }
     */
    @PostMapping("/bulk-attributes")
    fun bulkImportAttributes(
        @RequestBody request: BulkImportRequest
    ): ResponseEntity<BulkImportResponse> {
        val result = bulkImportService.bulkImport(request.directory)
        return ResponseEntity.ok(result)
    }
    
    /**
     * Import from a simplified JSON payload (just the attributes)
     * This is useful for quick testing with curl
     * 
     * Example:
     * curl -X POST http://localhost:8081/api/admin/import/simple \
     *   -H "Content-Type: application/json" \
     *   -d @docs/scrapers/extracted-text/tomatoes.json
     */
    @PostMapping("/simple")
    fun importSimple(
        @RequestBody attributes: ParsedPlantAttributesDto
    ): ResponseEntity<ImportResponse> {
        val request = ImportPlantAttributesRequest(
            attributes = attributes,
            source = "Almanac.com"
        )
        
        val result = importService.importPlantAttributes(request)
        
        return if (result.success) {
            ResponseEntity.ok(result)
        } else {
            ResponseEntity.badRequest().body(result)
        }
    }
}
