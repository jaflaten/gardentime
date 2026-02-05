package no.sogn.gardentime.service

import no.sogn.gardentime.db.UserRepository
import no.sogn.gardentime.dto.ChangePasswordRequest
import no.sogn.gardentime.dto.UpdateProfileRequest
import no.sogn.gardentime.dto.UserProfileResponse
import no.sogn.gardentime.model.UserEntity
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)

    fun getProfile(user: UserEntity): UserProfileResponse {
        return UserProfileResponse(
            id = user.id!!,
            email = user.email,
            username = user.username,
            firstName = user.firstName,
            lastName = user.lastName,
            role = user.role.name,
            createdAt = user.createdAt
        )
    }

    fun updateProfile(user: UserEntity, request: UpdateProfileRequest): UserProfileResponse {
        val updatedUser = UserEntity(
            id = user.id,
            email = user.email,
            _username = user.username,
            _password = user.password,
            firstName = request.firstName ?: user.firstName,
            lastName = request.lastName ?: user.lastName,
            role = user.role,
            enabled = user.enabled,
            createdAt = user.createdAt,
            updatedAt = LocalDateTime.now()
        )
        
        val savedUser = userRepository.save(updatedUser)
        return getProfile(savedUser)
    }

    fun changePassword(user: UserEntity, request: ChangePasswordRequest) {
        if (!passwordEncoder.matches(request.currentPassword, user.password)) {
            throw IllegalArgumentException("Current password is incorrect")
        }

        if (request.newPassword.length < 8) {
            throw IllegalArgumentException("New password must be at least 8 characters")
        }

        val updatedUser = UserEntity(
            id = user.id,
            email = user.email,
            _username = user.username,
            _password = passwordEncoder.encode(request.newPassword),
            firstName = user.firstName,
            lastName = user.lastName,
            role = user.role,
            enabled = user.enabled,
            createdAt = user.createdAt,
            updatedAt = LocalDateTime.now()
        )
        
        userRepository.save(updatedUser)
    }

    fun deleteAccount(user: UserEntity, password: String) {
        if (!passwordEncoder.matches(password, user.password)) {
            throw IllegalArgumentException("Password is incorrect")
        }

        logger.info("Deleting account for user: ${user.username} (${user.email})")
        userRepository.delete(user)
        logger.info("Account deleted successfully for user: ${user.username}")
    }
}
