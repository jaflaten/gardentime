package no.sogn.gardentime.api

import no.sogn.gardentime.model.GardenDashboardDTO
import no.sogn.gardentime.service.GardenDashboardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/gardens")
@CrossOrigin(origins = ["*"])
class GardenDashboardController(
    private val gardenDashboardService: GardenDashboardService
) {

    @GetMapping("/{gardenId}/dashboard")
    fun getGardenDashboard(@PathVariable gardenId: UUID): ResponseEntity<GardenDashboardDTO> {
        val dashboardData = gardenDashboardService.getDashboardData(gardenId)
        return ResponseEntity.ok(dashboardData)
    }
}
