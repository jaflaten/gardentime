import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const GARDENTIME_API = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonPlanId: string }> }
) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const url = `/api/gardens/${resolvedParams.id}/season-plans/${resolvedParams.seasonPlanId}/run-rotation-planner`;
    
    console.log('Running rotation planner:', url);

    const response = await fetch(`${GARDENTIME_API}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rotation planner error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to run rotation planner', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Rotation planner completed successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Run rotation planner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
