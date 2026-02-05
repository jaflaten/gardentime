package no.sogn.gardentime.api

import no.sogn.gardentime.dto.ChangePasswordRequest
import no.sogn.gardentime.dto.DeleteAccountRequest
import no.sogn.gardentime.dto.MessageResponse
import no.sogn.gardentime.dto.UpdateProfileRequest
import no.sogn.gardentime.dto.UserProfileResponse
import no.sogn.gardentime.model.UserEntity
import no.sogn.gardentime.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @GetMapping("/me")
    fun getProfile(@AuthenticationPrincipal user: UserEntity): ResponseEntity<UserProfileResponse> {
        val profile = userService.getProfile(user)
        return ResponseEntity.ok(profile)
    }

    @PutMapping("/me")
    fun updateProfile(
        @AuthenticationPrincipal user: UserEntity,
        @RequestBody request: UpdateProfileRequest
    ): ResponseEntity<UserProfileResponse> {
        val profile = userService.updateProfile(user, request)
        return ResponseEntity.ok(profile)
    }

    @PutMapping("/me/password")
    fun changePassword(
        @AuthenticationPrincipal user: UserEntity,
        @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<*> {
        return try {
            userService.changePassword(user, request)
            ResponseEntity.ok(MessageResponse("Password changed successfully"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(MessageResponse(e.message ?: "Password change failed"))
        }
    }

    @DeleteMapping("/me")
    fun deleteAccount(
        @AuthenticationPrincipal user: UserEntity,
        @RequestBody request: DeleteAccountRequest
    ): ResponseEntity<*> {
        return try {
            userService.deleteAccount(user, request.password)
            ResponseEntity.ok(MessageResponse("Account deleted successfully"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(MessageResponse(e.message ?: "Account deletion failed"))
        }
    }
}
