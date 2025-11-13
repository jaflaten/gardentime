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

    const response = await springApi.get('/api/plants', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Extract plants array from PlantListResponseDTO { plants: [], pagination: {} }
    const plants = response.data.plants || [];
    return NextResponse.json(plants, { status: 200 });
  } catch (error: any) {
    console.error('Get plants error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to fetch plants' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
