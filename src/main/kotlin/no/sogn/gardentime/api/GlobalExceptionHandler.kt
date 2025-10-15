package no.sogn.gardentime.api

import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

// Single canonical error response type used across the API
// (duplicate definition in exceptions package removed)
data class ErrorResponse(
    val timestamp: Instant = Instant.now(),
    val status: Int,
    val error: String,
    val message: String?
)

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(IllegalAccessException::class)
    fun handleIllegalAccess(ex: IllegalAccessException): ResponseEntity<ErrorResponse> {
        val body = ErrorResponse(
            status = HttpStatus.FORBIDDEN.value(),
            error = "FORBIDDEN",
            message = ex.message
        )
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body)
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        val status = if (ex.message?.contains("not found", ignoreCase = true) == true) HttpStatus.NOT_FOUND else HttpStatus.BAD_REQUEST
        val body = ErrorResponse(
            status = status.value(),
            error = status.name,
            message = ex.message
        )
        return ResponseEntity.status(status).body(body)
    }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(ex: ResponseStatusException): ResponseEntity<ErrorResponse> {
        val httpStatus = try { HttpStatus.valueOf(ex.statusCode.value()) } catch (_: Exception) { HttpStatus.INTERNAL_SERVER_ERROR }
        val body = ErrorResponse(
            status = httpStatus.value(),
            error = httpStatus.name,
            message = ex.reason ?: ex.message
        )
        return ResponseEntity.status(httpStatus).body(body)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val msg = ex.bindingResult.fieldErrors.joinToString { "${it.field}: ${it.defaultMessage}" }
        val body = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "BAD_REQUEST",
            message = msg
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body)
    }

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrity(ex: DataIntegrityViolationException): ResponseEntity<ErrorResponse> {
        val body = ErrorResponse(
            status = HttpStatus.CONFLICT.value(),
            error = "CONFLICT",
            message = ex.rootCause?.message ?: ex.message
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body)
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalState(ex: IllegalStateException): ResponseEntity<ErrorResponse> {
        // Typically indicates missing auth context -> 401
        val status = HttpStatus.UNAUTHORIZED
        val body = ErrorResponse(
            status = status.value(),
            error = status.name,
            message = ex.message
        )
        return ResponseEntity.status(status).body(body)
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ErrorResponse> {
        val body = ErrorResponse(
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "INTERNAL_SERVER_ERROR",
            message = ex.message
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body)
    }
}
