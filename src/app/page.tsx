// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import QuestionAnswer from '../components/QuestionAnswer';

interface Document {
  id: string;
  filename: string;
  text: string;
  questions: string[];
  answers: Record<string, string>;
}

interface SearchResult {
  type: 'question' | 'answer';
  content: string;
  filename: string;
  answer?: string;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load documents on component mount
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/search');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Extract text from PDF
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        const { text, filename } = result;
        
        // Extract questions from the document
        const questionResponse = await fetch('/api/extract-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, filename })
        });
        
        const questionData = await questionResponse.json();
        
        if (questionData.success) {
          const newDocument = {
            id: uuidv4(),
            filename,
            text,
            questions: questionData.questions,
            answers: {}
          };
          
          // Save document to "database"
          await fetch('/api/search', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDocument)
          });
          
          await fetchDocuments();
          setActiveDocument(newDocument);
          setQuestions(questionData.questions);
        }
      }
    } catch (error) {
      console.error('Failed to process document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string, searchIn: string = 'both') => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm, searchIn })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    setSelectedQuestion(question);
    setAnswer('');
    setIsLoading(true);
    
    try {
      // Make sure context and filename are defined or use empty strings as fallback
      const context = activeDocument?.text || '';
      const filename = activeDocument?.filename || '';
      
      const response = await fetch('/api/answer-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context,
          filename
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnswer(data.answer);
        
        if (activeDocument) {
          // Update document with new answer
          const updatedDocument = {
            ...activeDocument,
            answers: {
              ...activeDocument.answers,
              [question]: data.answer
            }
          };
          
          // Save updated document
          await fetch('/api/search', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDocument)
          });
          
          setActiveDocument(updatedDocument);
        }
      }
    } catch (error) {
      console.error('Failed to get answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchResultItem = (result: SearchResult, index: number) => {
    // Extract the nested ternary into separate variables
    const prefix = result.type === 'question' ? 'Q: ' : 'A: ';
    const showViewAnswerButton = result.type === 'question' && result.answer;
    
    return (
      <li key={index} className="py-3 px-2">
        <p className="font-medium">{prefix}{result.content}</p>
        <p className="text-sm text-gray-500">
          From: {result.filename}
          {showViewAnswerButton && (
            <Button 
              variant="link"
              className="ml-2 p-0 h-auto text-blue-500"
              onClick={() => {
                setSelectedQuestion(result.content);
                // Ensure answer is not undefined before setting it
                if (result.answer) {
                  setAnswer(result.answer);
                }
              }}
            >
              View Answer
            </Button>
          )}
        </p>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PDF Question Analyzer</h1>
          <p className="text-gray-600">Upload PDF documents to analyze and extract questions</p>
        </header>

        <div className="mb-6">
          <Button 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upload PDF
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          {isLoading && (
            <span className="ml-4 inline-flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing file...
            </span>
          )}
        </div>

        <SearchBar onSearch={handleSearch} />
          
        {isSearching ? (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <ScrollArea className="h-64">
                <ul className="divide-y">
                  {searchResults.map((result, index) => renderSearchResultItem(result, index))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Document List Panel */}
          <Card className="md:col-span-1">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Documents ({documents.length})</h2>
              <ScrollArea className="h-96">
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <Button
                        variant={activeDocument?.id === doc.id ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setActiveDocument(doc);
                          setQuestions(doc.questions);
                          setSelectedQuestion(null);
                          setAnswer('');
                        }}
                      >
                        <div>
                          <div className="font-medium truncate">{doc.filename}</div>
                          <div className="text-xs opacity-70">{doc.questions.length} questions</div>
                        </div>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Document Content & Questions Panel */}
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              {activeDocument ? (
                <Tabs defaultValue="questions">
                  <TabsList className="mb-4 flex w-full">
                    <TabsTrigger value="document" className="flex-1 text-center">Document</TabsTrigger>
                    <TabsTrigger value="questions" className="flex-1 text-center">Questions</TabsTrigger>
                    {selectedQuestion && (
                      <TabsTrigger value="answer" className="flex-1 text-center">Answer</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="document">
                    <h2 className="text-xl font-semibold mb-4">Document Content</h2>
                    <ScrollArea className="h-96 border rounded-md p-4">
                      <div className="whitespace-pre-line">
                        {activeDocument.text}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="questions">
                    <h2 className="text-xl font-semibold mb-4">Extracted Questions</h2>
                    {questions.length > 0 ? (
                      <ScrollArea className="h-96">
                        <ul className="space-y-2">
                          {questions.map((question, idx) => (
                            <li 
                              key={idx} 
                              className={`bg-gray-50 p-3 rounded-md border cursor-pointer hover:bg-gray-100 ${
                                selectedQuestion === question ? 'bg-blue-50 border-blue-300' : ''
                              }`}
                              onClick={() => handleQuestionClick(question)}
                            >
                              <span className="font-medium mr-2">{idx + 1}.</span>
                              {question}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    ) : (
                      <p className="text-gray-500">No questions found in this document.</p>
                    )}
                  </TabsContent>
                  
                  {selectedQuestion && (
                    <TabsContent value="answer">
                      <QuestionAnswer 
                        question={selectedQuestion} 
                        answer={answer} 
                        isLoading={isLoading}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-md">
                  <p className="text-gray-500">Select a document to view its content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}