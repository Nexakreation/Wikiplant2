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
        
        // Remove text in single quotes (cultivar names)
        name = name.replace(/'[^']*'/g, '');
        
        // Remove text in parentheses
        name = name.replace(/\s*\([^)]*\)/g, '');
        
        // Remove "spp.", "var.", "subsp.", and similar taxonomic rank indicators
        name = name.replace(/\s*(spp\.|var\.|subsp\.|f\.|cv\.).*$/i, '');
        
        // Remove any remaining special characters and extra spaces
        name = name.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        
        // If it's a genus, just return the genus name
        if (name.split(' ').length === 1) {
            return name;
        }
        
        // Return only the genus and species (first two words)
        return name.split(' ').slice(0, 2).join(' ');
    };

    const fetchWikipediaInfo = async (scientificName: string, commonName: string) => {
        try {
            const cleanedScientificName = cleanScientificName(scientificName);
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(cleanedScientificName)}&prop=text&origin=*`);
            const data = await response.json();
            
            if (data.parse && data.parse.text) {
                const htmlContent = data.parse.text['*'];
                
                // Extract main image URL
                const imgRegex = new RegExp(`<img[^>]+src="(//upload\\.wikimedia\\.org/wikipedia/commons/[^"]+(?:${cleanedScientificName.replace(/\s+/g, '_')}|${commonName.replace(/\s+/g, '_')}).[^"]+)"`, 'i');
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
                
                // Remove unwanted CSS classes
                const cleanedParagraphs = selectedParagraphs.map(p => 
                    p.replace(/\.mw-parser-output [^{]+\{[^}]+\}/g, '')
                     .replace(/\.sr-only[^{]+\{[^}]+\}/g, '')
                     .trim()
                );
                
                setWikipediaExtract(cleanedParagraphs.join('\n\n'));
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

    const ContentBlock = ({ title, content, image, index }: { title: string, content: string, image?: string, index: number }) => (
        <div className="mb-4"> {/* Reduced from mb-8 to mb-4 */}
            {title && <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-green-700">{title}</h3>}
            <div className="text-base sm:text-lg md:text-xl whitespace-pre-wrap mb-2">{content}</div> {/* Reduced from mb-4 to mb-2 */}
            {image && (
                <div className="mb-2 lg:hidden"> {/* Reduced from mb-4 to mb-2 */}
                    <Image
                        src={image}
                        alt={`Additional plant image ${index + 1}`}
                        width={400}
                        height={300}
                        objectFit="cover"
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                    <div className="mt-1"> {/* Reduced from mt-2 to mt-1 */}
                        {getPlantInfoSubset(index)}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-4 overflow-x-hidden"> {/* Reduced from py-8 to py-4 */}
            <div className="flex flex-col lg:flex-row gap-4"> {/* Reduced from gap-6 to gap-4 */}
                <div className='w-full lg:w-1/5 order-2 lg:order-1 hidden lg:block'>
                    <h3 className="text-xl font-semibold mb-4 text-green-700">{/* Additional Images */}</h3> {/* Reduced from mb-4 to mb-2 */}
                    <div className="grid grid-cols-1 gap-2"> {/* Reduced from gap-4 to gap-2 */}
                        {additionalImages.slice(0, 5).map((img, index) => (
                            <div key={index} className="mb-2"> {/* Reduced from mb-6 to mb-2 */}
                                <Image
                                    src={img}
                                    alt={`Additional plant image ${index + 1}`}
                                    width={200}
                                    height={200}
                                    objectFit="cover"
                                    className="rounded-lg shadow-lg w-full h-auto"
                                />
                                <div className="mt-1"> {/* Reduced from mt-2 to mt-1 */}
                                    {getPlantInfoSubset(index)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='w-full lg:w-3/5 order-1 lg:order-2'>
                    <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 mb-2">
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
                            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center rounded-lg shadow-lg">
                                <p className="text-black mb-2">Image not available</p>
                                <p className="text-xs text-gray-600 break-all px-4">{imageUrl}</p>
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-green-800">{plantData['Common name']}</h1> {/* Reduced from mb-4 to mb-2 */}
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-green-600 italic">{plantData['Scientific name']}</h2> {/* Reduced from mb-4 to mb-2 */}
                    
                    <ContentBlock title="Description" content={plantData['Description']} index={-1} />
                    
                    <p className="mb-4 mt-1 text-opacity-25 text-sm"> {/* Reduced from mb-8 to mb-4 and mt-2 to mt-1 */}
                        <span className="text-green-400 text-opacity-30"> CC BY-SA 3.0 : </span> 
                        <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(cleanScientificName(plantData['Scientific name']))}`} target="_blank" className="text-gray-600">
                            https://en.wikipedia.org/wiki/{cleanScientificName(plantData['Scientific name'])}
                        </a>
                    </p>

                    {wikipediaExtract && (
                        <>
                            {wikipediaExtract.split('\n\n').map((paragraph, index) => (
                                <ContentBlock 
                                    key={index}
                                    title={index === 0 ? "Information" : ""}
                                    content={paragraph}
                                    image={additionalImages[index]}
                                    index={index}
                                />
                            ))}
                        </>
                    )}
                    
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-green-700">Additional Details</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse mb-4"> {/* Reduced from mb-8 to mb-4 */}
                            <tbody>
                                {Object.entries(plantData).map(([key, value]) => (
                                    key !== 'Common name' && key !== 'Scientific name' && key !== 'Description' && key !== 'imageUrl' && (
                                        <tr key={key} className="border-b border-gray-200">
                                            <td className="py-1 px-2 font-semibold text-green-700">{key}</td> {/* Reduced padding */}
                                            <td className="py-1 px-2 text-green-600">{value}</td> {/* Reduced padding */}
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='w-full lg:w-1/5 order-3 hidden lg:block'>
                    <h3 className="text-xl font-semibold mb-4 text-green-700">{/*More Images*/}</h3> {/* Reduced from mb-4 to mb-2 */}
                    <div className="grid grid-cols-1 gap-2"> {/* Reduced from gap-4 to gap-2 */}
                        {additionalImages.slice(5, 10).map((img, index) => (
                            <div key={index} className="mb-2">
                                <Image
                                    src={img}
                                    alt={`More plant image ${index + 1}`}
                                    width={200}
                                    height={200}
                                    objectFit="cover"
                                    className="rounded-lg shadow-lg w-full h-auto"
                                />
                                <div className="mt-1"> {/* Reduced from mt-2 to mt-1 */}
                                    {getPlantInfoSubset(index + 5)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}