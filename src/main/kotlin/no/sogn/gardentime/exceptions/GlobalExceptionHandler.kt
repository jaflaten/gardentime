package no.sogn.gardentime.exceptions

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val objectMapper = ObjectMapper()

    @ExceptionHandler(GrowZoneIdNotFoundException::class)
    fun handleGrowZoneIdMissingException(e: GrowZoneIdNotFoundException, id: String): ResponseEntity<String> {
        val errorResponse = ErrorResponse(e.statusCode.value(), e.message + " -  Grow zone id: $id is missing or not found.")
        return ResponseEntity.status(e.statusCode).body(objectMapper.writeValueAsString(errorResponse))
    }

    @ExceptionHandler(GardenIdNotFoundException::class)
    fun handleGardenIdMissingException(e: GardenIdNotFoundException, id: String): ResponseEntity<String> {
        val errorResponse = ErrorResponse(e.statusCode.value(), e.message + " - Garden id: $id is missing or not found.")
        return ResponseEntity.status(e.statusCode ).body(objectMapper.writeValueAsString(errorResponse))


    }
}

