// DeleteButton.tsx
import React, { useState } from 'react';

interface DeleteButtonProps {
  documentId: string;
  filename: string;
  onDeleteSuccess?: () => void;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ documentId, filename, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${filename}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: documentId }),
      });

      const result = await response.json();

      if (result.success) {
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        setError(result.error || 'Failed to delete document');
      }
    } catch (err) {
      setError('An error occurred while deleting the document');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm flex items-center"
        title={`Delete ${filename}`}
      >
        {isDeleting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </>
        )}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default DeleteButton;