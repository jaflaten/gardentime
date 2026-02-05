import { NextRequest, NextResponse } from 'next/server';
import { springApi } from '@/lib/spring-api';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const response = await springApi.put('/api/users/me/password', body, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Change password error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Failed to change password' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
