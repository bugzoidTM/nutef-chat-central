
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { QueueStats as QueueStatsType } from '@/hooks/useQueueSystem';

interface QueueStatsProps {
  stats: QueueStatsType;
  isLoading?: boolean;
}

export const QueueStats: React.FC<QueueStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Aguardando',
      value: stats.waiting,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Na fila'
    },
    {
      title: 'Em Atendimento',
      value: stats.assigned,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Atribuídas'
    },
    {
      title: 'Timeout',
      value: stats.timeout,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Excederam limite'
    },
    {
      title: 'Tempo Médio',
      value: `${Math.round(stats.averageWaitTime)}min`,
      icon: Timer,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'De espera'
    },
    {
      title: 'Processadas Hoje',
      value: stats.totalProcessed,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Finalizadas'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 ${stat.bgColor} rounded-lg`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QueueStats;
