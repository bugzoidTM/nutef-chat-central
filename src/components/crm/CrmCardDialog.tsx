import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Tag as TagIcon, StickyNote, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCrm, useContactNotes } from '@/hooks/useCrm';
import type { CrmConversation } from '@/hooks/useCrm';

const TAG_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444', '#06b6d4', '#ec4899', '#6b7280'];

interface CrmCardDialogProps {
  conversation: CrmConversation | null;
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
}

export const CrmCardDialog = ({ conversation, onClose, onOpenConversation }: CrmCardDialogProps) => {
  const { tags, createTag, toggleTag } = useCrm();
  const { notes, isLoading: notesLoading, addNote, deleteNote } = useContactNotes(conversation?.id || null);
  const [newTagName, setNewTagName] = useState('');
  const [newNote, setNewNote] = useState('');

  if (!conversation) return null;

  const assignedTagIds = new Set(conversation.tags.map(t => t.id));

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    const tag = await createTag.mutateAsync({ name, color });
    await toggleTag.mutateAsync({ conversationId: conversation.id, tagId: tag.id, assigned: false });
    setNewTagName('');
  };

  const handleAddNote = async () => {
    const content = newNote.trim();
    if (!content) return;
    await addNote.mutateAsync(content);
    setNewNote('');
  };

  return (
    <Dialog open={!!conversation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conversation.client_name || conversation.client_phone}</DialogTitle>
          <DialogDescription>{conversation.client_phone}</DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onOpenConversation(conversation.id);
            onClose();
          }}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Abrir conversa
        </Button>

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1">
            <TagIcon className="h-4 w-4" />
            Etiquetas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => {
              const assigned = assignedTagIds.has(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={assigned ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  style={assigned
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : { borderColor: tag.color, color: tag.color }}
                  onClick={() => toggleTag.mutate({ conversationId: conversation.id, tagId: tag.id, assigned })}
                >
                  {tag.name}
                </Badge>
              );
            })}
            {tags.length === 0 && (
              <p className="text-xs text-gray-500">Nenhuma etiqueta criada ainda.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nova etiqueta..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="secondary" onClick={handleCreateTag} disabled={!newTagName.trim() || createTag.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1">
            <StickyNote className="h-4 w-4" />
            Notas
          </p>
          <div className="flex gap-2">
            <Textarea
              placeholder="Escreva uma nota sobre este contato..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>
          <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || addNote.isPending} className="w-full">
            {addNote.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Adicionar nota
          </Button>

          {notesLoading ? (
            <p className="text-xs text-gray-500">Carregando notas...</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-sm">
                  <p className="whitespace-pre-wrap text-gray-800">{note.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-gray-500">
                      {note.author_name} · {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => deleteNote.mutate(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-gray-500">Nenhuma nota ainda.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
