import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

interface ChatDialogProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  onContinueConversation: () => void; // New prop for continue button
  isLoading: boolean;
  showContinueButton: boolean; // New prop to control visibility
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  messages,
  onSendMessage,
  onContinueConversation,
  isLoading,
  showContinueButton,
}) => {
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg h-full overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-lg font-semibold shadow-md">
        AI Assistant
      </div>
      <ChatHistory messages={messages} isLoading={isLoading} />
      <ChatInput
        onSendMessage={onSendMessage}
        onContinueConversation={onContinueConversation} // Pass to ChatInput
        isLoading={isLoading}
        showContinueButton={showContinueButton} // Pass to ChatInput
      />
    </div>
  );
};

export default ChatDialog;