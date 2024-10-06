import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { plantName } = await request.json();
    
    // TODO: Implement the actual plant search logic
    // For now, let's return a mock response
    const plantData = {
      'Common name': plantName,
      'Scientific name': 'Mockus plantus',
      'Description': 'This is a mock plant description.',
      // Add other fields as needed
    };

    return NextResponse.json(plantData);
  } catch (error) {
    console.error('Error in search-plant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}