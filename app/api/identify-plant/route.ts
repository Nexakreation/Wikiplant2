import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get('images') as File;

  if (!image) {
    console.error('No image provided in request');
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const plantIdApiKey = process.env.PLANT_ID_API_KEY;

  if (!plantIdApiKey) {
    console.error('Plant.id API key not configured');
    return NextResponse.json({ error: 'Plant.id API key not configured' }, { status: 500 });
  }

  const body = new FormData();
  body.append('images', image);

  try {
    console.log('Sending request to Plant.id API...');
    const response = await fetch('https://api.plant.id/v2/identify', {
      method: 'POST',
      headers: {
        'Api-Key': plantIdApiKey,
      },
      body: body,
    });

    if (!response.ok) {
      console.error('Plant.id API response not OK:', response.status, response.statusText);
      throw new Error('Failed to identify plant');
    }

    const data = await response.json();
    console.log('Plant.id API response:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error identifying plant:', error);
    return NextResponse.json({ error: 'Failed to identify plant' }, { status: 500 });
  }
}