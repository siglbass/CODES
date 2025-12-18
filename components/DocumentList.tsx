import React from 'react';
import { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  onSelectDocument: (docId: string) => void;
  selectedDocumentId: string | null;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onSelectDocument, selectedDocumentId }) => {
  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Publications</h3>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <button
              onClick={() => onSelectDocument(doc.id)}
              className={`block w-full text-left p-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${selectedDocumentId === doc.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {doc.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;