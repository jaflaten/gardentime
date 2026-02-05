package no.sogn.gardentime.dto

data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val username: String,
    val password: String,
    val firstName: String? = null,
    val lastName: String? = null
)

data class AuthResponse(
    val token: String,
    val type: String = "Bearer",
    val username: String,
    val email: String,
    val firstName: String? = null
)

data class MessageResponse(
    val message: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val token: String,
    val newPassword: String
)

