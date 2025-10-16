import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { message: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const response = await springApi.get('/api/growarea/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { query }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: unknown) {
    console.error('Search grow areas error:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      return NextResponse.json(
        { message: axiosError.response?.data?.message || 'Failed to search grow areas' },
        { status: axiosError.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
