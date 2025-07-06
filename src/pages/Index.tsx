
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import InitialSetup from '@/components/setup/InitialSetup';
import QRCodeSetup from '@/components/setup/QRCodeSetup';

const Index = () => {
  console.log('Index.tsx - Component rendering');
  
  try {
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
    if (!isInitialized || loading) {
      console.log('Index.tsx - Showing loading state');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    if (profile.role === 'admin' && profile.setup_completed && !profile.whatsapp_connected) {
      console.log('Index.tsx - Admin needs QR code setup');
      return <QRCodeSetup />;
    }

    // Se chegou até aqui, mostrar o dashboard
    console.log('Index.tsx - All conditions met, showing dashboard');
    return <Dashboard />;
    
  } catch (error) {
    console.error('Index.tsx - Error in component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold mb-2">Erro ao carregar a aplicação</p>
          <p className="text-gray-600 text-sm mb-4">Verifique o console para mais detalhes</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
};

export default Index;
