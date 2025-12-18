import React, { useState, useEffect, useCallback } from 'react';
import { DOCUMENTS } from './constants';
import { ChatMessage, Document, HighlightedText, AIStudio } from './types'; // Import AIStudio
import { sendMessageToGemini } from './services/geminiService';
import DocumentList from './components/DocumentList';
import DocumentViewer from './components/DocumentViewer';
import ChatDialog from './components/ChatDialog';

// Fix: Removed the duplicate declare global block for window.aistudio.
// The AIStudio interface is now defined in types.ts and declared globally in services/geminiService.ts,
// ensuring a single, consistent type definition across the application.
// No explicit 'declare global' is needed here; the type is picked up implicitly.

const IMAGE_REQUEST_KEYWORDS = [
  "generate an image of",
  "create a picture of",
  "show me an image of",
  "make an image of",
  "draw an image of",
  "visualize an image of",
];

function App() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(DOCUMENTS[0]?.id || null);
  const [highlightedText, setHighlightedText] = useState<HighlightedText | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showContinueButton, setShowContinueButton] = useState<boolean>(false);

  const selectedDocument = DOCUMENTS.find((doc) => doc.id === selectedDocumentId) || null;

  useEffect(() => {
    // Determine if 'Continue' button should be shown
    const lastMessage = chatMessages[chatMessages.length - 1];
    setShowContinueButton(lastMessage?.role === 'model' && !isLoading);
  }, [chatMessages, isLoading]);


  const handleSelectDocument = useCallback((docId: string) => {
    setSelectedDocumentId(docId);
    setHighlightedText(null); // Clear highlight when document changes
  }, []);

  const handleHighlightText = useCallback((text: string) => {
    if (selectedDocumentId) {
      setHighlightedText({ documentId: selectedDocumentId, text });
    }
  }, [selectedDocumentId]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (isLoading) return;

    setIsLoading(true);
    let imagePrompt: string | null = null;
    let userDisplayMessage = text;

    // Check if the user is asking for an image
    for (const keyword of IMAGE_REQUEST_KEYWORDS) {
      if (text.toLowerCase().startsWith(keyword)) {
        imagePrompt = text.substring(keyword.length).trim();
        userDisplayMessage = `(Image Request) ${text}`; // Prepend for clarity in UI
        break;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      text: highlightedText && !imagePrompt ? `[Context: "${highlightedText.text}"] ${userDisplayMessage}` : userDisplayMessage,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setHighlightedText(null); // Clear highlighted text after sending it as context

    try {
      const geminiResponse = await sendMessageToGemini(
        chatMessages, // Pass current chat history
        text,
        highlightedText?.text,
        imagePrompt, // Pass image prompt if detected
      );

      if (!geminiResponse) {
        throw new Error("Empty response from AI service.");
      }

      const modelMessage: ChatMessage = {
        id: Date.now().toString() + '-model',
        role: 'model',
        text: geminiResponse.text || '',
        imageUrl: geminiResponse.imageUrl,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'model',
        text: 'Oops! Something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  // The dependency array should be stable. `chatMessages` changing is fine,
  // but `isLoading` and `highlightedText` are also stable enough or are part of the state flow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, highlightedText, isLoading]);

  const handleContinueConversation = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const continuePrompt = "Please continue your explanation or elaborate further on your previous response.";
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user-continue',
      role: 'user',
      text: "Continue...",
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const geminiResponse = await sendMessageToGemini(
        chatMessages, // Pass current chat history including the last AI response
        continuePrompt,
        null, // No highlighted text for continue
        null // No image prompt for continue
      );

      if (!geminiResponse) {
        throw new Error("Empty response from AI service.");
      }

      const modelMessage: ChatMessage = {
        id: Date.now().toString() + '-model-continue',
        role: 'model',
        text: geminiResponse.text || '',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error continuing conversation:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'model',
        text: 'Oops! Could not continue the conversation. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, isLoading]);


  return (
    <div className="flex flex-col lg:flex-row h-[90vh] bg-gray-100 gap-4">
      {/* Left Pane: Document List */}
      <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
        <DocumentList
          documents={DOCUMENTS}
          onSelectDocument={handleSelectDocument}
          selectedDocumentId={selectedDocumentId}
        />
        {highlightedText && (
          <div className="p-4 bg-yellow-50 text-yellow-800 text-sm border-t border-yellow-200 mt-auto">
            <p className="font-semibold mb-1" aria-live="polite">Highlighted context for next message:</p>
            <p className="line-clamp-3 italic">"{highlightedText.text}"</p>
          </div>
        )}
      </div>

      {/* Middle Pane: Document Viewer */}
      <div className="flex-grow lg:w-1/2 min-h-[40vh] lg:min-h-0">
        <DocumentViewer
          document={selectedDocument}
          onHighlightText={handleHighlightText}
        />
      </div>

      {/* Right Pane: Chat Dialog */}
      <div className="w-full lg:w-1/4 min-h-[40vh] lg:min-h-0">
        <ChatDialog
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onContinueConversation={handleContinueConversation}
          isLoading={isLoading}
          showContinueButton={showContinueButton}
        />
      </div>
    </div>
  );
}

export default App;