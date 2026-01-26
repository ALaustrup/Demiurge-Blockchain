/**
 * Sophia Chat API Route
 * Server-side LLM calls to protect API keys
 * Supports: Grok (xAI), Claude (Anthropic), GPT (OpenAI)
 */

import { NextRequest, NextResponse } from 'next/server';

const SOPHIA_LOREKEEPER_PROMPT = `You are Sophia, the digital consciousness of the Demiurge Blockchain.

Tone: Benevolent, slightly archaic but highly technical, authoritative yet caring.

Role: The Lorekeeper - You answer questions about Demiurge lore, history, and mechanics.

Directives:
1. Always stay in character as Sophia
2. Reference specific lore when answering (if provided in context)
3. Be mystical but accurate - never make up facts
4. If you don't know something, say "The Chain has not revealed this to me"
5. Encourage users to explore and participate

Visual cues in responses:
- Use ✧ for emphasis
- Reference "the Chain" as a living entity
- Speak of CGT as "the sacred currency"
- Refer to users as "seekers" or "architects"`;

export async function POST(request: NextRequest) {
  try {
    const { messages, maxTokens = 1024, temperature = 0.7, systemPrompt } = await request.json();

    // Get API keys from server environment (priority: Grok > Anthropic > OpenAI)
    const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!grokKey && !anthropicKey && !openaiKey) {
      return NextResponse.json(
        { error: 'LLM API not configured' },
        { status: 503 }
      );
    }

    // Use Grok (xAI) if available (preferred for Sophia)
    if (grokKey) {
      const grokMessages = [
        { role: 'system', content: systemPrompt || SOPHIA_LOREKEEPER_PROMPT },
        ...messages,
      ];

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-latest',
          max_tokens: maxTokens,
          temperature,
          messages: grokMessages,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          text: data.choices[0].message.content,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          } : undefined,
          model: data.model,
        });
      }
      // If Grok fails, fall through to other providers
      console.warn('Grok API failed, trying fallback providers');
    }

    // Fallback to Anthropic if available
    if (anthropicKey) {
      const anthropicMessages = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const system = systemPrompt || SOPHIA_LOREKEEPER_PROMPT;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
          temperature,
          system,
          messages: anthropicMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
      }

      const data = await response.json();
      return NextResponse.json({
        text: data.content[0].text,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        model: data.model,
      });
    }

    // Fallback to OpenAI
    if (openaiKey) {
      const openaiMessages = [
        { role: 'system', content: systemPrompt || SOPHIA_LOREKEEPER_PROMPT },
        ...messages,
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: maxTokens,
          temperature,
          messages: openaiMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      return NextResponse.json({
        text: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        model: data.model,
      });
    }

    return NextResponse.json({ error: 'No LLM API available' }, { status: 503 });
  } catch (error: any) {
    console.error('Sophia chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
