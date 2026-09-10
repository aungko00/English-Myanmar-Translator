import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, sourceLang, targetLang, apiKey: userKey } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey =
      userKey && typeof userKey === 'string' && userKey.trim().length > 0
        ? userKey.trim()
        : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: 'No Gemini API key configured.' },
        { status: 401 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Translate the following text from ${sourceLang || 'Auto'} to ${targetLang || 'Myanmar'}. Only provide the translation, no extra explanations.

Text: ${text}`,
      config: {
        systemInstruction: `You are a professional translator specializing in ${sourceLang || 'English'} and ${targetLang || 'Myanmar'}. Provide accurate, natural-sounding translations. If the input is English, translate to Myanmar. If the input is Myanmar, translate to English. Ensure the Myanmar translation uses standard, polite language.`,
      },
    });

    if (!response.text) {
      return NextResponse.json({ error: 'EMPTY_RESPONSE' }, { status: 502 });
    }

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Translation API error:', error);
    const message = String(error?.message || error || 'Translation failed');
    const status = typeof error?.status === 'number' ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
