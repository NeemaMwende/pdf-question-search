// DocumentList.tsx
import React, { useState, useEffect } from 'react';
import DeleteButton from '../components/DeleteButton';

interface Document {
  id: string;
  filename: string;
  questions: string[];
  answers?: Record<string, string>;
}

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError('An error occurred while fetching documents');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteSuccess = () => {
    fetchDocuments();
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (documents.length === 0) {
    return <div className="text-center py-8">No documents found. Upload a document to get started.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Documents</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-lg truncate">{doc.filename}</h3>
              <DeleteButton 
                documentId={doc.id} 
                filename={doc.filename} 
                onDeleteSuccess={handleDeleteSuccess}
              />
            </div>
            <div className="text-sm text-gray-500 mb-2">
              {doc.questions.length} questions
            </div>
            <div className="flex justify-between mt-3">
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;