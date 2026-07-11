import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CrmConversation } from '@/hooks/useCrm';

interface CrmCardProps {
  conversation: CrmConversation;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export const CrmCard = ({ conversation, onClick, onDragStart }: CrmCardProps) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all select-none"
    >
      <p className="font-medium text-sm text-gray-900 truncate">
        {conversation.client_name || conversation.client_phone}
      </p>
      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
        <Phone className="h-3 w-3" />
        {conversation.client_phone}
      </p>

      {conversation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {conversation.tags.map(tag => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-[10px] px-1.5 py-0 border"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  );
};
