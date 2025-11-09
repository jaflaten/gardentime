import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; growAreaId: string } }
) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = `/api/gardens/${params.id}/grow-areas/${params.growAreaId}/rotation/validate`;
    
    console.log('Validating rotation at:', url, 'with body:', body);

    const response = await springApi.post(url, body, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Error validating rotation:', error);

    if (error.response) {
      console.error(`Gardentime API returned ${error.response.status}`);
      console.error('Error response:', error.response.data);
      return NextResponse.json(
        { error: error.response.data?.message || `Failed to validate rotation: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to validate rotation' },
      { status: 500 }
    );
  }
}
