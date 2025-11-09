import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function GET(

  request: NextRequest,
  props: { params: Promise<{ id: string; seasonPlanId: string }> }
) {  try {
    const params = await props.params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const url = `/api/gardens/${params.id}/season-plans/${params.seasonPlanId}/planned-crops${status ? `?status=${status}` : ''}`;

    const response = await springApi.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Get planned crops error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to fetch planned crops' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(

  request: NextRequest,
  props: { params: Promise<{ id: string; seasonPlanId: string }> }
) {  try {
    const params = await props.params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await springApi.post(
      `/api/gardens/${params.id}/season-plans/${params.seasonPlanId}/planned-crops`,
      body,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Add planned crop error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to add planned crop' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
