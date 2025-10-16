package no.sogn.plantdata.controller

import no.sogn.plantdata.model.Plant
import no.sogn.plantdata.repository.PlantRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class PlantController(private val plantRepository: PlantRepository) {

    @GetMapping("/api/plants")
    fun list(@RequestParam(required = false) q: String?): List<Plant> =
        if (q.isNullOrBlank()) plantRepository.findAll().take(50) else plantRepository.findAll().filter { it.canonicalScientificName.contains(q, ignoreCase = true) }

    @GetMapping("/api/plants/{id}")
    fun get(@PathVariable id: String): Plant = plantRepository.findById(java.util.UUID.fromString(id)).orElseThrow()
}

