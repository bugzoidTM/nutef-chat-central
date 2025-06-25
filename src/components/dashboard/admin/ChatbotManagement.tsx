
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, MessageSquare, Brain, Settings } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useSectors } from '@/hooks/useSectors';
import type { ChatbotKnowledge, ChatbotConfig, CreateKnowledgeData, UpdateKnowledgeData, UpdateConfigData } from '@/types/chatbot';

const ChatbotManagement = () => {
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [editingKnowledge, setEditingKnowledge] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [isKnowledgeDialogOpen, setIsKnowledgeDialogOpen] = useState(false);
  
  const { 
    knowledge, 
    configs, 
    isLoadingKnowledge,
    isLoadingConfigs,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    updateConfig
  } = useChatbot();
  
  const { sectors } = useSectors();

  const [knowledgeFormData, setKnowledgeFormData] = useState<CreateKnowledgeData>({
    question: '',
    answer: '',
    keywords: [],
    intent: '',
    sector_id: '',
    confidence_threshold: 0.7,
  });

  const [configFormData, setConfigFormData] = useState<UpdateConfigData>({
    is_enabled: true,
    welcome_message: '',
    escalation_message: '',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    max_interaction_attempts: 3,
    auto_escalation_keywords: [],
  });

  const handleCreateKnowledge = () => {
    if (!knowledgeFormData.question.trim() || !knowledgeFormData.answer.trim()) return;
    
    createKnowledge.mutate({
      ...knowledgeFormData,
      sector_id: selectedSector || undefined,
    });
    
    setKnowledgeFormData({
      question: '',
      answer: '',
      keywords: [],
      intent: '',
      sector_id: '',
      confidence_threshold: 0.7,
    });
    setIsKnowledgeDialogOpen(false);
  };

  const handleUpdateKnowledge = (id: string, data: UpdateKnowledgeData) => {
    updateKnowledge.mutate({ id, data });
    setEditingKnowledge(null);
  };

  const handleDeleteKnowledge = (id: string) => {
    if (confirm('Tem certeza que deseja remover este conhecimento?')) {
      deleteKnowledge.mutate(id);
    }
  };

  const handleUpdateConfig = (sectorId: string, data: UpdateConfigData) => {
    updateConfig.mutate({ sectorId, data });
    setEditingConfig(null);
  };

  const getSectorName = (sectorId: string | null) => {
    if (!sectorId) return 'Global';
    const sector = sectors.find(s => s.id === sectorId);
    return sector?.name || 'Setor desconhecido';
  };

  const handleAddKeyword = (value: string) => {
    if (value.trim() && !knowledgeFormData.keywords?.includes(value.trim())) {
      setKnowledgeFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), value.trim()]
      }));
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKnowledgeFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const handleAddEscalationKeyword = (value: string) => {
    if (value.trim() && !configFormData.auto_escalation_keywords?.includes(value.trim())) {
      setConfigFormData(prev => ({
        ...prev,
        auto_escalation_keywords: [...(prev.auto_escalation_keywords || []), value.trim()]
      }));
    }
  };

  const isLoading = isLoadingKnowledge || isLoadingConfigs;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Gerenciamento do Chatbot
            </CardTitle>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Setores</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Configure o comportamento e o conhecimento do chatbot para cada setor.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Base de Conhecimento
            </CardTitle>
            <Dialog open={isKnowledgeDialogOpen} onOpenChange={setIsKnowledgeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Conhecimento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Conhecimento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="question">Pergunta</Label>
                    <Input
                      id="question"
                      value={knowledgeFormData.question}
                      onChange={(e) => setKnowledgeFormData({ ...knowledgeFormData, question: e.target.value })}
                      placeholder="Ex: Como funciona o suporte?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="answer">Resposta</Label>
                    <Textarea
                      id="answer"
                      value={knowledgeFormData.answer}
                      onChange={(e) => setKnowledgeFormData({ ...knowledgeFormData, answer: e.target.value })}
                      placeholder="Digite a resposta..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords">Palavras-chave</Label>
                    <div className="flex gap-2">
                      <Input
                        id="keywords"
                        placeholder="Adicionar palavra-chave"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            handleAddKeyword((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={() => {
                        const input = document.getElementById('keywords') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleAddKeyword(input.value);
                          input.value = '';
                        }
                      }}>
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {knowledgeFormData.keywords?.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="gap-0.5">
                          {keyword}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-1"
                            onClick={() => handleRemoveKeyword(keyword)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="intent">Intenção</Label>
                    <Input
                      id="intent"
                      value={knowledgeFormData.intent}
                      onChange={(e) => setKnowledgeFormData({ ...knowledgeFormData, intent: e.target.value })}
                      placeholder="Ex: suporte_funcionalidade"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsKnowledgeDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateKnowledge} disabled={!knowledgeFormData.question.trim() || !knowledgeFormData.answer.trim()}>
                      Criar Conhecimento
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Carregando conhecimentos...
                  </TableCell>
                </TableRow>
              ) : (
                knowledge
                  .filter(k => selectedSector ? k.sector_id === selectedSector : true)
                  .map(k => (
                    <TableRow key={k.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{k.question}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {k.answer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getSectorName(k.sector_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingKnowledge(k.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKnowledge(k.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Chatbot
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              Carregando configurações...
            </div>
          ) : (
            configs
              .filter(c => selectedSector ? c.sector_id === selectedSector : true)
              .map(c => (
                <div key={c.id} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_enabled"
                      checked={c.is_enabled}
                      onChange={(e) => handleUpdateConfig(c.sector_id || '', { is_enabled: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_enabled">Ativar Chatbot</Label>
                  </div>
                  <div>
                    <Label htmlFor="welcome_message">Mensagem de Boas-Vindas</Label>
                    <Textarea
                      id="welcome_message"
                      value={c.welcome_message || ''}
                      onChange={(e) => handleUpdateConfig(c.sector_id || '', { welcome_message: e.target.value })}
                      placeholder="Digite a mensagem de boas-vindas..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="escalation_message">Mensagem de Transferência</Label>
                    <Textarea
                      id="escalation_message"
                      value={c.escalation_message || ''}
                      onChange={(e) => handleUpdateConfig(c.sector_id || '', { escalation_message: e.target.value })}
                      placeholder="Digite a mensagem de transferência..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="working_hours_start">Horário de Início</Label>
                    <Input
                      type="time"
                      id="working_hours_start"
                      value={c.working_hours_start || ''}
                      onChange={(e) => handleUpdateConfig(c.sector_id || '', { working_hours_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="working_hours_end">Horário de Fim</Label>
                    <Input
                      type="time"
                      id="working_hours_end"
                      value={c.working_hours_end || ''}
                      onChange={(e) => handleUpdateConfig(c.sector_id || '', { working_hours_end: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="working_days">Dias de Funcionamento</Label>
                    <div className="text-sm text-muted-foreground">
                      Dias: {c.working_days?.map(day => {
                        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        return dayNames[day] || day;
                      }).join(', ')}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="max_interaction_attempts">Máximo de Tentativas</Label>
                    <Input
                      type="number"
                      id="max_interaction_attempts"
                      value={String(c.max_interaction_attempts || 3)}
                      onChange={(e) => handleUpdateConfig(c.sector_id || '', { max_interaction_attempts: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="auto_escalation_keywords">Palavras-chave de Transferência</Label>
                    <div className="flex gap-2">
                      <Input
                        id="auto_escalation_keywords"
                        placeholder="Adicionar palavra-chave"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            handleAddEscalationKeyword((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={() => {
                        const input = document.getElementById('auto_escalation_keywords') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleAddEscalationKeyword(input.value);
                          input.value = '';
                        }
                      }}>
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {c.auto_escalation_keywords?.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="gap-0.5">
                          {keyword}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { ChatbotManagement };
