import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { TranslationBox } from '@/types/manga';

const PROMPT = `
  You are an expert manga translator and OCR system. 
  Carefully scan the ENTIRE image and identify EVERY distinct block of text.
  Translate the Japanese text to natural-sounding English.
  
  You MUST return a valid JSON array of objects. Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Just the raw JSON.
  Each object must have exactly these three keys:
  1. "box_2d": An array of 4 integers between 0 and 1000 representing the bounding box [ymin, xmin, ymax, xmax].
  2. "translation": The English translation.
  3. "type": Categorize the text as either "dialogue" or "sfx".
`;

export async function POST(request: Request) {
  try {
    // Add apiKey to the expected body
    const body = (await request.json()) as {
      imageBase64: string;
      model: string;
      apiKey: string;
    };
    const { imageBase64, model, apiKey } = body;

    if (!imageBase64 || !model) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or model' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is missing. Please add it in settings.' },
        { status: 401 }
      );
    }

    // Initialize the SDK dynamically per request
    const ai = new GoogleGenAI({ apiKey });

    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const response = await ai.models.generateContent({
      model,
      contents: [
        PROMPT,
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 1.0,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING },
              type: { type: Type.STRING },
              box_2d: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
              },
            },
            required: ['translation', 'type', 'box_2d'],
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error('No text returned from Gemini API');

    const translations = JSON.parse(resultText) as TranslationBox[];
    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Translation API Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
