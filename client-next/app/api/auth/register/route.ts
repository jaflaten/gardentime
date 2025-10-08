import { NextRequest, NextResponse } from 'next/server';
import { springApi } from '@/lib/spring-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward registration request to Spring Boot backend
    const response = await springApi.post('/api/auth/register', body);

    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.response) {
      return NextResponse.json(
        { message: error.response.data?.message || 'Registration failed' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

