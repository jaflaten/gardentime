package no.sogn.gardentime.exceptions

import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

class GrowAreaIdNotFoundException(message: String) : ResponseStatusException(HttpStatus.NOT_FOUND, message)

class GardenIdNotFoundException(message: String) : ResponseStatusException(HttpStatus.NOT_FOUND, message)

data class ErrorResponse(
    val status: Int,
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)