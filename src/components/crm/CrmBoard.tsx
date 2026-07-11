import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useCrm } from '@/hooks/useCrm';
import type { CrmConversation } from '@/hooks/useCrm';
import { CrmCard } from './CrmCard';
import { CrmCardDialog } from './CrmCardDialog';

interface CrmBoardProps {
  onOpenConversation: (conversationId: string) => void;
}

export const CrmBoard = ({ onOpenConversation }: CrmBoardProps) => {
  const { stages, conversations, isLoading, moveConversation } = useCrm();
  const [selectedCard, setSelectedCard] = useState<CrmConversation | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const firstStageId = stages[0]?.id;
  const conversationsByStage = (stageId: string) =>
    conversations.filter(c => (c.crm_stage_id || firstStageId) === stageId);

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const conversationId = e.dataTransfer.getData('text/conversation-id');
    if (!conversationId) return;
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || (conversation.crm_stage_id || firstStageId) === stageId) return;
    moveConversation.mutate({ conversationId, stageId });
  };

  // Dialog usa a versão mais recente da conversa (tags atualizam em tempo real)
  const selectedConversation = selectedCard
    ? conversations.find(c => c.id === selectedCard.id) || null
    : null;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50 p-4">
      <div className="flex gap-4 h-full min-w-max">
        {stages.map(stage => {
          const cards = conversationsByStage(stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(prev => (prev === stage.id ? null : prev))}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-72 flex-shrink-0 flex flex-col rounded-lg bg-gray-100 border transition-colors ${
                dragOverStage === stage.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div
                className="px-3 py-2 flex items-center justify-between border-b border-gray-200 rounded-t-lg"
                style={{ borderTop: `3px solid ${stage.color}` }}
              >
                <span className="font-medium text-sm text-gray-800">{stage.name}</span>
                <Badge variant="secondary" className="text-xs">{cards.length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map(conversation => (
                  <CrmCard
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => setSelectedCard(conversation)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/conversation-id', conversation.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Arraste cards para cá</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CrmCardDialog
        conversation={selectedConversation}
        onClose={() => setSelectedCard(null)}
        onOpenConversation={onOpenConversation}
      />
    </div>
  );
};
