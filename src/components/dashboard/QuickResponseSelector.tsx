
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, Zap } from 'lucide-react';
import { useQuickResponses } from '@/hooks/useQuickResponses';
import type { QuickResponse } from '@/types/quickResponses';

interface QuickResponseSelectorProps {
  onSelectResponse: (content: string, responseId: string) => void;
}

const QuickResponseSelector = ({ onSelectResponse }: QuickResponseSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { quickResponses, categories, isLoading, useQuickResponse } = useQuickResponses();

  const filteredResponses = quickResponses.filter(response => {
    const matchesSearch = response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || response.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectResponse = (response: QuickResponse) => {
    onSelectResponse(response.content, response.id);
    useQuickResponse.mutate(response.id);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Respostas Rápidas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Biblioteca de Respostas Rápidas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar respostas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Response List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando respostas...
                </div>
              ) : filteredResponses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Nenhuma resposta encontrada para os filtros aplicados.'
                    : 'Nenhuma resposta rápida disponível.'
                  }
                </div>
              ) : (
                filteredResponses.map(response => (
                  <div
                    key={response.id}
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelectResponse(response)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{response.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {response.category && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: response.category.color + '20',
                              color: response.category.color 
                            }}
                          >
                            {response.category.name}
                          </Badge>
                        )}
                        {response.usage_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {response.usage_count} usos
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {response.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickResponseSelector;
