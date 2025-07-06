
import React from 'react';
import { Users } from 'lucide-react';

export const AttendantEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum atendente cadastrado</h3>
      <p className="text-gray-600">
        Comece adicionando seu primeiro atendente à equipe usando o botão acima
      </p>
    </div>
  );
};
