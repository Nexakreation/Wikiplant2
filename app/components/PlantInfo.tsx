import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface PlantInfoProps {
  info: string;
}

interface PlantData {
  [key: string]: string;
}

export default function PlantInfo({ info }: PlantInfoProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Function to clean up the text
    const cleanText = (text: string): string => {
        return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    };

    // Use useMemo to memoize the plantData object
    const plantData = useMemo(() => {
        const lines = info.split('\n').filter(line => line.trim() !== '');
        const data: PlantData = {};

        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            const cleanKey = cleanText(key);
            const cleanValue = cleanText(valueParts.join(':'));
            if (cleanKey && cleanValue) {
                data[cleanKey] = cleanValue;
            }
        });

        return data;
    }, [info]);

    // Use useCallback to memoize the fetchImageFromWikipedia function
    const fetchImageFromWikipedia = useCallback(async (query: string): Promise<string> => {
        try {
            const searchVariations = [
                query,
                query.split("'")[0].trim(),
                query.split(/[([{/'"]/, 1)[0].trim()
            ];

            for (const searchQuery of searchVariations) {
                let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(searchQuery)}&prop=text&redirects&origin=*`;
                
                if (searchQuery.startsWith('https://en.wikipedia.org/wiki/')) {
                    const pageName = searchQuery.split('/').pop();
                    url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${pageName}&prop=text&redirects&origin=*`;
                }

                const response = await fetch(url);
                const data = await response.json();
                
                if (data.parse && data.parse.text) {
                    const htmlContent = data.parse.text['*'];
                    const imgRegex = /<img[^>]+src="((?:https?:)?\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>/gi;
                    const matches = [...htmlContent.matchAll(imgRegex)];
                    
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
                
                // If no valid image found, continue to the next search variation
            }
            
            // If no image found after trying all variations, return a search URL
            return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
        } catch (error) {
            console.error("Error fetching Wikipedia image:", error);
            return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
        }
    }, []);

    const isValidPlantImage = (url: string): boolean => {
        if (url.includes('.svg') || url.includes('icon') || url.includes('Icon')) {
            return false;
        }
        
        const dimensions = url.match(/\/(\d+)px-/);
        if (dimensions && parseInt(dimensions[1]) < 100) {
            return false;
        }
        
        return true;
    };

    useEffect(() => {
        const fetchImage = async () => {
            if (plantData && plantData['Scientific name']) {
                const imageUrl = await fetchImageFromWikipedia(plantData['Scientific name']);
                setImageUrl(imageUrl);
            }
        };

        fetchImage();
    }, [plantData, fetchImageFromWikipedia]);

    const handleDetailsClick = () => {
        // Store the plant data and image URL in sessionStorage
        sessionStorage.setItem('currentPlantData', JSON.stringify({
            ...plantData,
            imageUrl: imageUrl
        }));
    };

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
            {imageUrl && (
                <div className="mb-4 relative w-full h-48 sm:h-56 md:h-64">
                    <Image 
                        src={imageUrl} 
                        alt={plantData['Common name'] || 'Plant'} 
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg shadow-md"
                    />
                </div>
            )}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-4 text-green-800">{plantData['Common name'] || 'Unknown Plant'}</h2>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-green-600 italic">{plantData['Scientific name'] || 'Species unknown'}</h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">{plantData['Description'] || 'No description available.'}</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
                <a target="_blank" rel="noopener noreferrer" className="text-white bg-red-600 px-4 py-2 rounded-lg text-center" href={`https://google.com/search?q=${encodeURIComponent(plantData['Scientific name'] || '')}`}>
                    <i className="fas fa-search mr-1"></i> Search on Google
                </a>
                <Link href="/plant-details" onClick={handleDetailsClick} className="text-black bg-green-200 px-4 py-2 rounded-lg text-center">
                    Details
                </Link>
            </div>
        </div>
    );
}