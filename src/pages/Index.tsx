
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import InitialSetup from '@/components/setup/InitialSetup';
import QRCodeSetup from '@/components/setup/QRCodeSetup';

const Index = () => {
  console.log('Index.tsx - Component rendering');
  
  try {
    const { user, loading, profile } = useAuth();

    console.log('Index.tsx - Auth state:', { 
      hasUser: !!user, 
      loading, 
      hasProfile: !!profile,
      profileSetupCompleted: profile?.setup_completed,
      whatsappConnected: profile?.whatsapp_connected,
      userRole: profile?.role
    });

    if (loading) {
      console.log('Index.tsx - Showing loading state');
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

    // Se não tem perfil, mostrar setup inicial
    if (!profile) {
      console.log('Index.tsx - No profile found, showing InitialSetup');
      return <InitialSetup />;
    }

    console.log('Index.tsx - Profile loaded:', {
      role: profile.role,
      setup_completed: profile.setup_completed,
      whatsapp_connected: profile.whatsapp_connected
    });

    // Se o usuário tem perfil mas o setup não foi completado
    if (!profile.setup_completed) {
      console.log('Index.tsx - User needs to complete setup');
      return <InitialSetup />;
    }

    // Se é admin, setup completado mas ainda não conectou o WhatsApp
    if (profile.role === 'admin' && profile.setup_completed && !profile.whatsapp_connected) {
      console.log('Index.tsx - Admin needs QR code setup');
      return <QRCodeSetup />;
    }

    // Se chegou até aqui, mostrar o dashboard
    console.log('Index.tsx - Showing dashboard');
    return <Dashboard />;
    
  } catch (error) {
    console.error('Index.tsx - Error in component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar a aplicação</p>
          <p className="text-gray-600 text-sm mt-2">Verifique o console para mais detalhes</p>
        </div>
      </div>
    );
  }
};

export default Index;
