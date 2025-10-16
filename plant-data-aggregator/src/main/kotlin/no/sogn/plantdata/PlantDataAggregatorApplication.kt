package no.sogn.plantdata

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class PlantDataAggregatorApplication

fun main(args: Array<String>) {
    runApplication<PlantDataAggregatorApplication>(*args)
}

