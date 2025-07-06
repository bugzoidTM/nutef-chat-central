
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  senderName?: string;
  isRead?: boolean;
}

const MessageBubble = ({ 
  content, 
  direction, 
  timestamp, 
  senderName,
  isRead 
}: MessageBubbleProps) => {
  const isIncoming = direction === 'incoming';
  
  return (
    <div className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[70%] ${isIncoming ? 'order-1' : 'order-2'}`}>
        {/* Nome do remetente (apenas para mensagens recebidas) */}
        {isIncoming && senderName && (
          <div className="text-xs text-gray-600 mb-1 px-1">
            {senderName}
          </div>
        )}
        
        {/* Bubble da mensagem */}
        <div className={`
          px-4 py-2 rounded-lg shadow-sm
          ${isIncoming 
            ? 'bg-white border border-gray-200 text-gray-900' 
            : 'bg-green-500 text-white'
          }
        `}>
          <div className="whitespace-pre-wrap text-sm break-words">
            {content}
          </div>
          
          {/* Timestamp e status */}
          <div className={`
            flex items-center justify-end mt-1 text-xs gap-1
            ${isIncoming ? 'text-gray-500' : 'text-green-100'}
          `}>
            <span>
              {format(new Date(timestamp), 'HH:mm', { locale: ptBR })}
            </span>
            {!isIncoming && (
              <div className="flex">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
                {isRead && (
                  <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
