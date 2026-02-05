import { NextRequest, NextResponse } from 'next/server';
import { springApi } from '@/lib/spring-api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    const response = await springApi.get('/api/users/me', {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Get profile error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to get profile' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const response = await springApi.put('/api/users/me', body, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Update profile error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to update profile' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const response = await springApi.delete('/api/users/me', {
      headers: authHeader ? { Authorization: authHeader } : {},
      data: body,
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Delete account error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to delete account' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
