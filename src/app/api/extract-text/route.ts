// app/api/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await PDFParser(buffer);
    
    // Extract text from PDF
    const text = pdfData.text;
    const pageCount = pdfData.numpages;
    
    return NextResponse.json({
      text,
      pageCount,
      filename: file.name,
      success: true
    });
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return NextResponse.json({ 
      error: 'Failed to extract text from PDF',
      details: error.message 
    }, { status: 500 });
  }
}