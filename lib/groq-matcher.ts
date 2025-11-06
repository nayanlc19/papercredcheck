/**
 * Groq AI-powered journal name matching
 * Uses llama-3.3-70b-versatile for intelligent name comparison
 * Provides 95%+ confidence matching
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
});

export interface MatchResult {
  isMatch: boolean;
  confidence: number; // 0-100
  reasoning: string;
}

/**
 * Use Groq AI to determine if two journal names match
 * Returns confidence score 0-100
 */
export async function matchJournalNames(
  name1: string,
  name2: string,
  threshold: number = 95
): Promise<MatchResult> {
  try {
    const prompt = `You are an expert in academic journal name matching. Compare these two journal/publisher names and determine if they refer to the same entity.

Name 1: "${name1}"
Name 2: "${name2}"

Consider:
- Common abbreviations and variations
- Word order differences
- "The", "Journal of", "International" prefixes
- Spelling variations
- Punctuation differences

Respond in JSON format:
{
  "isMatch": true/false,
  "confidence": 0-100,
  "reasoning": "Brief explanation"
}

Be strict: Only return confidence 95+ if you're very certain they're the same entity.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a precise academic journal name matching expert. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return { isMatch: false, confidence: 0, reasoning: 'No response from AI' };
    }

    const result = JSON.parse(response);
    
    return {
      isMatch: result.confidence >= threshold,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || 'No reasoning provided'
    };

  } catch (error: any) {
    console.error('Groq matching error:', error.message);
    return {
      isMatch: false,
      confidence: 0,
      reasoning: `Error: ${error.message}`
    };
  }
}
