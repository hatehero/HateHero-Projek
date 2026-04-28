import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateProductAnalysis(
  base64Image: string,
  mimeType: string,
  background: string,
  brandMode: string,
  durationMode: '8s' | '10s'
) {
  const prompt = `You are the Hatehero UGC Conversion Engine.
Analyze the uploaded product image and the provided user choices:
Background: ${background}
Brand Mode: ${brandMode}

Follow these rules:
STEP 1: PRODUCT ANALYSIS ENGINE
- Analyze the category, material feel, fungsi utama, and visual wow factor.
- Determine the product personality (solid / sleek / premium / aesthetic / rugged).

STEP 2: CONVERSION STYLE ENGINE
- Auto select one mode based on the product: TECH, TOOLS, FASHION, BEAUTY, or GAMING.

STEP 3: VIRAL HOOK ENGINE
- Generate a natural "member reaction" hook.
- Must be curiosity/shock/disbelief, padu scroll-stopper untuk affiliate TikTok.
- Must be short, Malay, santai (casual).

STEP 4: SCRIPT ENGINE
Create scripts for each movement. Target duration is ${durationMode} in total. 
CRITICAL: Setiap ayat yang dijana TIDAK BOLEH static atau menggunakan ayat template. Ayat MESTI dijana secara spesifik, unik mengikut produk tersebut (guna nama atau ciri khas produk).
The length for each line should be ${durationMode === '10s' ? '8-12' : '6-8'} words. Naturally Malay UGC style, SUPER PADU scroll-stopper untuk affiliate TikTok (Racun Member style).
- Movement 1 (Hero Front Shot): Strong scroll-stopper hook relating strictly to this specific product. ${brandMode.toLowerCase().includes('lelaki') ? 'WAJIB mulakan ayat dengan "Geng.." (contoh: "Geng.. korang wajib racun benda ni")' : ''}
- Movement 2 (Product Lift Close): Deep reaction highlighting a very specific detail/feature of this product.
- Movement 3 (Rotate Detail): Experience + strong impression of the product's quality/vibe.
- Movement 4 (Pull Back Reset): Urgent CTA combining desire for this item and a push to checkout.

Also, provide a detailed prompt for generating an image. The prompt must be an English description of:
A 9:16 front-facing camera shot (selfie style, realistic UGC) of a person holding the uploaded product item. The person must match this brand mode: ${brandMode}. The background must be: ${background}. The person has two hands holding the object exactly as seen. No text or UI elements.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          personality: { type: Type.STRING },
          mode: { type: Type.STRING },
          hook: { type: Type.STRING },
          script1: { type: Type.STRING },
          script2: { type: Type.STRING },
          script3: { type: Type.STRING },
          script4: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
        },
        required: [
          'category',
          'personality',
          'mode',
          'hook',
          'script1',
          'script2',
          'script3',
          'script4',
          'imagePrompt',
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate script content from Gemini.');
  }

  return JSON.parse(text);
}

export async function generateImagePreview(
  base64Image: string,
  mimeType: string,
  imagePrompt: string
): Promise<string> {
  const prompt = `Transform this image for a product review context. ${imagePrompt}. DO NOT alter the core product itself, KEEP the product shape, color, material, and details exactly the same - this is 100% immutable locking.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: '9:16',
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Image could not be found in the response.');
}
