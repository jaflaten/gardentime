package no.sogn.gardentime.security

import no.sogn.gardentime.model.UserEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import java.util.*

@Component
class SecurityUtils {

    fun getCurrentUser(): UserEntity {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")

        return authentication.principal as? UserEntity
            ?: throw IllegalStateException("User not authenticated")
    }

    fun getCurrentUserId(): UUID {
        return getCurrentUser().id ?: throw IllegalStateException("User ID not found")
    }
}
