
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SectorType, StatusType } from '@/types/dashboard';
import type { AdminViewType } from '@/hooks/useDashboardState';
import NotificationSettings from './NotificationSettings';
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Clock, 
  ArrowRightLeft,
  Filter,
  User
} from 'lucide-react';

interface SidebarProps {
  selectedSector: SectorType;
  selectedStatus: StatusType;
  onSectorChange: (sector: SectorType) => void;
  onStatusChange: (status: StatusType) => void;
  conversationCounts: {
    new: number;
    in_progress: number;
    finished: number;
  };
  currentView: AdminViewType;
  onViewChange: (view: AdminViewType) => void;
}

const Sidebar = ({
  selectedSector,
  selectedStatus,
  onSectorChange,
  onStatusChange,
  conversationCounts,
  currentView,
  onViewChange,
}: SidebarProps) => {
  const { profile } = useAuth();
  const { activeSectors, isLoading: sectorsLoading } = useSectors();

  if (!profile) return null;

  // Menu principal mais limpo e organizado
  const adminMenuItems = [
    { 
      id: 'chat', 
      label: 'Conversas', 
      icon: MessageSquare,
      count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished
    },
    { 
      id: 'queue', 
      label: 'Fila', 
      icon: Clock,
      description: 'Gerenciar atendimentos'
    },
    { 
      id: 'transfers', 
      label: 'Transferências', 
      icon: ArrowRightLeft,
      description: 'Histórico de transferências'
    },
    { 
      id: 'attendants', 
      label: 'Atendentes', 
      icon: Users,
      description: 'Gerenciar equipe'
    },
    { 
      id: 'sectors', 
      label: 'Setores', 
      icon: Settings,
      description: 'Configurar setores'
    },
    { 
      id: 'reports', 
      label: 'Relatórios', 
      icon: BarChart3,
      description: 'Análises e métricas'
    },
  ];

  // Setores dinâmicos simplificados
  const sectorOptions = [
    { 
      value: 'all', 
      label: 'Todos', 
      count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished,
      color: '#6B7280' 
    },
    ...activeSectors.map(sector => ({
      value: getSectorTypeFromName(sector.name) as SectorType,
      label: sector.name,
      count: 0,
      color: sector.color
    }))
  ];

  // Status simplificados
  const statusOptions = [
    { value: 'all', label: 'Todos', count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished },
    { value: 'new', label: 'Novas', count: conversationCounts.new },
    { value: 'in_progress', label: 'Em Andamento', count: conversationCounts.in_progress },
    { value: 'finished', label: 'Finalizadas', count: conversationCounts.finished },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header do usuário */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-green-100 text-green-700 font-medium">
              {profile.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-gray-900 truncate">{profile.name}</h2>
            <p className="text-sm text-gray-500">
              {profile.role === 'admin' ? 'Administrador' : 'Atendente'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Principal (para admins) */}
      {profile.role === 'admin' && (
        <div className="border-b border-gray-100">
          <div className="p-3">
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-start h-10 px-3 ${
                      isActive 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => onViewChange(item.id as AdminViewType)}
                  >
                    <Icon className="h-4 w-4 mr-3 shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="truncate">{item.label}</div>
                    </div>
                    {item.count !== undefined && (
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'} 
                        className={`ml-2 text-xs ${
                          isActive ? 'bg-white/20 text-white border-white/30' : ''
                        }`}
                      >
                        {item.count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filtros - Apenas na view de chat */}
      {currentView === 'chat' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-4">
            {/* Filtro por Setores */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900">Setores</h3>
              </div>
              {sectorsLoading ? (
                <div className="text-sm text-gray-500">Carregando...</div>
              ) : (
                <div className="space-y-1">
                  {sectorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSectorChange(option.value as SectorType)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        selectedSector === option.value
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {option.value !== 'all' && (
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span className="text-sm truncate">{option.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {option.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Filtro por Status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900">Status</h3>
              </div>
              <div className="space-y-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onStatusChange(option.value as StatusType)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      selectedStatus === option.value
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{option.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {option.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área vazia para outras views */}
      {currentView !== 'chat' && <div className="flex-1" />}

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        <NotificationSettings />
        <LogoutButton />
      </div>
    </div>
  );
};

// Helper function para converter nome do setor para tipo
function getSectorTypeFromName(sectorName: string): SectorType {
  switch (sectorName) {
    case 'Suporte':
      return 'support';
    case 'Financeiro':
      return 'financial';
    case 'Vendas':
      return 'sales';
    default:
      return 'support';
  }
}

export default Sidebar;
