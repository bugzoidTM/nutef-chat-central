
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Users, Settings, LogOut, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import type { Database } from '@/integrations/supabase/types';

type SectorType = Database['public']['Enums']['sector_type'] | 'all';
type StatusType = Database['public']['Enums']['conversation_status'] | 'all';

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
}

const Sidebar = ({ 
  selectedSector, 
  selectedStatus, 
  onSectorChange, 
  onStatusChange,
  conversationCounts 
}: SidebarProps) => {
  const { profile, signOut } = useAuth();

  const sectors = [
    { value: 'all' as const, label: 'Todos os Setores' },
    { value: 'support' as const, label: 'Suporte' },
    { value: 'financial' as const, label: 'Financeiro' },
    { value: 'sales' as const, label: 'Vendas' },
  ];

  const statuses = [
    { value: 'all' as const, label: 'Todas', count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished },
    { value: 'new' as const, label: 'Novas', count: conversationCounts.new },
    { value: 'in_progress' as const, label: 'Em Andamento', count: conversationCounts.in_progress },
    { value: 'finished' as const, label: 'Finalizadas', count: conversationCounts.finished },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Logo className="h-10 mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{profile?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center mb-3">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          
          {/* Sector Filter */}
          {profile?.role === 'admin' && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Setor</Label>
              <div className="space-y-1">
                {sectors.map((sector) => (
                  <Button
                    key={sector.value}
                    variant={selectedSector === sector.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onSectorChange(sector.value)}
                    className="w-full justify-start text-left"
                  >
                    {sector.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
            <div className="space-y-1">
              {statuses.map((status) => (
                <Button
                  key={status.value}
                  variant={selectedStatus === status.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onStatusChange(status.value)}
                  className="w-full justify-between"
                >
                  <span>{status.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {status.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="p-4 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <MessageSquare className="h-4 w-4 mr-2" />
          Conversas
        </Button>
        {profile?.role === 'admin' && (
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Atendentes
          </Button>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>
    </div>
  );
};

// Add Label component if not already imported
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export default Sidebar;
