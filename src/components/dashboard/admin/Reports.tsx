
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MessageSquare, Clock, Brain, Zap } from 'lucide-react';
import { QuickResponseManagement } from './QuickResponseManagement';
import { ChatbotManagement } from './ChatbotManagement';
import { useReports } from '@/hooks/useReports';

export const Reports = () => {
  const { 
    conversationStats, 
    messageStats, 
    attendantPerformance,
    isLoading 
  } = useReports();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Relatórios</h2>
        </div>
        <p>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Relatórios</h2>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="quick-responses">Respostas Rápidas</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Conversas
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversationStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{conversationStats?.growth || 0}% desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mensagens Enviadas
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messageStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{messageStats?.growth || 0}% desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio de Resposta
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendantPerformance?.avgResponseTime || 0}min
                </div>
                <p className="text-xs text-muted-foreground">
                  -5% desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Atendentes Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendantPerformance?.activeAttendants || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2 novos esta semana
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversas por Dia</CardTitle>
                <CardDescription>
                  Número de conversas iniciadas nos últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={conversationStats?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversations" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Atendente</CardTitle>
                <CardDescription>
                  Número de conversas atendidas por pessoa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendantPerformance?.attendantData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversations" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick-responses">
          <QuickResponseManagement />
        </TabsContent>

        <TabsContent value="chatbot">
          <ChatbotManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
