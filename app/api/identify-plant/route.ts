import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get('images') as File;

  if (!image) {
    console.error('No image provided in request');
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const plantIdApiKey = process.env.PLANT_ID_API_KEY;
  const plantIdApiKey2 = process.env.PLANT_ID_API_KEY_2;

  if (!plantIdApiKey) {
    console.error('Plant.id API key not configured');
    return NextResponse.json({ error: 'Plant.id API key not configured' }, { status: 500 });
  }
  if (!plantIdApiKey2) {
    console.error('Plant.id API key 2 not configured');
    return NextResponse.json({ error: 'Plant.id API key 2 not configured' }, { status: 500 });
  }

  const body = new FormData();
  body.append('images', image);

  let response;
  try {
    console.log('Sending request to Plant.id API...');
    response = await fetch('https://api.plant.id/v2/identify', {
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
  } catch (error) {
    console.error('Error identifying plant with primary key:', error);
    console.log('Attempting to use secondary API key...');
    try {
      response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Api-Key': plantIdApiKey2,
        },
        body: body,
      });

      if (!response.ok) {
        console.error('Plant.id API response not OK with secondary key:', response.status, response.statusText);
        throw new Error('Failed to identify plant with secondary key');
      }
    } catch (error) {
      console.error('Error identifying plant with secondary key:', error);
      return NextResponse.json({ error: 'Failed to identify plant with both keys' }, { status: 500 });
    }
  }

  const data = await response.json();
  console.log('Plant.id API response:', JSON.stringify(data, null, 2));
  return NextResponse.json(data);
}