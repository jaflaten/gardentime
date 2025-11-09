import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  const limit = searchParams.get('limit') || '20';

  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call gardentime backend which will fetch from plant-data-aggregator
    const response = await springApi.get(
      `/api/plants/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Error searching plants:', error);

    if (error.response) {
      console.error(`Gardentime API returned ${error.response.status}`);
      console.error('Error response:', error.response.data);
      return NextResponse.json(
        { error: error.response.data?.message || `Failed to search plants: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to search plants' },
      { status: 500 }
    );
  }
}
