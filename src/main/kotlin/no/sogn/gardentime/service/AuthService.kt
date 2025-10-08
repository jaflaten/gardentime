package no.sogn.gardentime.service

import no.sogn.gardentime.db.UserRepository
import no.sogn.gardentime.dto.AuthResponse
import no.sogn.gardentime.dto.LoginRequest
import no.sogn.gardentime.dto.RegisterRequest
import no.sogn.gardentime.model.UserEntity
import no.sogn.gardentime.model.UserRole
import no.sogn.gardentime.security.JwtService
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val authenticationManager: AuthenticationManager
) {

    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByUsername(request.username)) {
            throw IllegalArgumentException("Username already exists")
        }

        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("Email already exists")
        }

        val user = UserEntity(
            email = request.email,
            _username = request.username,
            _password = passwordEncoder.encode(request.password),
            firstName = request.firstName,
            lastName = request.lastName,
            role = UserRole.USER,
            enabled = true,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        val savedUser = userRepository.save(user)
        val token = jwtService.generateToken(savedUser)

        return AuthResponse(
            token = token,
            username = savedUser.username,
            email = savedUser.email
        )
    }

    fun login(request: LoginRequest): AuthResponse {
        authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(
                request.username,
                request.password
            )
        )

        val user = userRepository.findByUsername(request.username)
            .orElseThrow { IllegalArgumentException("Invalid username or password") }

        val token = jwtService.generateToken(user)

        return AuthResponse(
            token = token,
            username = user.username,
            email = user.email
        )
    }
}
