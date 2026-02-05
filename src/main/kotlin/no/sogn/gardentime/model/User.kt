package no.sogn.gardentime.model

import jakarta.persistence.*
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.time.LocalDateTime
import java.util.*

data class User(
    val id: UUID? = null,
    val email: String,
    val username: String,
    val password: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val role: UserRole = UserRole.USER,
    val enabled: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "user_entity")
class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(unique = true, nullable = false)
    val email: String,

    @Column(name = "username", unique = true, nullable = false)
    private val _username: String,

    @Column(name = "password", nullable = false)
    private var _password: String,

    val firstName: String? = null,
    val lastName: String? = null,

    @Enumerated(EnumType.STRING)
    val role: UserRole = UserRole.USER,

    val enabled: Boolean = true,

    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "password_reset_token")
    var passwordResetToken: String? = null,
    
    @Column(name = "password_reset_token_expiry")
    var passwordResetTokenExpiry: LocalDateTime? = null
) : UserDetails {

    constructor() : this(null, "", "", "", null, null, UserRole.USER, true, LocalDateTime.now(), LocalDateTime.now(), null, null)

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> {
        return mutableListOf(SimpleGrantedAuthority("ROLE_${role.name}"))
    }

    override fun getPassword(): String = _password

    override fun getUsername(): String = _username

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = true

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = enabled

    fun setPassword(password: String) {
        this._password = password
    }
}

enum class UserRole {
    USER,
    ADMIN
}

fun mapToUserEntity(user: User): UserEntity {
    return UserEntity(
        id = user.id,
        email = user.email,
        _username = user.username,
        _password = user.password,
        firstName = user.firstName,
        lastName = user.lastName,
        role = user.role,
        enabled = user.enabled,
        createdAt = user.createdAt,
        updatedAt = user.updatedAt
    )
}

fun mapToUser(userEntity: UserEntity): User {
    return User(
        id = userEntity.id,
        email = userEntity.email,
        username = userEntity.username,
        password = userEntity.password,
        firstName = userEntity.firstName,
        lastName = userEntity.lastName,
        role = userEntity.role,
        enabled = userEntity.enabled,
        createdAt = userEntity.createdAt,
        updatedAt = userEntity.updatedAt
    )
}
