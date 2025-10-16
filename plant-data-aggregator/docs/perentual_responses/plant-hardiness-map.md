## plant hardiness map
These files are meant as guidance to understand the Perentual API.

GET https://perenual.com/api/hardiness-map?species_id=[ID]&key=[YOUR-API-KEY]


The response appears to be an image

example request 
```kotlin
// Example Kotlin Component

val client = OkHttpClient()
val request = Request.Builder()
  .url("https://perenual.com/api/hardiness-map?species_id=[ID]&key=[YOUR-API-KEY]")
  .build()
val response = client.newCall(request).execute()


```