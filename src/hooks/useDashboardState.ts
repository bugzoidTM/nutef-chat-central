import { useState } from 'react';
import type { SectorType, StatusType } from '@/types/dashboard';

export type AdminViewType = 'chat' | 'attendants' | 'sectors' | 'reports' | 'queue' | 'transfers';

export const useDashboardState = () => {
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados específicos para administração
  const [currentView, setCurrentView] = useState<AdminViewType>('chat');

  return {
    selectedSector,
    setSelectedSector,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    currentView,
    setCurrentView
  };
};
