## plant guides
These files are meant as guidance to understand the Perentual API.

GET https://perenual.com/api/species-care-guide-list?key=[YOUR-API-KEY]

```json
<!-- Example JSON Response -->

{
"data": [
{
"id": 4,
"species_id": 1,
"common_name": "European Silver Fir",
"scientific_name": [
"Abies alba bra2",
"Abies alba zas"
],
"section": [
{
"id": 1,
"type": "sunlight",
"description": "Sunlight is the most important environmental factor controlling the growth and health of European silver fir (Abies alba). This species naturally grows in open, sunny habitats and is adapted to full sunlight or partial shade. Without adequate sunlight, the needles of a silver fir will fail to produce adequate amounts of chlorophyll, a key determinant of essential photosynthesis.\n\nWhen exposed to sunlight, the foliage of a European silver fir is usually thick, dense and lush. The needles are usually a deep green color, although in some areas the needles may take on a bluish hue. Sun-exposed needles are typically more abundant and tightly packed than those in more shaded areas. Furthermore, needles of silver fir trees normally grow more rapidly when exposed to direct sunlight.\n\nThe bark of a European silver fir exposed to direct sunlight typically has a more rugged and weathered appearance. Sun-exposed bark may contain lichens and moss, which act as a natural form of sun protection. In areas where the silver fir is shaded, the bark is typically smoother and lighter in color.\n\nSunlight is essential for the optimal growth and health of a European silver fir. Although this species can survive in both full sun and partial shade, it typically performs best when exposed to adequate sunlight."
},
{
"id": 3,
"type": "watering",
"description": "Watering European silver fir trees is essential for them to stay healthy. It is important to provide them with regular watering, especially during their first growing season, as they need to establish a good root system. A weekly deep watering is all they need, but they should be more frequently watered during periods of drought and heat. The soil should always be kept moist but never soggy.\n\nIf they are planted in a container, they should be watered more frequently as they can dry out quickly in containers. The soil should be kept moist but never overly wet. Overwatering can lead to root rot, so be sure not to overwater. When watering a container grown European Silver Fir, wait for the top 1-2 inches of soil to dry out before watering again.\n\nMulching around a European silver fir is a great way to help with water retention and help the soil stay moist. An organic mulch, such as wood chips or shredded bark, can help to keep the soil from drying out and also help reduce the amount of time spent watering. It also helps suppress weeds and keeps the roots protected from extreme temperatures.\n\nOverall, regular and consistent watering is important for young European silver fir trees to help them grow and thrive."
}
]
}
],
"to": 2,
"per_page": 30,
"current_page": 1,
"from": 1,
"last_page": 1,
"total": 2
}
```