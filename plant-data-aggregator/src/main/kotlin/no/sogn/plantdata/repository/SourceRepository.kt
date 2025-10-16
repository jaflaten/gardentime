package no.sogn.plantdata.repository

import no.sogn.plantdata.enums.SourceType
import no.sogn.plantdata.model.Source
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface SourceRepository : JpaRepository<Source, UUID> {
    fun findByTypeAndTitle(type: SourceType, title: String): Source?
}

