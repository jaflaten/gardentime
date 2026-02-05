import { NextRequest, NextResponse } from 'next/server';
import { springApi } from '@/lib/spring-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await springApi.post('/api/auth/forgot-password', body);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Forgot password error:', error);

    // Always return success to prevent email enumeration
    return NextResponse.json(
      { message: 'If an account exists with that email, a password reset link has been sent.' },
      { status: 200 }
    );
  }
}
