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
            let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(query)}&prop=text&redirects&origin=*`;
            
            if (query.startsWith('https://en.wikipedia.org/wiki/')) {
                const pageName = query.split('/').pop();
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
            
            return query.startsWith('https://en.wikipedia.org/wiki/') ? query : `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`;
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
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
            {imageUrl && (
                <div className="mb-4 relative w-full h-64">
                    <Image 
                        src={imageUrl} 
                        alt={plantData['Common name'] || 'Plant'} 
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg shadow-md"
                    />
                </div>
            )}
            <h2 className="text-3xl font-semibold mb-4 text-green-800">{plantData['Common name'] || 'Unknown Plant'}</h2>
            <h3 className="text-xl font-semibold mb-4 text-green-600 italic">{plantData['Scientific name'] || 'Species unknown'}</h3>
            <p className="text-gray-700 mb-6">{plantData['Description'] || 'No description available.'}</p>
            <div className="flex gap-6 items-center">
                <a target="_blank" rel="noopener noreferrer" className="text-white bg-red-600 px-4 py-2 rounded-lg" href={`https://google.com/search?q=${encodeURIComponent(plantData['Scientific name'] || '')}`}>
                    <i className="fas fa-search mr-1"></i> Search on Google
                </a>
                <Link href="/plant-details" onClick={handleDetailsClick} className="text-black bg-green-200 px-4 py-2 rounded-lg">
                    Details
                </Link>
            </div>
        </div>
    );
}