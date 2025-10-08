import axios from 'axios';

// Spring Boot backend URL - configure via environment variable
const SPRING_BACKEND_URL = process.env.SPRING_BACKEND_URL || 'http://localhost:8080';

export const springApi = axios.create({
  baseURL: SPRING_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to forward auth token from Next.js request to Spring Boot
export function getAuthHeader(request: Request): Record<string, string> {
  const authHeader = request.headers.get('Authorization');
  return authHeader ? { Authorization: authHeader } : {};
}

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

