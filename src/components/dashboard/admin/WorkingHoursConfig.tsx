
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, MessageSquare } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';
import { useWorkingHours } from '@/hooks/useWorkingHours';

export const WorkingHoursConfig = () => {
  const { sectors } = useSectors();
  const [selectedSector, setSelectedSector] = useState<string>('');
  const {
    workingHours,
    isLoading,
    updateWorkingHours,
    isUpdating
  } = useWorkingHours(selectedSector);

  const [formData, setFormData] = useState({
    is_enabled: true,
    start_time: '08:00',
    end_time: '18:00',
    working_days: [1, 2, 3, 4, 5], // Segunda a Sexta
    timezone: 'America/Sao_Paulo',
    auto_response_enabled: true,
    auto_response_message: 'Olá! Nosso horário de atendimento é de {start_time} às {end_time}, de segunda a sexta-feira. Sua mensagem foi registrada e responderemos assim que possível.',
    queue_enabled: true,
    queue_message: 'Você foi adicionado à nossa fila de atendimento. Entraremos em contato no próximo horário útil.'
  });

  React.useEffect(() => {
    if (workingHours) {
      setFormData({
        is_enabled: workingHours.is_enabled ?? true,
        start_time: workingHours.start_time ?? '08:00',
        end_time: workingHours.end_time ?? '18:00',
        working_days: workingHours.working_days ?? [1, 2, 3, 4, 5],
        timezone: workingHours.timezone ?? 'America/Sao_Paulo',
        auto_response_enabled: workingHours.auto_response_enabled ?? true,
        auto_response_message: workingHours.auto_response_message ?? 'Olá! Nosso horário de atendimento é de {start_time} às {end_time}, de segunda a sexta-feira. Sua mensagem foi registrada e responderemos assim que possível.',
        queue_enabled: workingHours.queue_enabled ?? true,
        queue_message: workingHours.queue_message ?? 'Você foi adicionado à nossa fila de atendimento. Entraremos em contato no próximo horário útil.'
      });
    }
  }, [workingHours]);

  const handleSave = () => {
    if (!selectedSector) return;
    
    updateWorkingHours.mutate({
      sectorId: selectedSector,
      data: formData
    });
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort()
    }));
  };

  const dayNames = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuração de Horários de Atendimento
          </CardTitle>
          <CardDescription>
            Configure horários de funcionamento e respostas automáticas para cada setor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="sector">Setor</Label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map(sector => (
                  <SelectItem key={sector.id} value={sector.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: sector.color }}
                      />
                      {sector.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSector && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
                />
                <Label htmlFor="enabled">Controle de horário ativo</Label>
              </div>

              {formData.is_enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Horário de Início</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Horário de Fim</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Dias de Funcionamento</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(dayNames).map(([day, name]) => {
                        const dayNum = parseInt(day);
                        const isSelected = formData.working_days.includes(dayNum);
                        return (
                          <Badge
                            key={day}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleDayToggle(dayNum)}
                          >
                            {name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_response"
                      checked={formData.auto_response_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_response_enabled: checked }))}
                    />
                    <Label htmlFor="auto_response">Resposta automática fora do horário</Label>
                  </div>

                  {formData.auto_response_enabled && (
                    <div>
                      <Label htmlFor="auto_message">Mensagem Automática</Label>
                      <Textarea
                        id="auto_message"
                        placeholder="Use {start_time} e {end_time} para incluir os horários automaticamente"
                        value={formData.auto_response_message}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_response_message: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Variáveis disponíveis: {'{start_time}'}, {'{end_time}'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="queue_enabled"
                      checked={formData.queue_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, queue_enabled: checked }))}
                    />
                    <Label htmlFor="queue_enabled">Adicionar à fila para atendimento posterior</Label>
                  </div>

                  {formData.queue_enabled && (
                    <div>
                      <Label htmlFor="queue_message">Mensagem da Fila</Label>
                      <Textarea
                        id="queue_message"
                        placeholder="Mensagem enviada quando o cliente é adicionado à fila"
                        value={formData.queue_message}
                        onChange={(e) => setFormData(prev => ({ ...prev, queue_message: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  )}

                  <Button onClick={handleSave} disabled={isUpdating}>
                    {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
