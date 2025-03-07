import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { text, filename } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Use OpenAI to extract questions from the text
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that identifies questions within documents. Extract all questions from the provided text. Return only the questions in a JSON array format. Include exact quotes, not paraphrased versions."
        },
        {
          role: "user",
          content: `Extract all questions from the following text:\n\n${text.substring(0, 10000)}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    // Ensure a valid response exists
    const content = response.choices[0]?.message?.content ?? null;
    if (!content) {
      return NextResponse.json({ error: 'OpenAI returned an empty response' }, { status: 500 });
    }

    let questions: string[] = [];
    try {
      const parsedData = JSON.parse(content);
      if (Array.isArray(parsedData.questions)) {
        questions = parsedData.questions;
      } else {
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json({ error: 'Failed to process extracted questions' }, { status: 500 });
    }

    return NextResponse.json({
      questions,
      filename,
      success: true
    });
  } catch (error: unknown) {
    console.error('Question extraction failed:', error);

    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: 'Failed to extract questions', details: errorMessage },
      { status: 500 }
    );
  }
}
