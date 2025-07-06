
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import InitialSetup from '@/components/setup/InitialSetup';
import QRCodeSetup from '@/components/setup/QRCodeSetup';

const Index = () => {
  console.log('Index.tsx - Component rendering');
  
  const { user, loading, profile, isInitialized } = useAuth();

  console.log('Index.tsx - Auth state:', { 
    hasUser: !!user, 
    loading, 
    isInitialized,
    hasProfile: !!profile,
    profileSetupCompleted: profile?.setup_completed,
    whatsappConnected: profile?.whatsapp_connected,
    userRole: profile?.role,
    userName: profile?.name,
    userId: user?.id
  });

  // Aguardar inicialização
  if (!isInitialized) {
    console.log('Index.tsx - Waiting for initialization');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostrar página de autenticação
  if (!user) {
    console.log('Index.tsx - No user, showing AuthPage');
    return <AuthPage />;
  }

  // Se ainda está carregando o perfil
  if (loading) {
    console.log('Index.tsx - Loading profile');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Se não tem perfil, mostrar setup inicial
  if (!profile) {
    console.log('Index.tsx - No profile found, showing InitialSetup');
    return <InitialSetup />;
  }

  console.log('Index.tsx - Profile loaded:', {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    setup_completed: profile.setup_completed,
    whatsapp_connected: profile.whatsapp_connected
  });

  // Se o usuário tem perfil mas o setup não foi completado
  if (!profile.setup_completed) {
    console.log('Index.tsx - User needs to complete setup, showing InitialSetup');
    return <InitialSetup />;
  }

  // Se é admin, setup completado mas ainda não conectou o WhatsApp
  if (profile.role === 'admin' && !profile.whatsapp_connected) {
    console.log('Index.tsx - Admin needs QR code setup');
    return <QRCodeSetup />;
  }

  // Se chegou até aqui, mostrar o dashboard
  console.log('Index.tsx - All conditions met, showing dashboard');
  return <Dashboard />;
};

export default Index;
