import { NextRequest, NextResponse } from 'next/server';
import { springApi, getTokenFromRequest } from '@/lib/spring-api';

export async function GET(

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

    const response = await springApi.get(`/api/gardens/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Get garden error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to fetch garden' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const response = await springApi.put(`/api/gardens/${id}`, body, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Update garden error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to update garden' },
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

    await springApi.delete(`/api/gardens/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json({ message: 'Garden deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete garden error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to delete garden' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
