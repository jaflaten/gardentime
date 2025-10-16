## plant disease list
These files are meant as guidance to understand the Perentual API.

GET https://perenual.com/api/pest-disease-list?key=[YOUR-API-KEY]
<!-- Example JSON Response -->

    {
        "data": [
            {
                "id": 2,
                "common_name": "Fungi Nuisance",
                "scientific_name": " Panaeolus foenisecii/",
                "other_name": [
                    "Nuisance fungi"
                ],
                "family": null,
                "description": null,
                "solution": null,
                "host": [
                    "all lawn grasses"
                ],
                "images": [
                    {
                        "license": 45,
                        "license_name": "Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)",
                        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/deed.en",
                        "original_url": "https://perenual.com/storage/species_disease/2__/og/Panaeolus_foenisecii_124316833.jpg",
                        "regular_url": "https://perenual.com/storage/species_disease/2__/regular/Panaeolus_foenisecii_124316833.jpg",
                        "medium_url": "https://perenual.com/storage/species_disease/2__/medium/Panaeolus_foenisecii_124316833.jpg",
                        "small_url": "https://perenual.com/storage/species_disease/2__/small/Panaeolus_foenisecii_124316833.jpg",
                        "thumbnail": "https://perenual.com/storage/species_disease/2__/thumbnail/Panaeolus_foenisecii_124316833.jpg"
                    }
                ]
            }
            ...
        ],
        "to": 30,
        "per_page": 30,
        "current_page": 1,
        "from": 1,
        "last_page": 8,
        "total": 239
    }