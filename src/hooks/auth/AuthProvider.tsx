
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContextType } from './authTypes';
import { AuthContext } from './authContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileProcessed, setProfileProcessed] = useState(false);
  const { toast } = useToast();

  // Função para buscar perfil do usuário
  const fetchProfile = async (userId: string): Promise<any> => {
    try {
      console.log('AuthProvider - Fetching profile for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthProvider - Error fetching profile:', error);
        return null;
      }

      if (!profile) {
        console.log('AuthProvider - No profile found for user:', userId);
        return null;
      }

      console.log('AuthProvider - Profile loaded successfully:', {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        setup_completed: profile.setup_completed,
        whatsapp_connected: profile.whatsapp_connected
      });

      return profile;
    } catch (error) {
      console.error('AuthProvider - Error in fetchProfile:', error);
      return null;
    }
  };

  // Criar perfil inicial se não existir
  const createInitialProfile = async (user: User): Promise<any> => {
    try {
      console.log('AuthProvider - Creating initial profile for user:', user.id);
      
      // Verificar se é o primeiro usuário (deve ser admin)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const isFirstUser = count === 0;
      
      const profileData = {
        user_id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        phone: user.user_metadata?.phone || '',
        role: (isFirstUser ? 'admin' : 'attendant') as 'admin' | 'attendant',
        is_active: true,
        setup_completed: false,
        whatsapp_connected: false,
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('AuthProvider - Error creating profile:', error);
        return null;
      }

      console.log('AuthProvider - Profile created successfully:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('AuthProvider - Error creating initial profile:', error);
      return null;
    }
  };

  // Processar usuário logado
  const processLoggedInUser = async (user: User) => {
    if (profileProcessed) {
      console.log('AuthProvider - Profile already processed, skipping');
      return;
    }
    
    setProfileProcessed(true);
    console.log('AuthProvider - Processing logged in user:', user.id);
    
    try {
      // Tentar buscar perfil existente
      let userProfile = await fetchProfile(user.id);
      
      // Se não tem perfil, criar um novo
      if (!userProfile) {
        console.log('AuthProvider - No profile found, creating new profile...');
        userProfile = await createInitialProfile(user);
      }
      
      if (userProfile) {
        console.log('AuthProvider - Setting profile:', {
          name: userProfile.name,
          role: userProfile.role,
          setup_completed: userProfile.setup_completed
        });
        setProfile(userProfile);
      } else {
        console.error('AuthProvider - Failed to get or create profile');
      }
    } catch (error) {
      console.error('AuthProvider - Error processing user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider - Initializing auth...');
        
        // Obter sessão atual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider - Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (currentSession?.user && mounted) {
          console.log('AuthProvider - Found existing session for user:', currentSession.user.id);
          setUser(currentSession.user);
          setSession(currentSession);
          
          // Processar usuário imediatamente
          await processLoggedInUser(currentSession.user);
        } else {
          console.log('AuthProvider - No existing session found');
          if (mounted) {
            setLoading(false);
          }
        }

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('AuthProvider - Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthProvider - Auth state changed:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession?.user) {
          console.log('AuthProvider - User signed in:', newSession.user.id);
          setUser(newSession.user);
          setSession(newSession);
          setProfileProcessed(false); // Reset para permitir nova busca
          
          // Processar usuário
          await processLoggedInUser(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider - User signed out');
          setUser(null);
          setSession(null);
          setProfile(null);
          setProfileProcessed(false);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('AuthProvider - Token refreshed');
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Apenas uma vez na montagem

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setProfileProcessed(false);
    } catch (error) {
      console.error('AuthProvider - Error signing out:', error);
      toast({
        title: "Erro ao sair",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const refetchProfile = async () => {
    if (!user) return null;
    
    console.log('AuthProvider - Refetching profile for user:', user.id);
    setProfileProcessed(false);
    const userProfile = await fetchProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
    }
    return userProfile;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isInitialized,
    signOut,
    refetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
