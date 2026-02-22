/**
 * Extracts a user-friendly error message from various error types.
 * Handles Axios errors, standard Error objects, and unknown error types.
 */
export function extractErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof Error) {
    // Check if it's an Axios-like error with response data
    const axiosError = err as Error & {
      response?: { data?: { message?: string } };
    };
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    return err.message;
  }

  if (typeof err === 'object' && err !== null) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return errorObj.response?.data?.message || errorObj.message || fallback;
  }

  if (typeof err === 'string') {
    return err;
  }

  return fallback;
}
