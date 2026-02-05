import { NextRequest, NextResponse } from 'next/server';
import { springApi } from '@/lib/spring-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await springApi.post('/api/auth/reset-password', body);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Reset password error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Password reset failed' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
