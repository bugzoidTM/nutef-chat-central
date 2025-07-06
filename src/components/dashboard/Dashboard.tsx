
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from './AdminDashboard';
import { AttendantDashboard } from './AttendantDashboard';
import AttendantLogin from '../auth/AttendantLogin';

export const Dashboard = () => {
  const { profile } = useAuth();

  // If no profile, show loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If user is admin, show admin dashboard
  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  // If user is attendant, show attendant dashboard
  if (profile.role === 'attendant') {
    // Check if attendant is active
    if (!profile.is_active) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conta Inativa</h2>
            <p className="text-gray-600 mb-6">
              Sua conta está inativa. Entre em contato com o administrador para reativá-la.
            </p>
          </div>
        </div>
      );
    }
    
    return <AttendantDashboard />;
  }

  // If unknown role, show error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar este sistema.
        </p>
      </div>
    </div>
  );
};
