import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function PATCH(

  request: NextRequest,
  props: { params: Promise<{ id: string; seasonPlanId: string; plannedCropId: string }> }
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

    const response = await springApi.patch(
      `/api/gardens/${params.id}/season-plans/${params.seasonPlanId}/planned-crops/${params.plannedCropId}`,
      body,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Update planned crop error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to update planned crop' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(

  request: NextRequest,
  props: { params: Promise<{ id: string; seasonPlanId: string; plannedCropId: string }> }
) {  try {
    const params = await props.params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await springApi.delete(
      `/api/gardens/${params.id}/season-plans/${params.seasonPlanId}/planned-crops/${params.plannedCropId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return NextResponse.json({}, { status: 204 });
  } catch (error: any) {
    console.error('Delete planned crop error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to delete planned crop' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
