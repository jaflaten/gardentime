## plant details
These files are meant as guidance to understand the Perentual API.
GET https://perenual.com/api/v2/species/details/[ID]?key=[YOUR-API-KEY]

<!-- Example JSON Response -->

```json
{
  "id": 1,
  "common_name": "European Silver Fir",
  "scientific_name": [
    "Abies alba"
  ],
  "other_name": [
    "Common Silver Fir"
  ],
  "family": "",
  "origin": null,
  "type": "tree",
  "dimensions": {
    "type": null,
    "min_value": 1,
    "max_value": 1.5,
    "unit": "feet"
  },
  "cycle": "Perennial",
  "watering": "Frequent",
  "watering_general_benchmark": {
    "value": 5-7,
    "unit": "days"
  },
  "plant_anatomy": [
    {
      "part": "leaves",
      "color": [
        "dark-green"
      ]
    },
    {
      "part": "branches",
      "color": [
        "dark-brown"
      ]
    },
    {
      "part": "twigs",
      "color": [
        "brown"
      ]
    }
  ],
  "sunlight": [
    "Part shade"
  ],
  "pruning_month": [
    "March",
    "April"
  ],
  "pruning_count": {
    "amount": 1,
    "interval": "yearly"
  },
  "seeds": 0,
  "attracts":[
    "bees",
    "birds",
    "rabbits"
  ],
  "propagation":[
    "seed",
    "cutting"
  ],
  "hardiness": {
    "min": "7",
    "max": "7"
  },
  "hardiness_location": {
    "full_url": "https://perenual.com/api/hardiness-map-sample?map=h&key=[YOUR-API-KEY]",
    "full_iframe": "<iframe src='https://perenual.com/api/hardiness-map-sample?map=1-13&key=[YOUR-API-KEY]'
    width=1000 height=550 ></iframe>"
  },
  "flowers": true,
  "flowering_season": "Spring",
  "sunlight": [
    "full sun",
    "part shade"
  ],
  "soil": [],
  "pest_susceptibility": null,
  "cones": true,
  "fruits": false,
  "edible_fruit": false,
  "fruiting_season": null,
  "harvest_season": null,
  "harvest_method": "cutting",
  "leaf": true,
  "edible_leaf": false,
  "growth_rate": "High",
  "maintenance": "Low",
  "medicinal": true,
  "poisonous_to_humans": false,
  "poisonous_to_pets": false,
  "drought_tolerant": false,
  "salt_tolerant": false,
  "thorny": false,
  "invasive": false,
  "rare": false,
  "tropical": false,
  "cuisine": false,
  "indoor": false,
  "care_level": "Medium",
  "description": "Amazing garden plant that is sure to capture attention...",
  "default_image": {
    "image_id": 9,
    "license": 5,
    "license_name": "Attribution-ShareAlike License",
    "license_url": "https://creativecommons.org/licenses/by-sa/2.0/",
    "original_url": "https://perenual.com/storage/species_image/2678_abies_alba_pyramidalis/og/49255768_df596553_b.jpg",
    "regular_url": "https://perenual.com/storage/species_image/2678_abies_alba_pyramidalis/regular/4925769768f55596553_b.jpg",
    "medium_url": "https://perenual.com/storage/species_image/882_abies_alba_pyramidalis/medium/4925576768_f55596553_b.jpg",
    "small_url": "https://perenual.com/storage/species_image/2678_abies_alba_pyramidalis/small/492557668_df55596553_b.jpg",
    "thumbnail": "https://perenual.com/storage/species_image/2786_abies_alba_pyramidalis/thumbnail/4929768_df55596553_b.jpg"
  },
  "other_images":[{
    "image_id": 9,
    "license": 5,
    "license_name": "Attribution-ShareAlike License",
    "license_url": "https://creativecommons.org/licenses/by-sa/2.0/",
    "original_url": "https://perenual.com/storage/species_image/22_abies_alba_pyramidalis/og/4769768_df55596553_b.jpg",
    "regular_url": "https://perenual.com/storage/species_image/22_abies_alba_pyramidalis/regular/492557768_df55596553_b.jpg",
    "medium_url": "https://perenual.com/storage/species_image/22_abies_alba_pyramidalis/medium/49259768_df55596553_b.jpg",
    "small_url": "https://perenual.com/storage/species_image/21_abies_alba_pyramidalis/small/492557668_df556553_b.jpg",
    "thumbnail": "https://perenual.com/storage/species_image/21_abies_alba_pyramidalis/thumbnail/255768_df55553_b.jpg"
  }]...,
  "xWateringQuality": [
    "Rainwater",
    "Distilled Water",
    "Reverse Osmosis Water",
    "Spring Water",
    "Well Water",
    "Aquarium Water",
    "Pond/Lake Water"
  ],
  "xWateringPeriod": [
    "Morning",
    "Evening"
  ],
  "xWateringAvgVolumeRequirement": [],
  "xWateringDepthRequirement": [],
  "xWateringBasedTemperature": {
    "unit": "celcius",
    "min": 10,
    "max": 20
  },
  "xWateringPhLevel": {
    "min": 5.5,
    "max": 6.5
  },
  "xSunlightDuration": {
    "min": "6",
    "max": "",
    "unit": "hours"
  }

}
```