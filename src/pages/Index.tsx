
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import InitialSetup from '@/components/setup/InitialSetup';
import QRCodeSetup from '@/components/setup/QRCodeSetup';

const Index = () => {
  const { user, loading, profile } = useAuth();

  console.log('Index.tsx - Auth state:', { user: !!user, loading, profile });

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
    console.log('Index.tsx - No user, showing AuthPage');
    return <AuthPage />;
  }

  // Se não tem perfil, pode ser que ainda não foi criado ou não foi carregado
  if (!profile) {
    console.log('Index.tsx - No profile found');
    // Se é um usuário logado mas sem perfil, mostrar setup inicial
    return <InitialSetup />;
  }

  console.log('Index.tsx - Profile loaded:', {
    role: profile.role,
    setup_completed: profile.setup_completed,
    whatsapp_connected: profile.whatsapp_connected
  });

  // Se é admin e ainda não completou o setup inicial
  if (profile.role === 'admin' && !profile.setup_completed) {
    console.log('Index.tsx - Admin needs initial setup');
    return <InitialSetup />;
  }

  // Se é admin, completou o setup mas ainda não conectou o WhatsApp
  if (profile.role === 'admin' && profile.setup_completed && !profile.whatsapp_connected) {
    console.log('Index.tsx - Admin needs QR code setup');
    return <QRCodeSetup />;
  }

  // Se chegou até aqui, mostrar o dashboard
  console.log('Index.tsx - Showing dashboard');
  return <Dashboard />;
};

export default Index;
