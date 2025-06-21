
import { useState } from 'react';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useDashboardState = () => {
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  return {
    selectedSector,
    setSelectedSector,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm
  };
};
