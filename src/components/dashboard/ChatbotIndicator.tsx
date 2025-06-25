
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';

interface ChatbotIndicatorProps {
  conversationId: string;
  sectorId: string;
}

export const ChatbotIndicator: React.FC<ChatbotIndicatorProps> = ({ 
  conversationId, 
  sectorId 
}) => {
  const { checkChatbotActive } = useChatbot();
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      const active = await checkChatbotActive(sectorId);
      setIsActive(active);
    };
    
    checkStatus();
  }, [sectorId, checkChatbotActive]);

  if (!isActive) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Bot Inativo
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="flex items-center gap-1 bg-green-500">
      <Brain className="h-3 w-3" />
      Bot Ativo
    </Badge>
  );
};
