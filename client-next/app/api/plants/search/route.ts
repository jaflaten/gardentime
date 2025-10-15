import { NextRequest, NextResponse } from 'next/server';
import { springApi } from '@/lib/spring-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';

  try {
    const token = request.headers.get('authorization');
    const response = await springApi.get('/api/plants/search', {
      headers: token ? { Authorization: token } : {},
      params: { query },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error searching plants:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to search plants' },
      { status: error.response?.status || 500 }
    );
  }
}

