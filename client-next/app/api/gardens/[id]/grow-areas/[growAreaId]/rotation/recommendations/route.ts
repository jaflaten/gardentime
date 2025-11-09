import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; growAreaId: string }> }
) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season') || '';
    const maxResults = searchParams.get('maxResults') || '10';
    const minScore = searchParams.get('minScore') || '60';
    const grouped = searchParams.get('grouped') || 'false';

    const queryString = new URLSearchParams({
      ...(season && { season }),
      maxResults,
      minScore,
      grouped,
    }).toString();

    const url = `/api/gardens/${resolvedParams.id}/grow-areas/${resolvedParams.growAreaId}/rotation/recommendations?${queryString}`;
    
    console.log('Fetching rotation recommendations from:', url);

    const response = await springApi.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rotation recommendations:', error);

    if (error.response) {
      console.error(`Gardentime API returned ${error.response.status}`);
      console.error('Error response:', error.response.data);
      return NextResponse.json(
        { error: error.response.data?.message || `Failed to fetch recommendations: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
