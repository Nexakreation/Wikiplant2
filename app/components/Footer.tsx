import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-green-800 text-white p-8">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">About PlantID</h3>
                    <p>PlantID is your go-to resource for identifying and learning about plants. Our advanced AI technology helps you discover the wonders of the botanical world.</p>
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><Link href="/privacy" className="hover:text-green-300">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-green-300">Terms of Service</Link></li>
                        <li><Link href="/contact" className="hover:text-green-300">Contact Us</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
                    <p>Follow us on social media for plant tips, news, and community highlights!</p>
                    <div className="flex space-x-4 mt-4">
                        <a href="#" className="hover:text-green-300">Facebook</a>
                        <a href="#" className="hover:text-green-300">Twitter</a>
                        <a href="#" className="hover:text-green-300">Instagram</a>
                    </div>
                </div>
            </div>
            <div className="mt-8 text-center">
                <p>&copy; 2024 Nexakreation. All rights reserved.</p>
            </div>
        </footer>
    );
}