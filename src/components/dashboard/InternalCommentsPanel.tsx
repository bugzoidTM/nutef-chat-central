
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, User, Edit2, AtSign } from 'lucide-react';
import { useInternalComments } from '@/hooks/useInternalComments';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InternalCommentsPanelProps {
  conversationId: string;
}

export const InternalCommentsPanel: React.FC<InternalCommentsPanelProps> = ({
  conversationId,
}) => {
  const { profile } = useAuth();
  const { comments, isLoading, createComment, isCreating } = useInternalComments(conversationId);
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isCreating) return;

    // Extract mentions (@username) from comment
    const mentionRegex = /@(\w+)/g;
    const mentions = newComment.match(mentionRegex) || [];
    
    try {
      await createComment.mutateAsync({
        conversation_id: conversationId,
        content: newComment,
        mentioned_user_ids: [], // TODO: Convert mentions to user IDs
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const formatCommentTime = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM HH:mm', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários Internos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Carregando comentários...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários Internos
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum comentário interno ainda</p>
                <p className="text-xs">Adicione o primeiro comentário abaixo</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.author?.name || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCommentTime(comment.created_at)}
                        </span>
                        {comment.is_edited && (
                          <Badge variant="outline" className="text-xs">
                            <Edit2 className="h-3 w-3 mr-1" />
                            Editado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      {comment.mentioned_user_ids.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <AtSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {comment.mentioned_user_ids.length} menção(ões)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* New Comment Form */}
        <div className="space-y-3 border-t pt-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário interno... Use @nome para mencionar outros atendentes"
            className="min-h-20 resize-none"
            disabled={isCreating}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              💡 Use @nome para mencionar atendentes
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isCreating}
              size="sm"
            >
              {isCreating ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
