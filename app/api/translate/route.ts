import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      text, 
      sourceLang, 
      targetLang, 
      apiKey: userKey, 
      provider = 'gemini', 
      model 
    } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const sLang = sourceLang || 'Auto';
    const tLang = targetLang || 'Myanmar';

    // 1. GROQ PROVIDER
    if (provider === 'groq') {
      const apiKey =
        userKey && typeof userKey === 'string' && userKey.trim().length > 0
          ? userKey.trim()
          : process.env.GROQ_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          { 
            error: 'GROQ_KEY_MISSING', 
            message: 'Groq API Key လိုအပ်ပါသည်။ Settings ထဲတွင် Groq API Key ထည့်သွင်းပေးပါ (သို့မဟုတ် https://console.groq.com/keys မှ အခမဲ့ ရယူပါ)။' 
          },
          { status: 401 }
        );
      }

      const groqModel =
        model && typeof model === 'string' && model.trim().length > 0 
          ? model.trim() 
          : 'openai/gpt-oss-120b';

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            {
              role: 'system',
              content: `You are a master professional translator specializing in ${sLang} and ${tLang}. Provide accurate, natural-sounding, and culturally appropriate translations. If the input is English, translate to Myanmar. If the input is Myanmar, translate to English. Ensure the Myanmar translation uses standard, polite, modern Burmese writing. Output ONLY the translated text, with no introductory remarks, quotes, or explanations.`,
            },
            {
              role: 'user',
              content: `Translate the following text from ${sLang} to ${tLang}:\n\n${text}`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!groqRes.ok) {
        const errorData = await groqRes.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `Groq API returned error status: ${groqRes.status}`;
        return NextResponse.json({ 
          error: errMsg, 
          code: errorData?.error?.code || errorData?.error?.type || (groqRes.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'GROQ_API_ERROR'),
          details: errorData?.error || null,
          status: groqRes.status 
        }, { status: groqRes.status });
      }

      const groqData = await groqRes.json();
      const outputText = groqData?.choices?.[0]?.message?.content?.trim();

      if (!outputText) {
        return NextResponse.json({ error: 'EMPTY_RESPONSE', message: 'No translation returned by Groq' }, { status: 502 });
      }

      return NextResponse.json({ text: outputText });
    }

    // 2. GEMINI PROVIDER (DEFAULT)
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

    const geminiModel =
      model && typeof model === 'string' && model.trim().length > 0
        ? model.trim()
        : 'gemini-3.8-flash';

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: `Translate the following text from ${sLang} to ${tLang}. Only provide the translation, no extra explanations.\n\nText: ${text}`,
      config: {
        systemInstruction: `You are a professional translator specializing in ${sLang} and ${tLang}. Provide accurate, natural-sounding translations. If the input is English, translate to Myanmar. If the input is Myanmar, translate to English. Ensure the Myanmar translation uses standard, polite language.`,
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
    return NextResponse.json({ 
      error: message, 
      code: error?.code || (status === 429 ? 'RESOURCE_EXHAUSTED' : 'INTERNAL_ERROR'),
      details: message,
      status 
    }, { status });
  }
}
