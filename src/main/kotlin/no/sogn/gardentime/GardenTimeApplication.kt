package no.sogn.gardentime

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class GardenTimeApplication

fun main(args: Array<String>) {
	runApplication<GardenTimeApplication>(*args)
}
