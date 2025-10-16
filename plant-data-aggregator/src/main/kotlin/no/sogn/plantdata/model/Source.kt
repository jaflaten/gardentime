package no.sogn.plantdata.model

import jakarta.persistence.*
import no.sogn.plantdata.enums.SourceType
import java.time.Instant
import java.util.*

@Entity
@Table(name = "sources")
data class Source(
    @Id val id: UUID = UUID.randomUUID(),
    @Enumerated(EnumType.STRING) @Column(name = "type", nullable = false) val type: SourceType,
    @Column(name = "title", nullable = false) val title: String,
    @Column(name = "authors") val authors: String? = null,
    @Column(name = "url") val url: String? = null,
    @Column(name = "accessed_at") val accessedAt: Instant? = null,
    @Column(name = "copyright_ok") val copyrightOk: Boolean? = null,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now()
)
