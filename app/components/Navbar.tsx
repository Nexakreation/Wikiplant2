"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-green-600 p-4">
            <div className="container mx-auto">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-white text-2xl font-bold">PlantID</Link>
                    <div className="lg:hidden">
                        <button onClick={toggleMenu} className="text-white focus:outline-none">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                    <div className="hidden lg:flex space-x-4">
                        <Link href="/" className="text-white hover:text-green-200">Home</Link>
                        <Link href="/random-facts" className="text-white hover:text-green-200">Random Facts</Link>
                        <Link href="/about" className="text-white hover:text-green-200">About</Link>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="lg:hidden mt-4">
                        <Link href="/" className="block text-white hover:text-green-200 py-2">Home</Link>
                        <Link href="/random-facts" className="block text-white hover:text-green-200 py-2">Random Facts</Link>
                        <Link href="/about" className="block text-white hover:text-green-200 py-2">About</Link>
                    </div>
                )}
            </div>
            <div id="google_translate_element" className="hidden"></div>
        </nav>
    );
}