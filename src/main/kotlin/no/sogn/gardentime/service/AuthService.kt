package no.sogn.gardentime.service

import no.sogn.gardentime.db.UserRepository
import no.sogn.gardentime.dto.AuthResponse
import no.sogn.gardentime.dto.ForgotPasswordRequest
import no.sogn.gardentime.dto.LoginRequest
import no.sogn.gardentime.dto.RegisterRequest
import no.sogn.gardentime.dto.ResetPasswordRequest
import no.sogn.gardentime.model.UserEntity
import no.sogn.gardentime.model.UserRole
import no.sogn.gardentime.security.JwtService
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val authenticationManager: AuthenticationManager
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)

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
            email = savedUser.email,
            firstName = savedUser.firstName
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
            email = user.email,
            firstName = user.firstName
        )
    }

    fun forgotPassword(request: ForgotPasswordRequest) {
        val user = userRepository.findByEmail(request.email).orElse(null)
        
        // Always return success to prevent email enumeration
        if (user == null) {
            logger.info("Password reset requested for non-existent email: ${request.email}")
            return
        }

        val resetToken = UUID.randomUUID().toString()
        val expiry = LocalDateTime.now().plusHours(1)

        user.passwordResetToken = resetToken
        user.passwordResetTokenExpiry = expiry
        userRepository.save(user)

        // Log the token (in production, this would send an email)
        logger.info("═══════════════════════════════════════════════════════════")
        logger.info("PASSWORD RESET TOKEN for ${user.email}")
        logger.info("Token: $resetToken")
        logger.info("Expires: $expiry")
        logger.info("Reset URL: http://localhost:3000/reset-password?token=$resetToken")
        logger.info("═══════════════════════════════════════════════════════════")
    }

    fun resetPassword(request: ResetPasswordRequest) {
        if (request.newPassword.length < 8) {
            throw IllegalArgumentException("Password must be at least 8 characters")
        }

        val user = userRepository.findByPasswordResetToken(request.token)
            .orElseThrow { IllegalArgumentException("Invalid or expired reset token") }

        if (user.passwordResetTokenExpiry == null || user.passwordResetTokenExpiry!!.isBefore(LocalDateTime.now())) {
            throw IllegalArgumentException("Reset token has expired")
        }

        user.setPassword(passwordEncoder.encode(request.newPassword))
        user.passwordResetToken = null
        user.passwordResetTokenExpiry = null
        userRepository.save(user)

        logger.info("Password reset successful for user: ${user.username}")
    }
}
