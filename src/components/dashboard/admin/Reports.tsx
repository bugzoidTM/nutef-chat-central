
import React, { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Users, MessageSquare, Calendar, TrendingUp, Activity, UserCheck, Clock } from 'lucide-react';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { attendantStats, sectorStats, dailyStats, overallStats, isLoading } = useReports(dateRange);

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "text-blue-600" }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <Icon className={`h-6 w-6 ${color}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Atendimento</h2>
          <p className="text-gray-600">Acompanhe o desempenho da sua equipe</p>
        </div>
      </div>

      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-40"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-40"
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setDateRange({
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
              })}
              className="mt-6"
            >
              Últimos 30 dias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Atendentes Ativos"
          value={overallStats.activeAttendants}
          subtitle={`de ${overallStats.totalAttendants} cadastrados`}
          color="text-blue-600"
        />
        <StatCard
          icon={MessageSquare}
          title="Conversas Atendidas"
          value={overallStats.totalConversations}
          subtitle="No período selecionado"
          color="text-green-600"
        />
        <StatCard
          icon={Activity}
          title="Mensagens Enviadas"
          value={overallStats.totalMessagesSupport}
          subtitle="Pelos atendentes"
          color="text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Média por Atendente"
          value={overallStats.averageConversationsPerAttendant}
          subtitle="Conversas/atendente ativo"
          color="text-orange-600"
        />
      </div>

      {/* Relatórios Detalhados */}
      <Tabs defaultValue="attendants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendants">Por Atendente</TabsTrigger>
          <TabsTrigger value="sectors">Por Setor</TabsTrigger>
          <TabsTrigger value="daily">Evolução Diária</TabsTrigger>
        </TabsList>

        {/* Tab: Por Atendente */}
        <TabsContent value="attendants">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Atendente</CardTitle>
              <CardDescription>
                Estatísticas individuais de cada atendente no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendantStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atendente</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Conversas</TableHead>
                      <TableHead className="text-center">Mensagens</TableHead>
                      <TableHead className="text-center">Finalizadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendantStats.map((attendant) => (
                      <TableRow key={attendant.attendant_id}>
                        <TableCell>
                          <div className="font-medium">{attendant.attendant_name}</div>
                          {attendant.last_activity && (
                            <div className="text-sm text-gray-500">
                              Última atividade: {new Date(attendant.last_activity).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: attendant.sector_color }}
                            />
                            <span className="text-sm">{attendant.sector_name}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={attendant.is_active ? 'default' : 'secondary'}>
                            {attendant.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="font-medium">{attendant.total_conversations}</div>
                            <div className="text-xs text-gray-500">
                              {attendant.new_conversations} novas, {attendant.in_progress_conversations} em andamento
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="font-medium">{attendant.total_messages_sent}</div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="font-medium">{attendant.finished_conversations}</div>
                            {attendant.total_conversations > 0 && (
                              <div className="text-xs text-gray-500">
                                {Math.round((attendant.finished_conversations / attendant.total_conversations) * 100)}% concluídas
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado de atendente encontrado no período selecionado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Por Setor */}
        <TabsContent value="sectors">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Setor</CardTitle>
              <CardDescription>
                Estatísticas agregadas por setor de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sectorStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-center">Atendentes</TableHead>
                      <TableHead className="text-center">Conversas</TableHead>
                      <TableHead className="text-center">Mensagens</TableHead>
                      <TableHead className="text-center">Taxa Conclusão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectorStats.map((sector) => (
                      <TableRow key={sector.sector_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: sector.sector_color }}
                            />
                            <span className="font-medium">{sector.sector_name}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{sector.active_attendants}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="font-medium">{sector.total_conversations}</div>
                            <div className="text-xs text-gray-500">
                              {sector.new_conversations} novas, {sector.in_progress_conversations} em andamento
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="font-medium">{sector.total_messages}</div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="font-medium">{sector.finished_conversations}</div>
                            {sector.total_conversations > 0 && (
                              <div className="text-xs text-gray-500">
                                {Math.round((sector.finished_conversations / sector.total_conversations) * 100)}%
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado de setor encontrado no período selecionado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Evolução Diária */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Diária</CardTitle>
              <CardDescription>
                Acompanhe a evolução diária dos atendimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Conversas</TableHead>
                      <TableHead className="text-center">Mensagens</TableHead>
                      <TableHead className="text-center">Novas</TableHead>
                      <TableHead className="text-center">Finalizadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>
                          <div className="font-medium">
                            {new Date(day.date).toLocaleDateString('pt-BR', { 
                              weekday: 'short', 
                              day: '2-digit', 
                              month: '2-digit' 
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{day.total_conversations}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{day.total_messages}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium text-blue-600">{day.new_conversations}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium text-green-600">{day.finished_conversations}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado encontrado no período selecionado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
