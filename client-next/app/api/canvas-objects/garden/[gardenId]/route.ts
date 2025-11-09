import { NextRequest, NextResponse } from 'next/server';
import { callSpringApi } from '@/lib/spring-api';

// GET /api/canvas-objects/garden/[gardenId] - Get all canvas objects for a garden
export async function GET(

  request: NextRequest,
  props: { params: Promise<{ gardenId: string }> }
) {  try {
    const params = await props.params;
    const { gardenId } = await params;

    const response = await callSpringApi(`/api/canvas-objects/garden/${gardenId}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching canvas objects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch canvas objects' },
      { status: error.status || 500 }
    );
  }
}
