// app/components/QuestionList.tsx
'use client';

import { ScrollArea } from '../components/ui/scroll-area';

interface QuestionListProps {
  questions: string[];
  selectedQuestion: string | null;
  onQuestionClick: (question: string) => void;
}

export default function QuestionList({ questions, selectedQuestion, onQuestionClick }: QuestionListProps) {
  if (!questions || questions.length === 0) {
    return (
      <div className="py-4 text-sm text-gray-500">
        No questions found in this document.
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <ul className="space-y-2">
        {questions.map((question, idx) => (
          <li 
            key={idx} 
            className={`bg-gray-50 p-3 rounded-md border cursor-pointer hover:bg-gray-100 ${
              selectedQuestion === question ? 'bg-blue-50 border-blue-300' : ''
            }`}
            onClick={() => onQuestionClick(question)}
          >
            <span className="font-medium mr-2">{idx + 1}.</span>
            {question}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}