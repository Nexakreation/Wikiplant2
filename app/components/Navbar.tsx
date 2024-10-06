"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
    // Language functionality is currently not in use, but kept for future implementation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        // Set the initial language based on the browser's language
        setLanguage(navigator.language.split('-')[0]);
    }, []);


    return (
        <nav className="bg-green-600 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-2xl font-bold">Plant App</Link>
                <div className="space-x-4">
                    <Link href="/" className="text-white hover:text-green-200">Home</Link>
                    <Link href="/random-facts" className="text-white hover:text-green-200">Random Facts</Link>
                    <Link href="/about" className="text-white hover:text-green-200">About</Link>
                    {/* ... other existing links ... */}
                </div>
            </div>
            <div id="google_translate_element" className="hidden"></div>
        </nav>
    );
}