import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';


interface Document {
  id: string;
  filename: string;
  questions: string[];
  answers?: Record<string, string>;
}

interface Database {
  documents: Document[];
}

type SearchResultType = 'question' | 'answer' | 'document';

interface BaseSearchResult {
  type: SearchResultType;
  content: string;
  documentId: string;
  filename: string;
}

interface QuestionSearchResult extends BaseSearchResult {
  type: 'question';
  answer: string;
}

interface AnswerSearchResult extends BaseSearchResult {
  type: 'answer';
  question: string;
}

interface DocumentSearchResult extends BaseSearchResult {
  type: 'document';
}

type SearchResult = QuestionSearchResult | AnswerSearchResult | DocumentSearchResult;

const dbPath = path.join(process.cwd(), 'data', 'documents.json');

// Initialize the DB file if it doesn't exist
async function ensureDbExists() {
  try {
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    
    try {
      await fs.access(dbPath);
    } catch {
      await fs.writeFile(dbPath, JSON.stringify({ documents: [] }));
    }
  } catch (error) {
    console.error('Error initializing DB:', error);
  }
}

// Get all documents
export async function GET() {
  await ensureDbExists();
  
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(data) as Database;
    
    return NextResponse.json({
      documents: db.documents,
      success: true
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    return NextResponse.json({ 
      error: 'Failed to get documents',
      success: false
    }, { status: 500 });
  }
}

// Save a document
export async function PUT(req: NextRequest) {
  await ensureDbExists();
  
  try {
    const document = await req.json() as Document;
    
    if (!document.id || !document.filename) {
      return NextResponse.json({ 
        error: 'Invalid document data',
        success: false 
      }, { status: 400 });
    }
    
    const data = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(data) as Database;
    
    // Find if document already exists
    const existingIndex = db.documents.findIndex((doc: Document) => doc.id === document.id);
    
    if (existingIndex >= 0) {
      db.documents[existingIndex] = document;
    } else {
      db.documents.push(document);
    }
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error saving document:', error);
    return NextResponse.json({ 
      error: 'Failed to save document',
      success: false
    }, { status: 500 });
  }
}

// Search documents
export async function POST(req: NextRequest) {
  await ensureDbExists();
  
  try {
    const { searchTerm, searchIn = 'both' } = await req.json() as {
      searchTerm: string;
      searchIn?: 'both' | 'questions' | 'answers';
    };
    
    if (!searchTerm) {
      return NextResponse.json({ 
        error: 'No search term provided',
        success: false 
      }, { status: 400 });
    }
    
    const data = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(data) as Database;
    const results: SearchResult[] = [];
    
    for (const doc of db.documents) {
      // Search in questions
      if (searchIn === 'both' || searchIn === 'questions') {
        for (const question of doc.questions) {
          if (question.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              type: 'question',
              content: question,
              filename: doc.filename,
              documentId: doc.id,
              answer: doc.answers?.[question] || ''
            });
          }
        }
      }
      
      // Search in answers
      if (searchIn === 'both' || searchIn === 'answers') {
        for (const [question, answer] of Object.entries(doc.answers || {})) {
          if (String(answer).toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              type: 'answer',
              content: answer,
              question: question,
              filename: doc.filename,
              documentId: doc.id
            });
          }
        }
      }
      
      // Search in filename
      if (searchIn === 'both' && doc.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({
          type: 'document',
          content: doc.filename,
          documentId: doc.id,
          filename: doc.filename
        });
      }
    }
    
    return NextResponse.json({
      results,
      count: results.length,
      success: true
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json({ 
      error: 'Failed to search documents',
      success: false
    }, { status: 500 });
  }
}

// Delete a document
export async function DELETE(req: NextRequest) {
  await ensureDbExists();
  
  try {
    const { id } = await req.json() as { id: string };
    
    if (!id) {
      return NextResponse.json({ 
        error: 'No document ID provided',
        success: false 
      }, { status: 400 });
    }
    
    const data = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(data) as Database;
    
    // Filter out the document to delete
    db.documents = db.documents.filter((doc: Document) => doc.id !== id);
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ 
      error: 'Failed to delete document',
      success: false
    }, { status: 500 });
  }
}