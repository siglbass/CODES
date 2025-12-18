import React from 'react';
import { Document } from '../types';

interface DocumentViewerProps {
  document: Document | null;
  onHighlightText: (text: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onHighlightText }) => {
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      onHighlightText(selection.toString().trim());
    }
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500 italic p-4 text-center rounded-lg">
        Select a document from the list to view its content.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden flex flex-col">
      <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-lg font-semibold shadow-md">
        {document.title}
      </div>
      <div
        className="flex-grow overflow-y-auto p-6 text-gray-800 leading-relaxed whitespace-pre-wrap"
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection} // For mobile highlighting
      >
        {document.content}
      </div>
    </div>
  );
};

export default DocumentViewer;