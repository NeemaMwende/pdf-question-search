
import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an assistant that extracts questions from documents. Identify all questions in the provided text and return them as a numbered list. Include both explicit questions (ending with '?') and implicit questions (requests for information)."
        },
        {
          role: "user",
          content: `Extract all questions from the following document text:\n\n${text}`
        }
      ],
      temperature: 0.3,
    });

    const extractedContent = response.choices[0].message.content || '';
    
    const questionLines = extractedContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .filter(line => /^\d+\./.test(line) || line.includes('?'));
    
    const questions = questionLines.map((line, index) => {
      const cleanText = line.replace(/^\d+\.\s*/, '').trim();
      return {
        id: `q-${index + 1}`,
        text: cleanText
      };
    });

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Error extracting questions:', error);
    return res.status(500).json({ error: 'Failed to extract questions' });
  }
}