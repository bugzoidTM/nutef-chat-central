
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, Users, MessageSquare, Calendar, Filter } from 'lucide-react';
import { useSatisfactionSurveys, SurveyFilters } from '@/hooks/useSatisfactionSurveys';
import { useSectors } from '@/hooks/useSectors';
import { useAttendants } from '@/hooks/useAttendants';

export const SatisfactionDashboard: React.FC = () => {
  const [filters, setFilters] = useState<SurveyFilters>({});
  const { surveys, stats, loadingSurveys, getRatingLabel, getRatingColor, getOverallSatisfaction } = useSatisfactionSurveys(filters);
  const { sectors } = useSectors();
  const { attendants } = useAttendants();

  const handleFilterChange = (key: keyof SurveyFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const StatsCard = ({ title, value, description, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className={`flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg`}>
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">{trend}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RatingBar = ({ rating, count, total }: { rating: number; count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 min-w-[60px]">
          <span className="text-sm font-medium">{rating}</span>
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 min-w-[40px] text-right">
          {count} ({percentage.toFixed(0)}%)
        </span>
      </div>
    );
  };

  if (loadingSurveys) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satisfação do Cliente</h1>
          <p className="text-gray-600">Análise das pesquisas de satisfação</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data Início
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data Fim
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Setor
              </label>
              <Select value={filters.sectorId || ''} onValueChange={(value) => handleFilterChange('sectorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os setores</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Atendente
              </label>
              <Select value={filters.attendantId || ''} onValueChange={(value) => handleFilterChange('attendantId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os atendentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os atendentes</SelectItem>
                  {attendants.map((attendant) => (
                    <SelectItem key={attendant.id} value={attendant.id}>
                      {attendant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total de Avaliações"
          value={stats.totalSurveys}
          description="Pesquisas respondidas"
          icon={MessageSquare}
        />
        
        <StatsCard
          title="Nota Média"
          value={stats.averageRating.toFixed(1)}
          description={getOverallSatisfaction()}
          icon={Star}
        />
        
        <StatsCard
          title="Taxa de Resposta"
          value={`${stats.responseRate}%`}
          description="Pesquisas respondidas"
          icon={TrendingUp}
        />
        
        <StatsCard
          title="Muito Satisfeitos"
          value={stats.ratingDistribution['5']}
          description={`${stats.totalSurveys > 0 ? ((stats.ratingDistribution['5'] / stats.totalSurveys) * 100).toFixed(0) : 0}% do total`}
          icon={Users}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed">Avaliações Detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Distribuição de Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Notas</CardTitle>
              <CardDescription>
                Como os clientes avaliaram o atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={stats.ratingDistribution[rating.toString() as keyof typeof stats.ratingDistribution]}
                  total={stats.totalSurveys}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {/* Lista de Avaliações */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Recentes</CardTitle>
              <CardDescription>
                {surveys.length} avaliações encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {surveys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma avaliação encontrada</p>
                  </div>
                ) : (
                  surveys.map((survey) => (
                    <div key={survey.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < survey.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className={getRatingColor(survey.rating)}>
                            {getRatingLabel(survey.rating)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(survey.submitted_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Cliente:</span>{' '}
                          {survey.conversation?.client_name || 'Não identificado'}
                        </div>
                        <div>
                          <span className="font-medium">Telefone:</span>{' '}
                          {survey.client_phone}
                        </div>
                        {survey.attendant && (
                          <div>
                            <span className="font-medium">Atendente:</span>{' '}
                            {survey.attendant.name}
                          </div>
                        )}
                        {survey.sector && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Setor:</span>
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: survey.sector.color }}
                              />
                              {survey.sector.name}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {survey.comment && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 italic">
                            "{survey.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SatisfactionDashboard;
