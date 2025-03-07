// app/api/answer-question/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { question, context, filename } = await req.json();
    
    if (!question || !context) {
      return NextResponse.json({ error: 'Missing question or context' }, { status: 400 });
    }
    
    // Use OpenAI to generate an answer to the question
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the provided document context. Use only the information provided to answer the question. If the answer cannot be determined from the context, say so."
        },
        {
          role: "user",
          content: `Context from document "${filename}":\n\n${context.substring(0, 10000)}\n\nQuestion: ${question}\n\nAnswer:`
        }
      ]
    });
    
    const answer = response.choices[0].message.content;
    
    return NextResponse.json({
      answer,
      success: true
    });
  } catch (error) {
    console.error('Failed to answer question:', error);
    return NextResponse.json({ 
      error: 'Failed to generate answer',
      details: error.message 
    }, { status: 500 });
  }
}