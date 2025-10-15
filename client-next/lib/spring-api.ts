import axios from 'axios';

// Spring Boot backend URL - configure via environment variable
const SPRING_BACKEND_URL = process.env.SPRING_BACKEND_URL || 'http://localhost:8080';

export const springApi = axios.create({
  baseURL: SPRING_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract token from cookie or header
export function getTokenFromRequest(request: Request): string | null {
  // First try Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then try cookie
  const cookies = request.headers.get('Cookie');
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('authToken='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }

  return null;
}

// Generic proxy call used by Next.js route handlers to reach the Spring backend.
// Ensures absolute URL, merges provided headers, and forwards auth header if present.
export async function callSpringApi(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${SPRING_BACKEND_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  // Remove empty Authorization header to avoid sending "Authorization: "
  if (!headers['Authorization']) {
    delete headers['Authorization'];
  }
  return fetch(url, { ...options, headers });
}
