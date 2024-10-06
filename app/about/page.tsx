import React from 'react';

export default function About() {
    return (
        <div className="min-h-screen p-8 ">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-green-800 text-center">About Our Plant App</h1>
                
                <div className="bg-gray-900  p-8 rounded-3xl shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-green-700">Our Mission</h2>
                    <p className="text-lg mb-4">
                        Our plant application is dedicated to helping people discover, learn about, and appreciate the diverse world of plants. We aim to provide accurate, engaging information about various plant species, from common garden varieties to exotic flora.
                    </p>
                    <p className="text-lg mb-4">
                        Whether you&apos;re a seasoned botanist or just starting your plant journey, our app offers valuable insights, interesting facts, and beautiful imagery to enhance your understanding and enjoyment of plants.
                    </p>
                </div>

                <div className="bg-gray-900  p-8 rounded-3xl shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-green-700">Features</h2>
                    <ul className="list-disc list-inside text-lg space-y-2">
                        <li>Detailed plant information and descriptions</li>
                        <li>High-quality images from various sources</li>
                        <li>Random plant facts to expand your knowledge</li>
                        <li>User-friendly interface for easy navigation</li>
                        <li>Regular updates with new plant information</li>
                    </ul>
                </div>

                <div className="bg-gray-900  p-8 rounded-3xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-green-700">Our Team</h2>
                    <p className="text-lg mb-4">
                        We are a passionate group of plant enthusiasts, botanists, and developers working together to bring you the best plant-related content and features. Our diverse backgrounds and shared love for nature drive us to continually improve and expand our application.
                    </p>
                    <div className="flex justify-center mt-8">
                        {/* <Image
                            src="/team-photo.jpg"
                            alt="Our Team"
                            width={400}
                            height={300}
                            className="rounded-lg shadow-md"
                        /> */}
                    </div>
                </div>
            </div>
        </div>
    );
}