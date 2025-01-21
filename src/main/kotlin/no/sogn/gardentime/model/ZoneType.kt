package no.sogn.gardentime.model

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

enum class ZoneType {
    BOX,
    FIELD,
    BED,
    BUCKET,
}

@Converter(autoApply = true)
class ZoneTypeConverter : AttributeConverter<ZoneType, String> {

    override fun convertToDatabaseColumn(attribute: ZoneType?): String? {
        return attribute?.name // Stores the enum name as a string
    }

    override fun convertToEntityAttribute(dbData: String?): ZoneType? {
        return dbData?.let { ZoneType.valueOf(it) } // Converts back to enum
    }
}