import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function PUT(

  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {  try {
    const params = await props.params;
    const { id } = await params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await springApi.put(`/api/crop-records/${id}`, body, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Update crop record error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to update crop record' },
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
  props: { params: Promise<{ id: string }> }
) {  try {
    const params = await props.params;
    const { id } = await params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await springApi.delete(`/api/crop-records/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Delete crop record error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to delete crop record' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
