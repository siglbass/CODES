import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onContinueConversation: () => void;
  isLoading: boolean;
  showContinueButton: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onContinueConversation,
  isLoading,
  showContinueButton,
}) => {
  const [message, setMessage] = useState<string>('');

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-2 mb-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
          aria-label="Chat input field"
        />
        <button
          onClick={handleSendMessage}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200 ${
            isLoading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isLoading}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
      {showContinueButton && (
        <div className="flex justify-end mt-2">
          <button
            onClick={onContinueConversation}
            className={`px-4 py-2 rounded-lg text-blue-600 border border-blue-600 bg-white font-semibold hover:bg-blue-50 transition-colors duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
            aria-label="Continue conversation"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;