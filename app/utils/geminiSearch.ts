import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY as string);

export async function searchPlantInfo(query: string): Promise<{ info: string, imageUrl: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  try {
    const result = await model.generateContent([
      `Provide information about the plant "${query}" in the following structured format, and include a URL to an image of the plant:
      Common name:
      Scientific name:
      Family:
      Description:
      Flower characteristics:
      Leaf characteristics:
      Plant height:
      Blooming season:
      Sunlight requirements:
      Water needs:
      Soil type:
      Growth rate:
      Hardiness zones:
      Native region:
      Potential uses:
      Care tips:
      Interesting facts:
      Image URL: [Provide a valid URL to an image of this plant]`
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract image URL from the response
    const imageUrlMatch = text.match(/Image URL: (https?:\/\/\S+)/);
    const imageUrl = imageUrlMatch ? imageUrlMatch[1] : '';

    return { info: text, imageUrl };
  } catch (error) {
    console.error('Error searching for plant:', error);
    throw error;
  }
}