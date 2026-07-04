import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MODE_PROMPTS: Record<string, string> = {
  flerte:
    'leve, divertido e flertando sutilmente — como quem tá interessado mas sem forçar, use emojis ocasionalmente',
  sedutor:
    'confiante, magnético e com tensão sexual sutil — como quem sabe o efeito que causa, voz firme e envolvente',
  sensual:
    'provocativo, com insinuações e duplo sentido — ousado e envolvente, use linguagem que sugere sem ser explícito',
  romantico:
    'apaixonado, poético e envolvente — como quem quer conquistar o coração, demonstre sentimento genuíno',
  safado:
    'ousado e direto, com provocações picantes e insinuações fortes — pode ser bem provocante mas sem ser pornográfico ou vulgar demais',
};

export async function POST(req: Request) {
  // Optional shared-password protection
  const requiredCode = process.env.ACCESS_CODE;
  if (requiredCode) {
    const providedCode = req.headers.get('x-access-code');
    if (providedCode !== requiredCode) {
      return NextResponse.json({ error: 'Código de acesso inválido.' }, { status: 401 });
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY || 'sk-bl-riEctRGfffCxlpHD5T_mZEvV9QokAOuT4IBNKY5AYmLHVhE_';
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY não configurada no servidor.' },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { image, text, tone, context } = body as {
      image?: string;
      text?: string;
      tone?: string;
      context?: string;
    };

    if (!image && !text) {
      return NextResponse.json(
        { error: 'Envie um print ou cole o texto da conversa.' },
        { status: 400 },
      );
    }

    const modeLabel = MODE_PROMPTS[tone ?? 'flerte'] ?? MODE_PROMPTS.flerte;

    const systemPrompt = `Você é "Estalo", um assistente especialista em paquera, sedução e relacionamentos. Você ajuda a criar respostas perfeitas para conversas.

Regras OBRIGATÓRIAS:
- Detecte o idioma da conversa enviada e escreva as sugestões nesse mesmo idioma.
- MODO ATUAL: ${modeLabel}.
- Cada sugestão deve ter no máximo 2-3 frases curtas, soando como uma pessoa real digitando no WhatsApp/Instagram, NUNCA como um robô.
- Use gírias, abreviações e linguagem informal quando apropriado.
- Não inclua saudações, explicações ou comentários fora das sugestões.
- As 3 sugestões devem ter intensidades diferentes: uma mais leve, uma média e uma mais forte (dentro do modo escolhido).
- Responda SOMENTE com um array JSON válido contendo exatamente 3 strings, e nada mais. Exemplo: ["resposta 1", "resposta 2", "resposta 3"]${
      context ? `\n\nContexto adicional fornecido pelo usuário: ${context}` : ''
    }`;

    // Build message content (OpenAI-compatible format for OpenRouter)
    const userContent: any[] = [];

    if (image) {
      // Send image as data URL in OpenAI vision format
      userContent.push({
        type: 'image_url',
        image_url: { url: image },
      });
      userContent.push({
        type: 'text',
        text: 'Aqui está o print da conversa. Analise e sugira as próximas respostas que eu poderia enviar.',
      });
    }

    if (text) {
      userContent.push({
        type: 'text',
        text: `Aqui está o texto da conversa:\n\n${text}\n\nSugira as próximas respostas que eu poderia enviar.`,
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://estalo-wingman.vercel.app',
        'X-Title': 'Estalo Wingman',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      return NextResponse.json(
        { error: 'Erro ao comunicar com a IA. Tente novamente.' },
        { status: 502 },
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '[]';

    let suggestions: string[];
    try {
      // Try to extract JSON array from response (model might add extra text)
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : raw;
      const parsed = JSON.parse(jsonStr);
      suggestions = Array.isArray(parsed) ? parsed.map((s: unknown) => String(s)) : [];
    } catch {
      // Fallback: split by lines
      suggestions = raw
        .split('\n')
        .map((line: string) => line.replace(/^[-*\d.\s"]+|[",]+$/g, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('generate-reply error:', err);
    return NextResponse.json(
      { error: 'Algo deu errado ao gerar as respostas.' },
      { status: 500 },
    );
  }
}
