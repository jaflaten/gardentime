package no.sogn.gardentime.api

import no.sogn.gardentime.dto.AuthResponse
import no.sogn.gardentime.dto.LoginRequest
import no.sogn.gardentime.dto.MessageResponse
import no.sogn.gardentime.dto.RegisterRequest
import no.sogn.gardentime.service.AuthService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/register")
    fun register(@RequestBody request: RegisterRequest): ResponseEntity<*> {
        return try {
            val response = authService.register(request)
            ResponseEntity.ok(response)
        } catch (e: IllegalArgumentException) {
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(MessageResponse(e.message ?: "Registration failed"))
        }
    }

    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<*> {
        return try {
            val response = authService.login(request)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Invalid username or password"))
        }
    }
}

