import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { SectorType, StatusType } from '@/types/dashboard';
import NotificationSettings from './NotificationSettings';

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
  conversationCounts,
}: SidebarProps) => {
  const { profile } = useAuth();

  if (!profile) return null;

  const sectorOptions = [
    { value: 'all', label: 'Todos os Setores', count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished },
    { value: 'support', label: 'Suporte', count: 0 },
    { value: 'financial', label: 'Financeiro', count: 0 },
    { value: 'sales', label: 'Vendas', count: 0 },
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os Status', count: conversationCounts.new + conversationCounts.in_progress + conversationCounts.finished },
    { value: 'new', label: 'Novas', count: conversationCounts.new },
    { value: 'in_progress', label: 'Em Andamento', count: conversationCounts.in_progress },
    { value: 'finished', label: 'Finalizadas', count: conversationCounts.finished },
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Sector Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Setores</h3>
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
                  <span className="text-sm">{option.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {option.count}
                  </Badge>
                </button>
              ))}
            </div>
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

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <NotificationSettings />
        <LogoutButton />
      </div>
    </div>
  );
};

export default Sidebar;
