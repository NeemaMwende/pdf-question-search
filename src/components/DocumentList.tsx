// app/components/DocumentList.tsx
'use client';

import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';

interface Document {
  id: string;
  filename: string;
  questionCount?: number;
  questions?: string[];
}

interface DocumentListProps {
  documents: Document[];
  activeDocument: Document | null;
  onSelectDocument: (doc: Document) => void;
}

export default function DocumentList({ documents, activeDocument, onSelectDocument }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="py-4 text-sm text-gray-500">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <Button
              variant={activeDocument?.id === doc.id ? "default" : "outline"}
              className="w-full justify-start text-left"
              onClick={() => onSelectDocument(doc)}
            >
              <div>
                <div className="font-medium truncate">{doc.filename}</div>
                <div className="text-xs opacity-70">
                  {doc.questionCount || (doc.questions?.length || 0)} questions
                </div>
              </div>
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}