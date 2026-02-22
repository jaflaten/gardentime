package no.sogn.gardentime

import no.sogn.gardentime.config.TestContainersConfig
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import

@SpringBootTest
@Import(TestContainersConfig::class)
class GardenTimeApplicationTests {

	@Test
	fun contextLoads() {
	}
}
