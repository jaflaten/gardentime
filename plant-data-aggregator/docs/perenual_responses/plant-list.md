## Plant list 
These files are meant as guidance to understand the Perentual API.
GET https://perenual.com/api/v2/species-list?key=[YOUR-API-KEY]

<!-- Example JSON Response -->
```json

{
"data": [
{
"id": 1,
"common_name": "European Silver Fir",
"scientific_name": [
"Abies alba"
],
"other_name": [
"Common Silver Fir"
],
"family": null,
"hybrid": null,
"authority": null,
"subspecies": null,
"cultivar": null,
"variety": null,
"species_epithet": "alba",
"genus": "Abies",
"default_image": {
"image_id": 9,
"license": 5,
"license_name": "Attribution-ShareAlike License",
"license_url": "https://creativecommons.org/licenses/by-sa/2.0/",
"original_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/og/49255769768_df55596553_b.jpg",
"regular_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/regular/49255769768_df55596553_b.jpg",
"medium_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/medium/49255769768_df55596553_b.jpg",
"small_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/small/49255769768_df55596553_b.jpg",
"thumbnail": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/thumbnail/49255769768_df55596553_b.jpg"
}
},
{
"id": 2,
"common_name": "Pyramidalis Silver Fir",
"scientific_name": [
"Abies alba 'Pyramidalis'"
],
"other_name": null,
"family": null,
"hybrid": null,
"authority": null,
"subspecies": null,
"cultivar": "Pyramidalis",
"variety": null,
"species_epithet": "alba",
"genus": "Abies",
"default_image": {
"image_id": 9,
"license": 5,
"license_name": "Attribution-ShareAlike License",
"license_url": "https://creativecommons.org/licenses/by-sa/2.0/",
"original_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/og/49255769768_df55596553_b.jpg",
"regular_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/regular/49255769768_df55596553_b.jpg",
"medium_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/medium/49255769768_df55596553_b.jpg",
"small_url": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/small/49255769768_df55596553_b.jpg",
"thumbnail": "https://perenual.com/storage/species_image/2_abies_alba_pyramidalis/thumbnail/49255769768_df55596553_b.jpg"
}
}
...
],
"to": 30,
"per_page": 30,
"current_page": 1,
"from": 1,
"last_page": 405,
"total": 10104
}
```
