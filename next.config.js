/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['upload.wikimedia.org', 'en.wikipedia.org', 'via.placeholder.com', 'placehold.co'],
    },
}

module.exports = nextConfig