package no.sogn.gardentime.db

import no.sogn.gardentime.model.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface UserRepository : JpaRepository<UserEntity, UUID> {
    @Query("SELECT u FROM UserEntity u WHERE u._username = :username")
    fun findByUsername(username: String): Optional<UserEntity>

    @Query("SELECT u FROM UserEntity u WHERE u.email = :email")
    fun findByEmail(email: String): Optional<UserEntity>

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserEntity u WHERE u._username = :username")
    fun existsByUsername(username: String): Boolean

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserEntity u WHERE u.email = :email")
    fun existsByEmail(email: String): Boolean
    
    @Query("SELECT u FROM UserEntity u WHERE u.passwordResetToken = :token")
    fun findByPasswordResetToken(token: String): Optional<UserEntity>
}
