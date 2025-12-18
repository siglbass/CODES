import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';

interface ChatHistoryProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-grow overflow-y-auto p-4 flex flex-col space-y-3 bg-gray-50">
      {messages.length === 0 && !isLoading && (
        <div className="flex-grow flex items-center justify-center text-gray-500 italic">
          Start by asking a question or highlighting a document section!
        </div>
      )}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && <LoadingSpinner />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;