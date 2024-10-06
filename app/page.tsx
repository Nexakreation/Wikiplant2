"use client";

import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import PlantInfo from './components/PlantInfo';
import SearchBar from './components/SearchBar';
import ExtendedMainPage from './components/extended-mainpage'
import BookLoader from './components/BookLoader';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import Image from 'next/image';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface SpeciesData {
  commonName: string;
  scientificName: string;
  description: string;
  imageUrl: string;
}

export default function Home() {
  const [plantInfo, setPlantInfo] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [multiSpeciesData, setMultiSpeciesData] = useState<SpeciesData[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setPlantInfo(null);
    setImageUrl(null);
    setMultiSpeciesData(null);

    try {
      // First, ask Gemini AI if the plant has multiple species
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const checkSpeciesPrompt = `Does the plant "${searchTerm}" have multiple species? If yes, list all species with their common names, scientific names, and a brief description in a structured format
          Common name:
          Scientific name (by which they are available on wikipedia):
          Description:
          . If no, just say "No multiple species".`;
      
      const speciesResult = await model.generateContent(checkSpeciesPrompt);
      const speciesResponse = speciesResult.response.text();

      if (speciesResponse.toLowerCase().includes("no multiple species")) {
        // For single species, use the retry logic
        const plantInfo = await retryFetchPlantInfo(searchTerm, model);
        if (plantInfo) {
          setPlantInfo(plantInfo);
          const parsedInfo = parsePlantInfo(plantInfo);
          
          if (parsedInfo['Scientific name']) {
            const imageUrl = await fetchImageFromWikipedia(parsedInfo['Scientific name']);
            setImageUrl(imageUrl || "https://example.com/default-plant-image.jpg");
          }
        } else {
          setError(`Unable to fetch plant information. Please try again later or search with the scientific name.`);
        }
      } else {
        try {
          console.log("Raw AI response:", speciesResponse);
          const speciesData = await parseAIResponse(speciesResponse);
          console.log("Parsed species data:", speciesData);
          setMultiSpeciesData(speciesData);
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          setError(`Error parsing AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      }
    } catch (error) {
      setError(`An error occurred while searching for the plant: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeciesSelection = async (species: SpeciesData) => {
    setIsLoading(true);
    setError(null);
    setPlantInfo(null);
    setImageUrl(null);
    setMultiSpeciesData(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const detailPrompt = `Provide the following additional information for the plant "${species.commonName}" (${species.scientificName}) in a structured format with labels:
        Family:
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
        Interesting facts:`;

      const result = await model.generateContent(detailPrompt);
      const additionalInfo = result.response.text();

      // Combine the existing information with the additional details
      const combinedInfo = `Common name: ${species.commonName}
Scientific name: ${species.scientificName}
Description: ${species.description}
${additionalInfo}`;

      setPlantInfo(combinedInfo);
      const parsedInfo = parsePlantInfo(combinedInfo);

      // Use the existing image URL if available, otherwise fetch a new one
      if (species.imageUrl && !species.imageUrl.includes('via.placeholder.com')) {
        setImageUrl(species.imageUrl);
      } else if (parsedInfo['Scientific name']) {
        const newImageUrl = await fetchImageFromWikipedia(parsedInfo['Scientific name']);
        setImageUrl(newImageUrl);
      }
    } catch (error) {
      setError('An error occurred while fetching plant details.');
      console.error('Species selection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const retryFetchPlantInfo = async (searchTerm: string, model: GenerativeModel, maxRetries = 5): Promise<string | null> => {
    for (let i = 0; i < maxRetries; i++) {
      const detailPrompt = `Identify this plant "${searchTerm}" and provide the following information in a structured format with labels:
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
        Interesting facts:`;

      const result = await model.generateContent(detailPrompt);
      const plantInfo = result.response.text();
      
      const parsedInfo = parsePlantInfo(plantInfo);
      if (parsedInfo['Common name'] && parsedInfo['Scientific name'] && parsedInfo['Description']) {
        return plantInfo;
      }
      
      // Wait for a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return null;
  };

  const fetchImageFromWikipedia = async (query: string): Promise<string> => {
    try {
      let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(query)}&prop=text&redirects&origin=*`;
      
      // If the query is already a Wikipedia URL, extract the page name
      if (query.startsWith('https://en.wikipedia.org/wiki/')) {
        const pageName = query.split('/').pop();
        url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${pageName}&prop=text&redirects&origin=*`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.parse && data.parse.text) {
        const htmlContent = data.parse.text['*'];
        
        // Extract all image URLs
        const imgRegex = /<img[^>]+src="((?:https?:)?\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>/gi;
        const matches = [...htmlContent.matchAll(imgRegex)];
        
        // Filter and find the first suitable image
        for (const match of matches) {
          let imgUrl = match[1];
          if (!imgUrl.startsWith('http')) {
            imgUrl = `https:${imgUrl}`;
          }
          if (isValidPlantImage(imgUrl)) {
            return imgUrl;
          }
        }
      }
      
      // If no suitable image found, return the Wikipedia page URL
      return query.startsWith('https://en.wikipedia.org/wiki/') ? query : `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`;
    } catch (error) {
      console.error("Error fetching Wikipedia image:", error);
      // In case of error, return the Wikipedia search URL
      return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
    }
  };

  const isValidPlantImage = (url: string): boolean => {
    // Exclude small images, icons, and SVGs
    if (url.includes('.svg') || url.includes('icon') || url.includes('Icon')) {
      return false;
    }
    
    // Exclude images with dimensions in the URL that are too small
    const dimensions = url.match(/\/(\d+)px-/);
    if (dimensions && parseInt(dimensions[1]) < 100) {
      return false;
    }
    
    return true;
  };

  const parseAIResponse = async (response: string): Promise<SpeciesData[]> => {
    const species = response.split('\n\n').filter(s => s.trim() !== '');
    const parsedSpecies = await Promise.all(species.map(async s => {
      const lines = s.split('\n');
      const commonName = lines.find(l => l.toLowerCase().includes('common name'))?.split(':')[1]?.replace(/\*+/g, '').trim();
      const scientificName = lines.find(l => l.toLowerCase().includes('scientific name'))?.split(':')[1]?.replace(/\*+/g, '').trim();
      const description = lines.find(l => l.toLowerCase().includes('description'))?.split(':')[1]?.replace(/\*+/g, '').trim();
      if (commonName && scientificName && description) {
        const imageUrl = await fetchSpeciesImage(scientificName, commonName);
        return {
          commonName,
          scientificName,
          description,
          imageUrl
        };
      }
      return null;
    }));

    return parsedSpecies.filter((species): species is NonNullable<typeof species> => species !== null);
  };

  const fetchSpeciesImage = async (scientificName: string, commonName: string): Promise<string> => {
    try {
      // First, try to fetch image using common name
      let imageUrl = await fetchImageFromWikipedia(commonName);
      
      // If no specific image found with common name, try scientific name
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        const scientificNameUrl = await fetchImageFromWikipedia(scientificName);
        if (!scientificNameUrl.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = scientificNameUrl;
        }
      }
      
      // If still no image found, try the Wikipedia page for the common name
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        const encodedCommonName = encodeURIComponent(commonName.replace(/ /g, '_'));
        const commonNameUrl = await fetchImageFromWikipedia(`https://en.wikipedia.org/wiki/${encodedCommonName}`);
        if (!commonNameUrl.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = commonNameUrl;
        }
      }
      
      // If still no image found, try the Wikipedia page for the scientific name
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        const encodedScientificName = encodeURIComponent(scientificName.replace(/ /g, '_'));
        const scientificNameUrl = await fetchImageFromWikipedia(`https://en.wikipedia.org/wiki/${encodedScientificName}`);
        if (!scientificNameUrl.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = scientificNameUrl;
        }
      }
      
      // If we still have a Wikipedia page URL, try to extract an image from it
      if (imageUrl.includes('wikipedia.org/wiki/')) {
        const extractedImage = await fetchImageFromWikipedia(imageUrl);
        if (!extractedImage.includes('wikipedia.org/wiki/') && !extractedImage.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = extractedImage;
        }
      }
      
      // If we still don't have an image, use a local placeholder
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        imageUrl = '/placeholder-plant.jpg'; // Make sure to add this image to your public folder
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`Error fetching image for ${commonName} (${scientificName}):`, error);
      return '/placeholder-plant.jpg'; // Use local placeholder image
    }
  };

  const parsePlantInfo = (info: string): Record<string, string> => {
    const lines = info.split('\n');
    const result: Record<string, string> = {};
    let currentKey = '';

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (valueParts.length > 0) {
        currentKey = key.trim();
        result[currentKey] = valueParts.join(':').replace(/\*+/g, '').trim();
      } else if (currentKey) {
        result[currentKey] += ' ' + line.replace(/\*+/g, '').trim();
      }
    }

    return result;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 pb-6 ">
      <h1 className="text-5xl font-bold mb-4 text-green-800">Plant Identifier</h1>
      <p className="text-xl text-green-700 mb-8 text-center max-w-2xl">
        Discover the wonders of nature! Search for a plant, upload or capture an image, and we&apos;ll provide detailed information about its characteristics and care.
      </p>
      <SearchBar onSearch={handleSearch} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="w-full max-w-2xl">
        <ImageUpload setPlantInfo={setPlantInfo} setImageUrl={setImageUrl} />
      </div>
      {isLoading && <BookLoader />}
      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
      {imageUrl && (
        <div className="mt-8 mb-8 relative w-32 h-32">
          <Image 
            src={imageUrl} 
            alt="Plant" 
            layout="fill"
            objectFit="cover"
            className="rounded-lg shadow-lg"
          />
        </div>
      )}
      {plantInfo && <PlantInfo info={plantInfo} />}

      {multiSpeciesData && multiSpeciesData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Multiple Species Found</h2>
          {multiSpeciesData.map((species, index) => (
            <div key={index} className="mb-4 p-4 border rounded flex">
              <div className="mr-4 relative w-32 h-32">
                <Image 
                  src={species.imageUrl} 
                  alt={species.commonName} 
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{species.commonName}</h3>
                <p><strong>Scientific Name:</strong> {species.scientificName}</p>
                <p>{species.description}</p>
                <button
                  onClick={() => handleSpeciesSelection(species)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Get Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ExtendedMainPage />
    </main>
  );
}