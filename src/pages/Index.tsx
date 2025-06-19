
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/auth/AuthPage';
import Dashboard from '@/components/dashboard/Dashboard';
import InitialSetup from '@/components/setup/InitialSetup';
import QRCodeSetup from '@/components/setup/QRCodeSetup';

const Index = () => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostrar página de autenticação
  if (!user) {
    return <AuthPage />;
  }

  // Se não tem perfil ou perfil ainda não foi carregado, mostrar loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Se é admin e ainda não completou o setup inicial
  if (profile.role === 'admin' && !profile.setup_completed) {
    return <InitialSetup />;
  }

  // Se é admin, completou o setup mas ainda não conectou o WhatsApp
  if (profile.role === 'admin' && profile.setup_completed && !profile.whatsapp_connected) {
    return <QRCodeSetup />;
  }

  // Se chegou até aqui, mostrar o dashboard
  return <Dashboard />;
};

export default Index;
