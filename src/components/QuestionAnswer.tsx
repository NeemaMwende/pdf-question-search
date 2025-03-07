// app/components/QuestionAnswer.tsx
'use client';

import { ScrollArea } from '../components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface QuestionAnswerProps {
  question: string | null;
  answer: string;
  isLoading: boolean;
}

export default function QuestionAnswer({ question, answer, isLoading }: QuestionAnswerProps) {
  if (!question) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Answer</h2>
      <div className="mb-4">
        <div className="font-medium mb-2">Question:</div>
        <div className="bg-gray-50 p-3 rounded-md border">{question}</div>
      </div>
      
      <div>
        <div className="font-medium mb-2">Answer:</div>
        {isLoading ? (
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md border">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Generating answer...</span>
          </div>
        ) : answer ? (
          <ScrollArea className="h-64">
            <div className="bg-gray-50 p-3 rounded-md border whitespace-pre-line">
              {answer}
            </div>
          </ScrollArea>
        ) : (
          <div className="bg-gray-50 p-3 rounded-md border text-gray-500">
            Click on the question to generate an answer.
          </div>
        )}
      </div>
    </div>
  );
}