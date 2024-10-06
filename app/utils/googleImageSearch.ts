const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

export async function fetchImageFromGoogle(query: string): Promise<string> {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(query)}&prop=text&origin=*`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].link;
        } else {
            throw new Error('No image found');
        }
    } catch (error) {
        console.error('Error fetching image:', error);
        return `https://via.placeholder.com/400x300?text=${encodeURIComponent(query)}`;
    }
}

console.log('API_KEY:', API_KEY);
console.log('SEARCH_ENGINE_ID:', SEARCH_ENGINE_ID);

// const fetchWikipediaImage = async (plantName: string): Promise<string> => {
//     try {
//         const response = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(plantName)}&prop=text&origin=*`);
//         const data = await response.json();
        
//         if (data.parse && data.parse.text) {
//             const htmlContent = data.parse.text['*'];
//             const imgRegex = new RegExp(`<img[^>]+src="(//upload\\.wikimedia\\.org/wikipedia/commons/[^"]+(?:${plantName.replace(/\s+/g, '_')}).[^"]+)"`, 'i');
//             const match = htmlContent.match(imgRegex);
//             if (match && match[1]) {
//                 return `https:${match[1]}`;
//             }
//         }
//     } catch (error) {
//         console.error('Error fetching Wikipedia image:', error);
//     }
//     return 'https://placehold.co/'; // Return a placeholder image if no image is found
// };