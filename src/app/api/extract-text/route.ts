import { NextRequest, NextResponse } from 'next/server';
import * as PDFParser from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await PDFParser.default(buffer);

    // Extract text from PDF
    const text = pdfData.text || '';
    const pageCount = pdfData.numpages || 0;

    return NextResponse.json({
      text,
      pageCount,
      filename: file.name,
      success: true
    });
  } catch (error: unknown) {
    console.error('PDF extraction failed:', error);

    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: 'Failed to extract text from PDF', details: errorMessage },
      { status: 500 }
    );
  }
}
