package no.sogn.gardentime.dto

import java.time.LocalDateTime
import java.util.UUID

data class UserProfileResponse(
    val id: UUID,
    val email: String,
    val username: String,
    val firstName: String?,
    val lastName: String?,
    val role: String,
    val createdAt: LocalDateTime
)

data class UpdateProfileRequest(
    val firstName: String?,
    val lastName: String?
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

data class DeleteAccountRequest(
    val password: String
)
