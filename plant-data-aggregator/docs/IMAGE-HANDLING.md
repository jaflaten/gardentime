# Image Handling in Plant Data Aggregator

## Current Status

Images are **handled** in the DTOs but not yet stored locally. Both Trefle and Perenual APIs provide image URLs that can be displayed directly in frontend applications.

## Image Data Structure

### Perenual Images

Perenual provides rich image metadata with multiple sizes:

```kotlin
data class PerenualImage(
    val imageId: Long? = null,
    val license: Int? = null,
    val licenseName: String? = null,
    val licenseUrl: String? = null,
    val originalUrl: String? = null,     // Full resolution
    val regularUrl: String? = null,      // Regular size
    val mediumUrl: String? = null,       // Medium size
    val smallUrl: String? = null,        // Small size
    val thumbnail: String? = null        // Thumbnail
)
```

**Available in DTO:**
- `defaultImage`: Primary plant image
- `otherImages`: Additional images (requires Supreme plan upgrade on Perenual)

### Trefle Images

Trefle provides image URLs organized by plant part:

```kotlin
data class TrefleImages(
    val flower: List<String>? = null,
    val leaf: List<String>? = null,
    val habit: List<String>? = null,
    val fruit: List<String>? = null,
    val bark: List<String>? = null,
    val other: List<String>? = null
)
```

## API Limitations

### Perenual Free Tier
- ✅ `default_image` is available for most plants
- ❌ `other_images` requires **Supreme plan** upgrade
- When not available, returns: `"Upgrade Plan To Supreme For Access https://perenual.com/subscription-api-pricing. Im sorry"`

### Trefle Free Tier
- ✅ Full image access included
- ✅ Multiple images per plant part
- ✅ 60 requests/minute rate limit

## Current Implementation

### Deserialization Fix
The `other_images` field uses a custom deserializer to handle both formats:

```kotlin
@JsonProperty("other_images") 
@JsonDeserialize(using = FlexibleImageListDeserializer::class)
val otherImages: List<PerenualImage>? = null
```

This prevents crashes when the API returns a string message instead of an array.

### Usage in Frontend (Current)
```bash
# Get plant with image URLs
curl http://localhost:8081/api/perenual/plants/2292

{
  "id": 2292,
  "common_name": "tree tomato",
  "default_image": {
    "thumbnail": "https://perenual.com/storage/.../thumbnail/...",
    "small_url": "https://perenual.com/storage/.../small/...",
    "medium_url": "https://perenual.com/storage/.../medium/...",
    "regular_url": "https://perenual.com/storage/.../regular/...",
    "original_url": "https://perenual.com/storage/.../og/..."
  }
}
```

Frontend apps can display images directly using these URLs.

## Future Enhancement: Local Image Storage

### Why Store Images Locally?

1. **Performance**: Faster loading from local storage
2. **Reliability**: Not dependent on external API availability
3. **Offline Support**: Can work without internet connection
4. **Cost**: Reduce API calls (though image URLs are free)
5. **Thumbnails**: Generate custom sizes optimized for your app

### Implementation Approach

#### Option 1: Database Storage (Simple)
Store images as BLOB in PostgreSQL:

```kotlin
@Entity
data class PlantImage(
    @Id @GeneratedValue
    val id: Long = 0,
    
    val plantId: Long,
    val sourceApi: String,  // "PERENUAL" or "TREFLE"
    
    val imageType: String,  // "default", "flower", "leaf", etc.
    val size: String,       // "thumbnail", "medium", "original"
    
    @Lob
    val imageData: ByteArray,
    val contentType: String,  // "image/jpeg", "image/png"
    
    val license: String? = null,
    val licenseUrl: String? = null,
    val sourceUrl: String,
    
    @CreationTimestamp
    val downloadedAt: Instant
)
```

#### Option 2: File System Storage (Better Performance)
Store images as files with database metadata:

```kotlin
@Entity
data class PlantImage(
    @Id @GeneratedValue
    val id: Long = 0,
    
    val plantId: Long,
    val sourceApi: String,
    val imageType: String,
    val size: String,
    
    val filePath: String,        // "/images/perenual/2292/default_thumbnail.jpg"
    val contentType: String,
    val fileSize: Long,
    
    val license: String? = null,
    val licenseUrl: String? = null,
    val sourceUrl: String,
    
    @CreationTimestamp
    val downloadedAt: Instant
)
```

Storage structure:
```
/var/plant-images/
  perenual/
    2292/
      default_thumbnail.jpg
      default_medium.jpg
      default_original.jpg
  trefle/
    12345/
      flower_0.jpg
      flower_1.jpg
      leaf_0.jpg
```

#### Option 3: Cloud Storage (Production Ready)
Use S3/MinIO for scalable storage:

```kotlin
@Service
class ImageStorageService(
    private val s3Client: S3Client,
    @Value("\${image.bucket}") private val bucketName: String
) {
    suspend fun downloadAndStore(imageUrl: String, plantId: Long): String {
        val imageBytes = downloadImage(imageUrl)
        val key = "plants/$plantId/${UUID.randomUUID()}.jpg"
        
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/jpeg")
                .build(),
            RequestBody.fromBytes(imageBytes)
        )
        
        return s3Client.utilities().getUrl { it.bucket(bucketName).key(key) }.toString()
    }
}
```

### Image Download Service

```kotlin
@Service
class PlantImageDownloadService(
    private val imageRepository: PlantImageRepository,
    private val restClient: RestClient
) {
    
    suspend fun downloadPlantImages(plantDetail: PerenualSpeciesDetail) {
        plantDetail.defaultImage?.let { image ->
            // Download different sizes
            image.thumbnail?.let { downloadAndStore(it, plantDetail.id, "default", "thumbnail") }
            image.mediumUrl?.let { downloadAndStore(it, plantDetail.id, "default", "medium") }
            image.originalUrl?.let { downloadAndStore(it, plantDetail.id, "default", "original") }
        }
        
        // Download other images if available
        plantDetail.otherImages?.forEach { image ->
            image.thumbnail?.let { downloadAndStore(it, plantDetail.id, "other", "thumbnail") }
        }
    }
    
    private suspend fun downloadAndStore(url: String, plantId: Long, type: String, size: String) {
        // Check if already downloaded
        if (imageRepository.existsByPlantIdAndTypeAndSize(plantId, type, size)) {
            return
        }
        
        // Download image
        val imageBytes = restClient.get()
            .uri(url)
            .retrieve()
            .body(ByteArray::class.java) ?: return
        
        // Store to file system or database
        val filePath = saveToFileSystem(imageBytes, plantId, type, size)
        
        // Save metadata
        imageRepository.save(PlantImage(
            plantId = plantId,
            sourceApi = "PERENUAL",
            imageType = type,
            size = size,
            filePath = filePath,
            contentType = "image/jpeg",
            fileSize = imageBytes.size.toLong(),
            sourceUrl = url
        ))
    }
}
```

### Serving Stored Images

```kotlin
@RestController
@RequestMapping("/api/images")
class ImageController(
    private val imageRepository: PlantImageRepository
) {
    
    @GetMapping("/plants/{plantId}/{type}/{size}")
    fun getPlantImage(
        @PathVariable plantId: Long,
        @PathVariable type: String,
        @PathVariable size: String
    ): ResponseEntity<ByteArray> {
        val image = imageRepository.findByPlantIdAndTypeAndSize(plantId, type, size)
            ?: return ResponseEntity.notFound().build()
        
        val imageBytes = readFromFileSystem(image.filePath)
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(image.contentType))
            .body(imageBytes)
    }
}
```

## Recommendations

### Short Term (Current)
✅ **Use image URLs directly** - Pass URLs to frontend, let browser cache handle it
- Simple implementation
- No storage costs
- Relies on external API availability

### Medium Term
🔄 **Implement lazy background download** - Download images after plant data is fetched
- Download images in background job
- Store in file system
- Serve from local storage with fallback to original URL

### Long Term
🚀 **Full CDN integration** - Use CDN for optimized delivery
- Download and optimize images
- Upload to CDN (CloudFront, Cloudflare, etc.)
- Generate responsive image sizes
- Implement cache invalidation

## License Considerations

**Important**: Both APIs provide license information with images.

### Perenual Images
```json
{
  "license": 5,
  "license_name": "Attribution-ShareAlike License",
  "license_url": "https://creativecommons.org/licenses/by-sa/2.0/"
}
```

### Best Practices
1. **Store license info** with each image
2. **Display attribution** when showing images
3. **Include license URL** for user reference
4. **Respect usage terms** per license type

## Testing Image Handling

```bash
# Test with image data
curl http://localhost:8081/api/perenual/plants/2292 | jq '.default_image'

# Expected output (free tier):
{
  "license": 5,
  "license_name": "Attribution-ShareAlike License",
  "license_url": "https://creativecommons.org/licenses/by-sa/2.0/",
  "thumbnail": "https://perenual.com/storage/.../thumbnail/...",
  "small_url": "https://perenual.com/storage/.../small/...",
  "medium_url": "https://perenual.com/storage/.../medium/...",
  "regular_url": "https://perenual.com/storage/.../regular/...",
  "original_url": "https://perenual.com/storage/.../og/..."
}

# Test other_images (will be null on free tier)
curl http://localhost:8081/api/perenual/plants/2292 | jq '.other_images'
# Output: null (not an error - just not available on free plan)
```

## Summary

✅ **Fixed**: Image deserialization no longer crashes when API returns upgrade message
✅ **Available**: Image URLs are returned in all API responses
🔄 **Future**: Implement local storage for better performance and offline support
