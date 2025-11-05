package no.sogn.gardentime.api.v1

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PlantDataControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `should list all plants with pagination`() {
        mockMvc.get("/api/v1/plant-data/plants?size=5") {
        }.andExpect {
            status { isOk() }
            content { contentType("application/json") }
            jsonPath("$.plants") { isArray() }
            jsonPath("$.pagination.totalElements") { isNumber() }
        }
    }

    @Test
    fun `should get plant by slug`() {
        mockMvc.get("/api/v1/plant-data/plants/tomatoes") {
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Tomato") }
            jsonPath("$.slug") { value("tomatoes") }
            jsonPath("$.family.name") { exists() }
        }
    }

    @Test
    fun `should return 404 for non-existent plant`() {
        mockMvc.get("/api/v1/plant-data/plants/nonexistent-plant") {
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `should filter plants by feeder type`() {
        mockMvc.get("/api/v1/plant-data/plants?feederType=HEAVY") {
        }.andExpect {
            status { isOk() }
            jsonPath("$.plants[0].feederType") { value("HEAVY") }
        }
    }

    @Test
    fun `should filter plants by frost tolerance`() {
        mockMvc.get("/api/v1/plant-data/plants?frostTolerant=true") {
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `should list all families`() {
        mockMvc.get("/api/v1/plant-data/families") {
        }.andExpect {
            status { isOk() }
            jsonPath("$.families") { isArray() }
            jsonPath("$.families[0].name") { exists() }
        }
    }

    @Test
    fun `should get plants by family name`() {
        mockMvc.get("/api/v1/plant-data/families/Solanaceae/plants") {
        }.andExpect {
            status { isOk() }
            jsonPath("$.family.name") { value("Solanaceae") }
            jsonPath("$.plants") { isArray() }
        }
    }
}
