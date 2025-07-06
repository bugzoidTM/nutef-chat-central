
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/dashboard/Dashboard';
import QRCodeSetup from '@/components/setup/QRCodeSetup';
import InitialSetup from '@/components/setup/InitialSetup';
import { AuthPage } from '@/components/auth/AuthPage';
import { useEvolutionInstance } from '@/hooks/useEvolutionInstance';
import * as evolutionApi from '@/services/evolutionApi';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  console.log('Index.tsx - Component rendering');
  const { user, profile, isInitialized } = useAuth();
  const [isCheckingEvolutionConnection, setIsCheckingEvolutionConnection] = useState(false);
  const [needsQRSetup, setNeedsQRSetup] = useState(false);
  
  console.log('Index.tsx - Auth state:', { user: !!user, profile: !!profile, isInitialized });

  // Generate instance name from profile phone
  const generateInstanceName = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `whatsapp_${cleanPhone}`;
  };

  const instanceName = profile?.phone ? generateInstanceName(profile.phone) : null;

  // Check real Evolution API connection status
  useEffect(() => {
    const checkEvolutionConnection = async () => {
      if (!profile?.phone || !instanceName) return;
      
      console.log('Index.tsx - Checking Evolution API connection for:', instanceName);
      setIsCheckingEvolutionConnection(true);
      
      try {
        const connectionState = await evolutionApi.getConnectionState(instanceName);
        console.log('Index.tsx - Evolution API connection state:', connectionState);
        
        // If instance exists and is connected, we can show dashboard
        if (connectionState?.instance?.state === 'open') {
          console.log('Index.tsx - Instance is connected, can show dashboard');
          setNeedsQRSetup(false);
        } else {
          console.log('Index.tsx - Instance exists but not connected, needs setup');
          setNeedsQRSetup(true);
          
          // Reset whatsapp_connected in database since instance is not properly connected
          if (profile.whatsapp_connected) {
            await supabase
              .from('profiles')
              .update({ whatsapp_connected: false })
              .eq('id', profile.id);
          }
        }
      } catch (error: any) {
        console.log('Index.tsx - Evolution API connection check failed:', error?.message);
        
        // If instance doesn't exist (404), we need to go through setup
        if (error?.message?.includes('404') || error?.message?.includes('does not exist')) {
          console.log('Index.tsx - Instance does not exist, needs complete setup');
          setNeedsQRSetup(true);
          
          // Reset whatsapp_connected in database since instance doesn't exist
          if (profile.whatsapp_connected) {
            console.log('Index.tsx - Resetting whatsapp_connected to false due to missing instance');
            await supabase
              .from('profiles')
              .update({ whatsapp_connected: false })
              .eq('id', profile.id);
          }
        }
      } finally {
        setIsCheckingEvolutionConnection(false);
      }
    };

    // Only check if profile says it's connected
    if (profile?.whatsapp_connected && instanceName) {
      checkEvolutionConnection();
    } else if (profile && !profile.whatsapp_connected) {
      // If profile says not connected, show QR setup
      setNeedsQRSetup(true);
    }
  }, [profile?.phone, profile?.whatsapp_connected, instanceName, profile?.id]);

  if (!isInitialized) {
    console.log('Index.tsx - Waiting for initialization');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('Index.tsx - No user, showing auth page');
    return <AuthPage />;
  }

  if (!profile) {
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

  console.log('Index.tsx - Profile loaded:', profile);

  // Check if initial setup is completed
  if (!profile.setup_completed) {
    console.log('Index.tsx - Setup not completed, showing initial setup');
    return <InitialSetup />;
  }

  // For admins, check WhatsApp connection with real Evolution API verification
  if (profile.role === 'admin') {
    if (isCheckingEvolutionConnection) {
      console.log('Index.tsx - Checking Evolution API connection...');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando conexão com WhatsApp...</p>
          </div>
        </div>
      );
    }

    // Show QR setup if not connected or if verification failed
    if (!profile.whatsapp_connected || needsQRSetup) {
      console.log('Index.tsx - Admin needs QR code setup');
      return <QRCodeSetup />;
    }
  }

  // Show dashboard for connected users
  console.log('Index.tsx - All conditions met, showing dashboard');
  return <Dashboard />;
};

export default Index;
