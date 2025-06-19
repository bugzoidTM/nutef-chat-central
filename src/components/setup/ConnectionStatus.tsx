
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, WifiOff, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  connectionState?: { state: string };
  isLoading: boolean;
  onRefresh: () => void;
}

export const ConnectionStatus = ({ connectionState, isLoading, onRefresh }: ConnectionStatusProps) => {
  const getStatusColor = (state?: string) => {
    switch (state) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'close':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (state?: string) => {
    switch (state) {
      case 'open':
        return <CheckCircle className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'close':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (state?: string) => {
    switch (state) {
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'close':
        return 'Desconectado';
      default:
        return 'Aguardando...';
    }
  };

  if (!connectionState) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(connectionState.state)}
          <span className="font-medium">Status:</span>
        </div>
        <Badge className={getStatusColor(connectionState.state)}>
          {getStatusLabel(connectionState.state)}
        </Badge>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
