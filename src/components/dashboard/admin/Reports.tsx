import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, MessageSquare, Calendar, TrendingUp, Activity } from 'lucide-react';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

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
          title="Total de Atendentes"
          value={5}
          subtitle="Ativos no sistema"
          color="text-blue-600"
        />
        <StatCard
          icon={MessageSquare}
          title="Conversas Atendidas"
          value={152}
          subtitle="No período selecionado"
          color="text-green-600"
        />
        <StatCard
          icon={Activity}
          title="Mensagens Enviadas"
          value={1248}
          subtitle="Pelos atendentes"
          color="text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Média por Atendente"
          value={30}
          subtitle="Conversas/atendente"
          color="text-orange-600"
        />
      </div>

      {/* Placeholder para relatórios detalhados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios Detalhados
          </CardTitle>
          <CardDescription>
            Visualizações completas serão implementadas após aplicar as migrações do banco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Relatórios em Desenvolvimento</h3>
            <p className="text-gray-600 mb-4">
              Execute as migrações da Fase 1 para habilitar relatórios completos por atendente e setor
            </p>
            <Badge variant="outline">Aguardando migração do banco</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports; 