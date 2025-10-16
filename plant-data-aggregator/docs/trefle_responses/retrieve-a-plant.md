### retrieve a plan 

GET /api/v1/plants/{id}

```json
{
  "data": {
    "id": 238331,
    "common_name": null,
    "slug": "senecio-gamolepis",
    "scientific_name": "Senecio gamolepis",
    "main_species_id": 273225,
    "image_url": null,
    "year": 1955,
    "bibliography": "Notas Mus. La Plata, Bot. 18(89): 222 (1955)",
    "author": "Cabrera",
    "family_common_name": "Aster family",
    "genus_id": 669,
    "observations": "Peru",
    "vegetable": false,
    "links": {
      "self": "/api/v1/plants/senecio-gamolepis",
      "species": "/api/v1/plants/senecio-gamolepis/species",
      "genus": "/api/v1/genus/senecio"
    },
    "main_species": {
      "id": 273225,
      "common_name": null,
      "slug": "senecio-gamolepis",
      "scientific_name": "Senecio gamolepis",
      "year": 1955,
      "bibliography": "Notas Mus. La Plata, Bot. 18(89): 222 (1955)",
      "author": "Cabrera",
      "status": "accepted",
      "rank": "species",
      "family_common_name": "Aster family",
      "genus_id": 669,
      "observations": "Peru",
      "vegetable": false,
      "image_url": null,
      "genus": "Senecio",
      "family": "Asteraceae",
      "duration": null,
      "edible_part": null,
      "edible": false,
      "images": {
        "flower": [],
        "leaf": [],
        "habit": [],
        "fruit": [],
        "bark": [],
        "other": []
      },
      "common_names": {},
      "distribution": {
        "native": [
          "Peru"
        ]
      },
      "distributions": {
        "native": [
          {
            "id": 141,
            "name": "Peru",
            "slug": "per",
            "tdwg_code": "PER",
            "tdwg_level": 3,
            "species_count": 1,
            "links": {
              "self": "/api/v1/distributions/per",
              "plants": "/api/v1/distributions/per/plants",
              "species": "/api/v1/distributions/per/species"
            }
          }
        ]
      },
      "flower": {
        "color": null,
        "conspicuous": null
      },
      "foliage": {
        "texture": null,
        "color": null,
        "leaf_retention": null
      },
      "fruit_or_seed": {
        "conspicuous": null,
        "color": null,
        "shape": null,
        "seed_persistence": null
      },
      "specifications": {
        "ligneous_type": null,
        "growth_form": null,
        "growth_habit": null,
        "growth_rate": null,
        "average_height": {
          "cm": null
        },
        "maximum_height": {
          "cm": null
        },
        "nitrogen_fixation": null,
        "shape_and_orientation": null,
        "toxicity": null
      },
      "growth": {
        "description": null,
        "sowing": null,
        "days_to_harvest": null,
        "row_spacing": {
          "cm": null
        },
        "spread": {
          "cm": null
        },
        "ph_maximum": null,
        "ph_minimum": null,
        "light": null,
        "atmospheric_humidity": null,
        "growth_months": null,
        "bloom_months": null,
        "fruit_months": null,
        "minimum_precipitation": {
          "mm": null
        },
        "maximum_precipitation": {
          "mm": null
        },
        "minimum_root_depth": {
          "cm": null
        },
        "minimum_temperature": {
          "deg_f": null,
          "deg_c": null
        },
        "maximum_temperature": {
          "deg_f": null,
          "deg_c": null
        },
        "soil_nutriments": null,
        "soil_salinity": null,
        "soil_texture": null,
        "soil_humidity": null
      },
      "links": {
        "self": "/api/v1/species/senecio-gamolepis",
        "plant": "/api/v1/plants/senecio-gamolepis",
        "genus": "/api/v1/genus/senecio"
      },
      "synonyms": [],
      "sources": [
        {
          "last_update": "2020-06-18T13:57:00.000Z",
          "id": "urn:lsid:ipni.org:names:233132-2",
          "name": "POWO",
          "url": "http://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:233132-2",
          "citation": "POWO (2019). Plants of the World Online. Facilitated by the Royal Botanic Gardens, Kew. Published on the Internet; http://www.plantsoftheworldonline.org/ Retrieved 2020-06-18"
        },
        {
          "last_update": "2019-01-12T09:23:50.000Z",
          "id": "2739460",
          "name": "Tropicos",
          "url": "http://legacy.tropicos.org/Name/2739460",
          "citation": "Tropicos, botanical information system at the Missouri Botanical Garden - www.tropicos.org"
        },
        {
          "last_update": "2020-07-18T13:33:30.000Z",
          "id": "4234505",
          "name": "GBIF",
          "url": "https://www.gbif.org/species/4234505",
          "citation": null
        }
      ]
    },
    "genus": {
      "id": 669,
      "name": "Senecio",
      "slug": "senecio",
      "links": {
        "self": "/api/v1/genus/senecio",
        "plants": "/api/v1/genus/senecio/plants",
        "species": "/api/v1/genus/senecio/species",
        "family": "/api/v1/families/asteraceae"
      }
    },
    "family": {
      "id": 13,
      "name": "Asteraceae",
      "common_name": "Aster family",
      "slug": "asteraceae",
      "links": {
        "self": "/api/v1/families/asteraceae",
        "division_order": "/api/v1/division_orders/asterales",
        "genus": "/api/v1/families/asteraceae/genus"
      }
    },
    "species": [
      {
        "id": 273225,
        "common_name": null,
        "slug": "senecio-gamolepis",
        "scientific_name": "Senecio gamolepis",
        "year": 1955,
        "bibliography": "Notas Mus. La Plata, Bot. 18(89): 222 (1955)",
        "author": "Cabrera",
        "status": "accepted",
        "rank": "species",
        "family_common_name": "Aster family",
        "genus_id": 669,
        "image_url": null,
        "synonyms": [],
        "genus": "Senecio",
        "family": "Asteraceae",
        "links": {
          "self": "/api/v1/species/senecio-gamolepis",
          "plant": "/api/v1/plants/senecio-gamolepis",
          "genus": "/api/v1/genus/senecio"
        }
      }
    ],
    "subspecies": [],
    "varieties": [],
    "hybrids": [],
    "forms": [],
    "subvarieties": [],
    "sources": [
      {
        "last_update": "2020-06-18T13:57:00.000Z",
        "id": "urn:lsid:ipni.org:names:233132-2",
        "name": "POWO",
        "url": "http://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:233132-2",
        "citation": "POWO (2019). Plants of the World Online. Facilitated by the Royal Botanic Gardens, Kew. Published on the Internet; http://www.plantsoftheworldonline.org/ Retrieved 2020-06-18"
      },
      {
        "last_update": "2019-01-12T09:23:50.000Z",
        "id": "2739460",
        "name": "Tropicos",
        "url": "http://legacy.tropicos.org/Name/2739460",
        "citation": "Tropicos, botanical information system at the Missouri Botanical Garden - www.tropicos.org"
      },
      {
        "last_update": "2020-07-18T13:33:30.000Z",
        "id": "4234505",
        "name": "GBIF",
        "url": "https://www.gbif.org/species/4234505",
        "citation": null
      }
    ]
  },
  "meta": {
    "last_modified": "2020-12-13T12:27:15.563Z"
  }
}
```