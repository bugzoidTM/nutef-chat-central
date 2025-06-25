
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, Settings, Plus, Edit, Trash2, Clock, Users, MessageSquare } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useSectors } from '@/hooks/useSectors';
import type { CreateKnowledgeData, UpdateKnowledgeData, UpdateConfigData } from '@/types/chatbot';

export const ChatbotManagement = () => {
  const { knowledge, configs, createKnowledge, updateKnowledge, deleteKnowledge, updateConfig } = useChatbot();
  const { sectors } = useSectors();
  const [selectedKnowledge, setSelectedKnowledge] = useState<any>(null);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isKnowledgeDialogOpen, setIsKnowledgeDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const [knowledgeForm, setKnowledgeForm] = useState<CreateKnowledgeData>({
    question: '',
    answer: '',
    keywords: [],
    intent: '',
    sector_id: '',
    confidence_threshold: 0.7,
  });

  const [configForm, setConfigForm] = useState<UpdateConfigData>({
    is_enabled: true,
    welcome_message: '',
    escalation_message: '',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    max_interaction_attempts: 3,
    auto_escalation_keywords: ['atendente', 'humano', 'pessoa'],
  });

  const handleCreateKnowledge = async () => {
    const keywords = typeof knowledgeForm.keywords === 'string' 
      ? (knowledgeForm.keywords as string).split(',').map(k => k.trim())
      : knowledgeForm.keywords;
    
    await createKnowledge.mutateAsync({
      ...knowledgeForm,
      keywords: keywords || [],
    });
    
    setIsKnowledgeDialogOpen(false);
    resetKnowledgeForm();
  };

  const handleUpdateKnowledge = async () => {
    if (!selectedKnowledge) return;
    
    const keywords = typeof knowledgeForm.keywords === 'string' 
      ? (knowledgeForm.keywords as string).split(',').map(k => k.trim())
      : knowledgeForm.keywords;
    
    await updateKnowledge.mutateAsync({
      id: selectedKnowledge.id,
      data: {
        ...knowledgeForm,
        keywords: keywords || [],
      },
    });
    
    setIsKnowledgeDialogOpen(false);
    setSelectedKnowledge(null);
    resetKnowledgeForm();
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;
    
    const keywords = typeof configForm.auto_escalation_keywords === 'string' 
      ? (configForm.auto_escalation_keywords as string).split(',').map(k => k.trim())
      : configForm.auto_escalation_keywords;
    
    await updateConfig.mutateAsync({
      sectorId: selectedConfig.sector_id,
      data: {
        ...configForm,
        auto_escalation_keywords: keywords || [],
      },
    });
    
    setIsConfigDialogOpen(false);
    setSelectedConfig(null);
  };

  const resetKnowledgeForm = () => {
    setKnowledgeForm({
      question: '',
      answer: '',
      keywords: [],
      intent: '',
      sector_id: '',
      confidence_threshold: 0.7,
    });
  };

  const openKnowledgeDialog = (knowledge?: any) => {
    if (knowledge) {
      setSelectedKnowledge(knowledge);
      setKnowledgeForm({
        question: knowledge.question,
        answer: knowledge.answer,
        keywords: knowledge.keywords?.join(', ') || '',
        intent: knowledge.intent || '',
        sector_id: knowledge.sector_id || '',
        confidence_threshold: knowledge.confidence_threshold,
      });
    } else {
      setSelectedKnowledge(null);
      resetKnowledgeForm();
    }
    setIsKnowledgeDialogOpen(true);
  };

  const openConfigDialog = (config: any) => {
    setSelectedConfig(config);
    setConfigForm({
      is_enabled: config.is_enabled,
      welcome_message: config.welcome_message || '',
      escalation_message: config.escalation_message || '',
      working_hours_start: config.working_hours_start || '08:00',
      working_hours_end: config.working_hours_end || '18:00',
      working_days: config.working_days || [1, 2, 3, 4, 5],
      max_interaction_attempts: config.max_interaction_attempts || 3,
      auto_escalation_keywords: config.auto_escalation_keywords?.join(', ') || '',
    });
    setIsConfigDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Gerenciamento do Chatbot</h2>
      </div>

      <Tabs defaultValue="knowledge" className="space-y-4">
        <TabsList>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Base de Conhecimento
                  </CardTitle>
                  <CardDescription>
                    Gerencie as perguntas e respostas que o chatbot pode usar para atender os clientes
                  </CardDescription>
                </div>
                <Button onClick={() => openKnowledgeDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Conhecimento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pergunta</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {knowledge.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.question}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.answer}</TableCell>
                      <TableCell>
                        {item.intent && <Badge variant="secondary">{item.intent}</Badge>}
                      </TableCell>
                      <TableCell>
                        {item.sector_id ? (
                          sectors.find(s => s.id === item.sector_id)?.name || 'Setor não encontrado'
                        ) : (
                          <Badge variant="outline">Global</Badge>
                        )}
                      </TableCell>
                      <TableCell>{(item.confidence_threshold * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.usage_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openKnowledgeDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteKnowledge.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <div className="grid gap-6">
            {configs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {sectors.find(s => s.id === config.sector_id)?.name || 'Configuração Global'}
                      </CardTitle>
                      <CardDescription>
                        Configurações do chatbot para este setor
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.is_enabled}
                        onCheckedChange={(enabled) => 
                          updateConfig.mutate({
                            sectorId: config.sector_id!,
                            data: { is_enabled: enabled }
                          })
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() => openConfigDialog(config)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Horário de Funcionamento</Label>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {config.working_hours_start} - {config.working_hours_end}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Tentativas Máximas</Label>
                      <div className="text-muted-foreground">
                        {config.max_interaction_attempts} tentativas
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="font-medium">Mensagem de Boas-vindas</Label>
                      <p className="text-muted-foreground text-sm">
                        {config.welcome_message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Knowledge Dialog */}
      <Dialog open={isKnowledgeDialogOpen} onOpenChange={setIsKnowledgeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedKnowledge ? 'Editar Conhecimento' : 'Adicionar Conhecimento'}
            </DialogTitle>
            <DialogDescription>
              Configure uma nova pergunta e resposta para o chatbot
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="question">Pergunta</Label>
              <Input
                id="question"
                value={knowledgeForm.question}
                onChange={(e) => setKnowledgeForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Como posso ajudá-lo?"
              />
            </div>
            <div>
              <Label htmlFor="answer">Resposta</Label>
              <Textarea
                id="answer"
                value={knowledgeForm.answer}
                onChange={(e) => setKnowledgeForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Esta é a resposta que o chatbot dará..."
              />
            </div>
            <div>
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="keywords"
                value={knowledgeForm.keywords}
                onChange={(e) => setKnowledgeForm(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="ajuda, suporte, problema"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intent">Intenção</Label>
                <Input
                  id="intent"
                  value={knowledgeForm.intent}
                  onChange={(e) => setKnowledgeForm(prev => ({ ...prev, intent: e.target.value }))}
                  placeholder="greeting, support, etc."
                />
              </div>
              <div>
                <Label htmlFor="confidence">Confiança Mínima (%)</Label>
                <Input
                  id="confidence"
                  type="number"
                  min="0"
                  max="100"
                  value={(knowledgeForm.confidence_threshold || 0.7) * 100}
                  onChange={(e) => setKnowledgeForm(prev => ({ 
                    ...prev, 
                    confidence_threshold: parseInt(e.target.value) / 100 
                  }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sector">Setor (deixe vazio para global)</Label>
              <Select
                value={knowledgeForm.sector_id}
                onValueChange={(value) => setKnowledgeForm(prev => ({ ...prev, sector_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global (todos os setores)</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKnowledgeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={selectedKnowledge ? handleUpdateKnowledge : handleCreateKnowledge}>
              {selectedKnowledge ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Chatbot</DialogTitle>
            <DialogDescription>
              Configure o comportamento do chatbot para este setor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={configForm.is_enabled}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, is_enabled: checked }))}
              />
              <Label htmlFor="enabled">Chatbot Ativo</Label>
            </div>
            <div>
              <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcome"
                value={configForm.welcome_message}
                onChange={(e) => setConfigForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                placeholder="Olá! Sou o assistente virtual..."
              />
            </div>
            <div>
              <Label htmlFor="escalation">Mensagem de Escalação</Label>
              <Textarea
                id="escalation"
                value={configForm.escalation_message}
                onChange={(e) => setConfigForm(prev => ({ ...prev, escalation_message: e.target.value }))}
                placeholder="Vou transferir você para um atendente humano..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Horário Inicial</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={configForm.working_hours_start}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, working_hours_start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-time">Horário Final</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={configForm.working_hours_end}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, working_hours_end: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="max-attempts">Tentativas Máximas</Label>
              <Input
                id="max-attempts"
                type="number"
                min="1"
                max="10"
                value={configForm.max_interaction_attempts}
                onChange={(e) => setConfigForm(prev => ({ 
                  ...prev, 
                  max_interaction_attempts: parseInt(e.target.value) 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="escalation-keywords">Palavras de Escalação (separadas por vírgula)</Label>
              <Input
                id="escalation-keywords"
                value={configForm.auto_escalation_keywords}
                onChange={(e) => setConfigForm(prev => ({ ...prev, auto_escalation_keywords: e.target.value }))}
                placeholder="atendente, humano, pessoa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateConfig}>
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
