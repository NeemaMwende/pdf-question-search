// app/components/SearchBar.tsx
'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';

interface SearchBarProps {
  onSearch: (searchTerm: string, searchIn: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIn, setSearchIn] = useState('both');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, searchIn);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for questions in file..."
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={searchIn}
          onChange={(e) => setSearchIn(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="both">Questions & Answers</option>
          <option value="questions">Questions Only</option>
          <option value="answers">Answers Only</option>
        </select>
        
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!searchTerm}
        >
          Search
        </Button>
      </div>
    </form>
  );
}