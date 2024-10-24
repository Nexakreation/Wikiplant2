"use client";

import React from 'react';
import { useState, useRef, useCallback } from 'react';
import BookLoader from './BookLoader';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Add this near the top of your component, after the imports
if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
  console.error('NEXT_PUBLIC_GOOGLE_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface ImageUploadProps {
  setPlantInfo: (info: string) => void;
  setImageUrl: (url: string) => void;
  setConfidence: (confidence: number | null) => void; // Add this line
}

interface PlantIdentification {
  commonName: string;
  scientificName: string;
  confidence: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ setPlantInfo, setImageUrl, setConfidence }) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const identifyPlantWithPlantId = async (file: File): Promise<PlantIdentification> => {
    const formData = new FormData();
    formData.append('images', file);

    console.log('Sending request to Plant.id API...');
    const response = await fetch('/api/identify-plant', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Plant.id API response not OK:', response.status, response.statusText);
      throw new Error('Failed to identify plant with Plant.id');
    }

    const data = await response.json();
    console.log('Plant.id API response:', JSON.stringify(data, null, 2));

    if (data.suggestions && data.suggestions.length > 0) {
      const plantData = {
        commonName: data.suggestions[0].plant_name,
        scientificName: data.suggestions[0].plant_details.scientific_name,
        confidence: data.suggestions[0].probability
      };
      console.log('Extracted plant data:', plantData);
      return plantData;
    } else {
      console.error('No plant suggestions found in Plant.id response');
      throw new Error('No plant identification found');
    }
  };

  const getAdditionalInfoFromGemini = async (plantName: string): Promise<string> => {
    try {
      console.log('Initializing Gemini model...');
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Provide detailed information about the plant "${plantName}" in a structured format with the following labels:
      Common name:
      Scientific name:
      Description of ${plantName}:
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

      console.log('Sending request to Gemini API with prompt:', prompt);
      const result = await model.generateContent(prompt);
      console.log('Received result from Gemini API:', result);
      
      const response = await result.response;
      console.log('Extracted response from result:', response);
      
      const text = response.text();
      console.log('Extracted text from response:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Received empty response from Gemini API');
      }
      
      return text;
    } catch (error) {
      console.error('Error in getAdditionalInfoFromGemini:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return `Error getting additional information: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const handleImage = useCallback(async (file: File) => {
    if (file) {
      setIsLoading(true);
      setPlantInfo('');
      setImageUrl('');
      setConfidence(null); // Reset confidence
      try {
        setImageUrl(URL.createObjectURL(file));
        
        // Identify the plant using Plant.id
        const plantData = await identifyPlantWithPlantId(file);
        console.log('Plant.id identification:', plantData);
        
        // Set confidence for display in the card
        setConfidence(plantData.confidence);
        
        // Get additional information from Gemini
        const additionalInfo = await getAdditionalInfoFromGemini(plantData.commonName);
        console.log('Gemini additional info:', additionalInfo);
        
        if (additionalInfo.startsWith('Error getting additional information')) {
          throw new Error(additionalInfo);
        }
        
        setPlantInfo(`Plant identified as: ${plantData.commonName}
Scientific name: ${plantData.scientificName}
Confidence: ${(plantData.confidence * 100).toFixed(2)}%

Additional Information:
${additionalInfo}`);
      } catch (error) {
        console.error("Error processing plant:", error);
        setPlantInfo(`Error processing plant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setConfidence(null); // Reset confidence on error
      } finally {
        setIsLoading(false);
      }
    }
  }, [setPlantInfo, setImageUrl, setConfidence]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleImage(acceptedFiles[0]);
  }, [handleImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
    });

    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleCameraCapture = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();

          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          setTimeout(() => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const stream = video.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              canvas.toBlob((blob) => {
                if (blob) {
                  handleImage(new File([blob], "camera_capture.jpg", { type: "image/jpeg" }));
                }
              });
            }
          }, 200);
        })
        .catch((error) => {
          console.error("Error accessing camera:", error);
          alert("Unable to access camera. Please make sure you've granted the necessary permissions.");
        });
    } else {
      alert("Your device doesn't support camera access through the browser.");
    }
  };

  return (
    <div className="mb-4 sm:mb-8 px-4 sm:px-0">
      <div className="p-4 sm:p-8 border-2 border-dashed rounded-lg" {...getRootProps()} style={{ border: isDragActive ? '2px solid #2196F3' : '2px dashed #ccc', backgroundColor: isDragActive ? '#f9fafb' : 'transparent' }}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500 text-sm sm:text-base">Drop the image here ...</p>
        ) : (
          <p className='text-green-600 text-sm sm:text-base'>Drag &apos;n&apos; drop an image here, or click to select a file</p>
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md text-sm sm:text-base"
        >
          Upload Image
        </button>
        <button
          onClick={handleCameraCapture}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md text-sm sm:text-base"
        >
          Take Photo
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      {isLoading && <BookLoader />}
    </div>
  );
};

export default ImageUpload;