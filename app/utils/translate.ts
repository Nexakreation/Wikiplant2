const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export async function translateText(text: string, targetLanguage: string): Promise<string> {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: targetLanguage,
            }),
        });

        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Error translating text:', error);
        return text; // Return original text if translation fails
    }
}