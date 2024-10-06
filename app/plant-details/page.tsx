'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface PlantData {
  [key: string]: string;
}

export default function PlantDetails() {
    const [plantData, setPlantData] = useState<PlantData | null>(null);
    const [wikipediaExtract, setWikipediaExtract] = useState<string>('');
    const [wikipediaImageUrl, setWikipediaImageUrl] = useState<string>('');
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [imageError, setImageError] = useState<boolean>(false);

    useEffect(() => {
        const storedData = sessionStorage.getItem('currentPlantData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setPlantData(parsedData);
            if (parsedData['Scientific name']) {
                const cleanedScientificName = cleanScientificName(parsedData['Scientific name']);
                fetchWikipediaInfo(cleanedScientificName, parsedData['Common name']);
            }
        }
    }, []);

    const cleanScientificName = (name: string): string => {
        // Remove italics markers
        name = name.replace(/[_*]/g, '');
        
        // Remove text in parentheses
        name = name.replace(/\s*\([^)]*\)/g, '');
        
        // Remove "spp." and trim
        name = name.replace(/\s*spp\.?/i, '').trim();
        
        // If it's a genus, just return the genus name
        if (name.toLowerCase().includes('genus')) {
          return name.split(' ')[0];
        }
        
        return name;
    };

    const fetchWikipediaInfo = async (scientificName: string, commonName: string) => {
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(scientificName)}&prop=text&origin=*`);
            const data = await response.json();
            
            if (data.parse && data.parse.text) {
                const htmlContent = data.parse.text['*'];
                
                // Extract main image URL
                const imgRegex = new RegExp(`<img[^>]+src="(//upload\\.wikimedia\\.org/wikipedia/commons/[^"]+(?:${scientificName.replace(/\s+/g, '_')}|${commonName.replace(/\s+/g, '_')}).[^"]+)"`, 'i');
                const match = htmlContent.match(imgRegex);
                if (match && match[1] && !match[1].includes('OOjs_UI_icon')) {
                    setWikipediaImageUrl(`https:${match[1]}`);
                }

                // Extract additional images
                const additionalImgRegex = /<img[^>]+src="(\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>/g;
                const additionalMatches = [...htmlContent.matchAll(additionalImgRegex)];
                const uniqueAdditionalImages = Array.from(new Set(additionalMatches.map(m => `https:${m[1]}`)))
                    .filter(url => !url.includes('OOjs_UI_icon') && !url.includes('edit-ltr.svg'));
                setAdditionalImages(uniqueAdditionalImages.slice(0, 10)); // Limit to 10 images

                // Extract paragraphs
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');
                const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent);
                const selectedParagraphs = paragraphs.filter((p): p is string => p !== null && p.trim() !== '').slice(0, 10);
                setWikipediaExtract(selectedParagraphs.join('\n\n'));
            }
        } catch (error) {
            console.error('Error fetching Wikipedia information:', error);
        }
    };

    if (!plantData) {
        return <div>No plant data available.</div>;
    }

    const handleImageError = () => {
        setImageError(true);
    };

    const imageUrl = wikipediaImageUrl || plantData.imageUrl || '/placeholder-plant-image.jpg';

    // Add this function to get a subset of plant info
    const getPlantInfoSubset = (index: number): JSX.Element => {
        if (!plantData) return <></>;
        const keys = Object.keys(plantData);
        const startIndex = (index * 3) % keys.length;
        const infoSubset = keys.slice(startIndex, startIndex + 3);
        
        return (
            <>
                {infoSubset.map(key => (
                    key !== 'Common name' && key !== 'Scientific name' && key !== 'Description' && key !== 'imageUrl' && (
                        <p key={key} className="text-sm text-gray-600">
                            <span className="font-semibold">{key}:</span> {plantData[key]}
                        </p>
                    )
                ))}
            </>
        );
    };

    return (
        <div className="container mx-auto pt-8 flex gap-6">
            <div className='w-1/5'>
                <h3 className="text-xl font-semibold mb-4 text-green-700"></h3>
                {additionalImages.slice(0, 5).map((img, index) => (
                    <div key={index} className="mb-6">
                        <Image
                            src={img}
                            alt={`Additional plant image ${index + 1}`}
                            width={200}
                            height={200}
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                        />
                        <div className="mt-2">
                            {getPlantInfoSubset(index)}
                        </div>
                    </div>
                ))}
            </div>
            <div className='w-3/5'>
                <div className="relative w-full h-64 mb-8">
                    {!imageError ? (
                        <Image
                            src={imageUrl}
                            alt={plantData['Common name']}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="w-full h-64 bg-gray-200 flex flex-col items-center justify-center rounded-lg shadow-lg">
                            <p className="text-black mb-2">Image not available</p>
                            <p className="text-xs text-gray-600 break-all px-4">{imageUrl}</p>
                            <Image
                            src={imageUrl}
                            alt={plantData['Common name']}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                            onError={handleImageError}
                        />
                        </div>
                    )}
                </div>
                <h1 className="text-4xl font-bold mb-4 text-green-800">{plantData['Common name']}</h1>
                <h2 className="text-2xl font-semibold mb-4 text-green-600 italic">{plantData['Scientific name']}</h2>
                
                <h3 className="text-2xl font-semibold mb-2 text-green-700">Description</h3>
                <div className="text-xl  whitespace-pre-wrap">{plantData['Description']}</div>
                <p className="mb-8 mt-2 text-opacity-25"><span className="text-green-400 text-opacity-30"> CC BY-SA 3.0 : </span> <a href={`https://en.wikipedia.org/wiki/${plantData['Scientific name']}`} target="_blank" className="text-gray-600">https://en.wikipedia.org/wiki/{plantData['Scientific name']}</a></p>
                {wikipediaExtract && (
                    <>
                        <h3 className="text-2xl font-semibold mb-2 text-green-700">Information</h3>
                        <div className="text-xl mb-8 whitespace-pre-wrap">{wikipediaExtract}</div>
                    </>
                )}
                
                <h3 className="text-2xl font-semibold mb-2 text-green-700">Additional Details</h3>
                <table className="w-full border-collapse mb-8">
                    <tbody>
                        {Object.entries(plantData).map(([key, value]) => (
                            key !== 'Common name' && key !== 'Scientific name' && key !== 'Description' && key !== 'imageUrl' && (
                                <tr key={key} className="border-b border-gray-200">
                                    <td className="py-2 px-4 font-semibold text-green-700">{key}</td>
                                    <td className="py-2 px-4 text-green-600">{value}</td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='w-1/5'>
                <h3 className="text-xl font-semibold mb-4 text-green-700"></h3>
                {additionalImages.slice(5, 10).map((img, index) => (
                    <div key={index} className="mb-6">
                        <Image
                            src={img}
                            alt={`More plant image ${index + 1}`}
                            width={200}
                            height={200}
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                        />
                        <div className="mt-2">
                            {getPlantInfoSubset(index + 5)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}