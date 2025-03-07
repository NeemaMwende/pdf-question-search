// app/api/extract-questions/route.ts
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
          content: `Extract all questions from the following text: ${text.substring(0, 10000)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response to get questions
    const questions = JSON.parse(response.choices[0].message.content).questions;
    
    return NextResponse.json({
      questions,
      filename,
      success: true
    });
  } catch (error) {
    console.error('Question extraction failed:', error);
    return NextResponse.json({ 
      error: 'Failed to extract questions',
      details: error.message 
    }, { status: 500 });
  }
}