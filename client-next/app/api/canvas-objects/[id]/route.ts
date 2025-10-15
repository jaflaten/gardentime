import { NextRequest, NextResponse } from 'next/server';
import { callSpringApi } from '@/lib/spring-api';

// PUT /api/canvas-objects/[id] - Update a canvas object
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await callSpringApi(`/api/canvas-objects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error updating canvas object:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update canvas object' },
      { status: error.status || 500 }
    );
  }
}

// DELETE /api/canvas-objects/[id] - Delete a canvas object
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await callSpringApi(`/api/canvas-objects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    return new NextResponse(null, { status: response.status });
  } catch (error: any) {
    console.error('Error deleting canvas object:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete canvas object' },
      { status: error.status || 500 }
    );
  }
}
