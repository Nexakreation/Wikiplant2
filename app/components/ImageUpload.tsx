"use client";

import React from 'react';
import { useState, useRef, useCallback } from 'react';
import BookLoader from './BookLoader';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  setPlantInfo: (info: string) => void;
  setImageUrl: (url: string) => void;
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

const ImageUpload: React.FC<ImageUploadProps> = ({ setPlantInfo, setImageUrl }) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImage = useCallback(async (file: File) => {
    if (file) {
      setIsLoading(true);
      setPlantInfo('');
      setImageUrl('');
      try {
        setImageUrl(URL.createObjectURL(file));
        const imageData = await fileToGenerativePart(file);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
          "Identify this plant and provide the following information in a structured format with labels: " +
          "Common name: " +
          "Scientific name: " +
          "Family: " +
          "Description: " +
          "Flower characteristics: " +
          "Leaf characteristics: " +
          "Plant height: " +
          "Blooming season: " +
          "Sunlight requirements: " +
          "Water needs: " +
          "Soil type: " +
          "Growth rate: " +
          "Hardiness zones: " +
          "Native region: " +
          "Potential uses: " +
          "Care tips: " +
          "Interesting facts: ",
          imageData,
        ]);

        const response = await result.response;
        const text = response.text();
        setPlantInfo(text);
      } catch (error) {
        console.error("Error identifying plant:", error);
        setPlantInfo(`Error identifying plant: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [setPlantInfo, setImageUrl]);

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
    <div className="mb-0 ">
      <div {...getRootProps()} className={`p-8 border-2 border-dashed  rounded-lg ${isDragActive ? 'border-blue-500 bg-gray-100' : 'border-green-600'}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the image here ...</p>
        ) : (
          <p className='text-green-600'>Drag &apos;n&apos; drop an image here, or click to select a file</p>
        )}
      </div>
      <div className="mt-4 flex justify-center space-x-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md"
        >
          Upload Image
        </button>
        <button
          onClick={handleCameraCapture}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md"
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
      {/* {isLoading && <p className="mt-4 text-green-800 font-semibold">Identifying plant...</p>} */}
      {isLoading && <BookLoader />}
    </div>
  );
};

export default ImageUpload;