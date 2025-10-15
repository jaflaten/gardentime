import { NextRequest, NextResponse } from 'next/server';
import { callSpringApi } from '@/lib/spring-api';

// POST /api/canvas-objects - Create a canvas object
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await callSpringApi('/api/canvas-objects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error creating canvas object:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create canvas object' },
      { status: error.status || 500 }
    );
  }
}

