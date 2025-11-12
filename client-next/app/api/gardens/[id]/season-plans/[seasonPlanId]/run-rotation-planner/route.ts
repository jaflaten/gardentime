import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonPlanId: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const url = `/api/gardens/${resolvedParams.id}/season-plans/${resolvedParams.seasonPlanId}/run-rotation-planner`;
    
    console.log('Running rotation planner:', url);

    const response = await springApi.post(url, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Rotation planner completed successfully');
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Run rotation planner error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.message || 'Failed to run rotation planner' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
