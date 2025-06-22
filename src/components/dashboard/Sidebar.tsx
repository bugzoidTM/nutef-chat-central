
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
import { MessageSquare, Users, BarChart3, Settings, Clock, ArrowRightLeft } from 'lucide-react';

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

  // ⭐ Usar setores dinâmicos em vez de hardcoded
  const sectorOptions = [
    { value: 'all', label: 'Todos os Setores', count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished, color: '#6B7280' },
    ...activeSectors.map(sector => ({
      value: getSectorTypeFromName(sector.name) as SectorType,
      label: sector.name,
      count: 0, // TODO: Implementar contagem por setor dinâmico
      color: sector.color
    }))
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os Status', count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished },
    { value: 'new', label: 'Novas', count: conversationCounts.new },
    { value: 'in_progress', label: 'Em Andamento', count: conversationCounts.in_progress },
    { value: 'finished', label: 'Finalizadas', count: conversationCounts.finished },
  ];

  const adminMenuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'queue', label: 'Fila de Atendimento', icon: Clock },
    { id: 'transfers', label: 'Transferências', icon: ArrowRightLeft },
    { id: 'attendants', label: 'Atendentes', icon: Users },
    { id: 'sectors', label: 'Setores', icon: Settings },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-green-100 text-green-600">
              {profile.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.role === 'admin' ? 'Administrador' : 'Atendente'}</p>
          </div>
        </div>
      </div>

      {/* Menu de Administração (apenas para admins) */}
      {profile.role === 'admin' && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Administração</h3>
          <div className="space-y-1">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onViewChange(item.id as AdminViewType)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content - Filtros de Chat (visível apenas na view de chat) */}
      {currentView === 'chat' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Sector Filters */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Setores</h3>
              {sectorsLoading ? (
                <div className="text-sm text-gray-500">Carregando setores...</div>
              ) : (
                <div className="space-y-2">
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
                      <div className="flex items-center space-x-2">
                        {option.value !== 'all' && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span className="text-sm">{option.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {option.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filters */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
              <div className="space-y-2">
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
      <div className="p-4 border-t border-gray-200 space-y-3">
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
