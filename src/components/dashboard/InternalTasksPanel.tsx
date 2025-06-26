
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckSquare, Plus, Clock, User, AlertTriangle } from 'lucide-react';
import { useInternalTasks } from '@/hooks/useInternalTasks';
import { useSectors } from '@/hooks/useSectors';
import { useAttendants } from '@/hooks/useAttendants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InternalTasksPanelProps {
  conversationId: string;
}

export const InternalTasksPanel: React.FC<InternalTasksPanelProps> = ({
  conversationId,
}) => {
  const { tasks, isLoading, createTask, updateTask, getTaskStats, isCreating } = useInternalTasks(conversationId);
  const { sectors } = useSectors();
  const { attendants } = useAttendants();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to_sector: '',
    assigned_to_user: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
  });

  const stats = getTaskStats();

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || isCreating) return;

    try {
      await createTask.mutateAsync({
        conversation_id: conversationId,
        title: newTask.title,
        description: newTask.description || undefined,
        assigned_to_sector: newTask.assigned_to_sector || undefined,
        assigned_to_user: newTask.assigned_to_user || undefined,
        priority: newTask.priority,
        due_date: newTask.due_date || undefined,
      });

      setNewTask({
        title: '',
        description: '',
        assigned_to_sector: '',
        assigned_to_user: '',
        priority: 'medium',
        due_date: '',
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await updateTask.mutateAsync({
      taskId,
      data: { status: status as any },
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const formatTaskTime = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM HH:mm', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas Internas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Carregando tarefas...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas Internas
            <Badge variant="secondary">{stats.total}</Badge>
          </CardTitle>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa Interna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Título da tarefa"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descrição detalhada da tarefa"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Setor</label>
                    <Select
                      value={newTask.assigned_to_sector}
                      onValueChange={(value) => setNewTask({ ...newTask, assigned_to_sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input
                    type="datetime-local"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!newTask.title.trim() || isCreating}
                  >
                    {isCreating ? 'Criando...' : 'Criar Tarefa'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Task Stats */}
        {stats.total > 0 && (
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary">{stats.pending} pendentes</Badge>
            <Badge variant="default">{stats.inProgress} em progresso</Badge>
            <Badge variant="outline">{stats.completed} concluídas</Badge>
            {stats.overdue > 0 && (
              <Badge variant="destructive">{stats.overdue} atrasadas</Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma tarefa interna ainda</p>
                <p className="text-xs">Crie a primeira tarefa acima</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority === 'urgent' ? 'Urgente' :
                         task.priority === 'high' ? 'Alta' :
                         task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <Badge variant={getStatusColor(task.status)} className="text-xs">
                        {task.status === 'pending' ? 'Pendente' :
                         task.status === 'in_progress' ? 'Em Progresso' :
                         task.status === 'completed' ? 'Concluída' : 'Cancelada'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {task.creator && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.creator.name}
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTaskTime(task.due_date)}
                          {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>

                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          >
                            Iniciar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        >
                          Concluir
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
