import React from 'react';

import { Message } from '@/types';

import { ThumbsUp, ThumbsDown } from 'lucide-react';

const MessageBubble: React.FC<{
  message: Message;
  isStreaming?: boolean;
  onFeedback?: (messageId: string, feedbackValue: number) => void;
}> = ({ message, isStreaming, onFeedback }) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-zinc-800 text-white rounded-lg p-3 max-w-xs lg:max-w-md">
          <p>{message.content}</p>
        </div>
      </div>
    );
  } else if (message.role === 'assistant') {
    return (
      <div className="flex justify-start mb-4">
        <div
          className={`bg-gray-200 rounded-lg p-3 max-w-xs lg:max-w-md ${
            message.isStreaming ? 'animate-pulse' : ''
          }`}
        >
          <p>
            {message.content}
            {message.isStreaming && (
              <span className="inline-block animate-pulse">▋</span>
            )}
          </p>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => onFeedback?.(message.id, 1)}
              className={`${
                message.metadata?.feedback === 1
                  ? 'text-green-700'
                  : 'text-green-500'
              } hover:text-green-700`}
              disabled={message.metadata?.feedback !== undefined}
            >
              <ThumbsUp size={20} />
            </button>
            <button
              onClick={() => onFeedback?.(message.id, -1)}
              className={`${
                message.metadata?.feedback === -1 ? 'text-red-500' : 'text-red-200'
              } hover:text-red-700`}
              disabled={message.metadata?.feedback !== undefined}
            >
              <ThumbsDown size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default MessageBubble;
