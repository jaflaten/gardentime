package no.sogn.gardentime.exceptions

import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

// Custom not-found exceptions mapped to 404.
// Canonical error serialization is handled by no.sogn.gardentime.api.GlobalExceptionHandler.
class GrowAreaIdNotFoundException(message: String) : ResponseStatusException(HttpStatus.NOT_FOUND, message)

class GardenIdNotFoundException(message: String) : ResponseStatusException(HttpStatus.NOT_FOUND, message)
