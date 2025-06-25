
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { QueueManagement } from './QueueManagement';
import { TransferNotifications } from './TransferNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Clock, CheckCircle } from 'lucide-react';

export const DashboardContent = () => {
  const { profile } = useAuth();
  const { hasPermission, isActive } = usePermissions();

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Conta Inativa</CardTitle>
            <CardDescription className="text-center">
              Sua conta está inativa. Entre em contato com o administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header com informações do usuário */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {profile.name}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                {profile.role === 'admin' ? 'Administrador' : 'Atendente'}
              </Badge>
              {isActive && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div>
                  Online
                </Badge>
              )}
            </div>
          </div>
          
          {/* Estatísticas rápidas */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-1">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Conversas</p>
            </div>
            {profile.role === 'admin' && (
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-1">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Atendentes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar esquerda - Lista de conversas e notificações */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Notificações de transferência */}
          {hasPermission('transfer_conversations') && (
            <div className="p-4 border-b border-gray-200">
              <TransferNotifications />
            </div>
          )}
          
          {/* Lista de conversas */}
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>
        </div>

        {/* Área principal - Chat */}
        <div className="flex-1 flex flex-col">
          <ChatArea />
        </div>

        {/* Sidebar direita - Gerenciamento de fila (apenas para admins) */}
        {hasPermission('assign_conversations') && (
          <div className="w-80 bg-white border-l border-gray-200">
            <QueueManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
