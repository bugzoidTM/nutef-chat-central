
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import type { ConversationContext } from '@/types/chatbot';

interface ConversationContextPanelProps {
  conversationId: string;
}

export const ConversationContextPanel: React.FC<ConversationContextPanelProps> = ({ 
  conversationId 
}) => {
  const { getConversationContext } = useChatbot();
  
  const context = getConversationContext?.find(
    ctx => ctx.conversation_id === conversationId
  );

  if (!context) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-blue-500" />
          Contexto do Chatbot
        </CardTitle>
        <CardDescription className="text-xs">
          Informações coletadas durante a interação automatizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {context.client_name && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Nome do Cliente</p>
            <p className="text-sm">{context.client_name}</p>
          </div>
        )}
        
        {context.client_email && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{context.client_email}</p>
          </div>
        )}
        
        {context.client_issue_category && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Categoria do Problema</p>
            <Badge variant="secondary" className="text-xs">
              {context.client_issue_category}
            </Badge>
          </div>
        )}
        
        {context.issue_description && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Descrição do Problema</p>
            <p className="text-sm text-muted-foreground">{context.issue_description}</p>
          </div>
        )}
        
        {context.bot_interaction_summary && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Resumo da Interação</p>
              <p className="text-sm text-muted-foreground">{context.bot_interaction_summary}</p>
            </div>
          </>
        )}
        
        {context.escalation_reason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-xs font-medium text-yellow-800">Motivo da Transferência</p>
            </div>
            <p className="text-sm text-yellow-700">{context.escalation_reason}</p>
          </div>
        )}
        
        {context.collected_data && Object.keys(context.collected_data).length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Dados Coletados</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(context.collected_data, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
