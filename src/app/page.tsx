// File: pages/index.tsx
"use client"
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
}

interface Question {
  text: string;
  id: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileImage, setFileImage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'converting' | 'extracting' | 'complete'>('idle');

  // Handle folder upload
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setLoading(true);
    const fileList = Array.from(e.target.files);
    
    // Filter for PDF files only
    const pdfFiles = fileList.filter(file => file.type === 'application/pdf');
    
    const fileItems: FileItem[] = pdfFiles.map(file => ({
      name: file.name,
      path: URL.createObjectURL(file)
    }));
    
    setFiles(fileItems);
    setLoading(false);
  };

  // Handle file selection
  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setFileContent(null);
    setFileImage(null);
    setQuestions([]);
    setAnalysisStep('converting');
    
    try {
      // Upload the file to our API
      const file = await fetch(filePath).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error(data.error);
        return;
      }
      
      setFileContent(data.text);
      setFileImage(data.images[0]); // Get the first image

      // Extract questions
      setAnalysisStep('extracting');
      const questionsResponse = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.text }),
      });
      
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData.questions);
      setAnalysisStep('complete');
      
    } catch (error) {
      console.error('Error processing file:', error);
      setAnalysisStep('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Document Analyzer</h1>
          <p className="text-gray-600">Upload a folder of documents to analyze and extract questions</p>
        </header>

        <div className="mb-6">
          <Button 
            onClick={() => document.getElementById('folder-upload')?.click()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upload Folder
          </Button>
          <input
            id="folder-upload"
            type="file"
            multiple
            directory=""
            webkitdirectory=""
            className="hidden"
            onChange={handleFolderUpload}
          />
          {loading && (
            <span className="ml-4 inline-flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing files...
            </span>
          )}
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* File List Panel */}
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Files ({files.length})</h2>
                <ScrollArea className="h-96">
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li key={index}>
                        <Button
                          variant={selectedFile === file.path ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => handleFileSelect(file.path)}
                        >
                          {file.name}
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
                {selectedFile ? (
                  <Tabs defaultValue="document">
                    <TabsList className="mb-4">
                      <TabsTrigger value="document">Document</TabsTrigger>
                      <TabsTrigger value="questions">Questions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="document">
                      <h2 className="text-xl font-semibold mb-4">Document Content</h2>
                      {analysisStep !== 'idle' && analysisStep !== 'complete' && (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin mr-2" />
                          <span>{analysisStep === 'converting' ? 'Converting document...' : 'Extracting questions...'}</span>
                        </div>
                      )}
                      
                      {fileImage && (
                        <ScrollArea className="h-96">
                          <div className="border rounded-md p-2 mb-4">
                            <img src={fileImage} alt="Document preview" className="max-w-full" />
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="questions">
                      <h2 className="text-xl font-semibold mb-4">Extracted Questions</h2>
                      
                      {analysisStep !== 'complete' ? (
                        <div className="flex items-center justify-center p-8">
                          {analysisStep !== 'idle' && (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin mr-2" />
                              <span>{analysisStep === 'converting' ? 'Converting document...' : 'Extracting questions...'}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        questions.length > 0 ? (
                          <ScrollArea className="h-96">
                            <ul className="space-y-2">
                              {questions.map((question, idx) => (
                                <li key={question.id} className="bg-gray-50 p-3 rounded-md border">
                                  <span className="font-medium mr-2">{idx + 1}.</span>
                                  {question.text}
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        ) : (
                          <p>No questions found in this document.</p>
                        )
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-100 rounded-md">
                    <p className="text-gray-500">Select a file to view its content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}