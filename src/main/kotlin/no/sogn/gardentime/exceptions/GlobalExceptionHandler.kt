package no.sogn.gardentime.exceptions

// NOTE: This file previously declared a @RestControllerAdvice GlobalExceptionHandler that
// conflicted with the canonical handler in package no.sogn.gardentime.api.
// It has been intentionally deactivated. Use the handler in `api.GlobalExceptionHandler`.
// Keeping this file (without a bean definition) to preserve git history and avoid re‑introducing it.

@Deprecated("Use no.sogn.gardentime.api.GlobalExceptionHandler")
class LegacyGlobalExceptionHandler // no annotations, not a Spring bean
