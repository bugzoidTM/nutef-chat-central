
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContextType } from './authTypes';
import { checkUserProfile, createInitialProfile, shouldBeFirstAdmin } from './authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Função para buscar perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      const profile = await checkUserProfile(userId);
      
      if (!profile) {
        // Tentar criar perfil inicial
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          // Verificar se deve ser o primeiro admin
          const isFirstUser = await shouldBeFirstAdmin();
          
          const newProfile = await createInitialProfile({
            ...user.data.user,
            user_metadata: {
              ...user.data.user.user_metadata,
              role: isFirstUser ? 'admin' : 'attendant',
            }
          });

          // Se é o primeiro usuário, torná-lo admin
          if (isFirstUser && newProfile) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin', is_admin: true })
              .eq('id', newProfile.id);

            if (updateError) {
              console.error('Error setting first user as admin:', updateError);
            } else {
              newProfile.role = 'admin';
              newProfile.is_admin = true;
            }
          }

          setProfile(newProfile);
          return newProfile;
        }
      } else {
        setProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
      toast({
        title: "Erro de Autenticação",
        description: "Erro ao carregar perfil do usuário. Tente fazer login novamente.",
        variant: "destructive",
      });
    }
    return null;
  };

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Obter sessão atual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (currentSession?.user && mounted) {
          setUser(currentSession.user);
          setSession(currentSession);
          await fetchProfile(currentSession.user.id);
        }

        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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
        console.log('Auth state changed:', event, newSession?.user?.id);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
          await fetchProfile(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro ao sair",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isInitialized,
    signOut,
    refetchProfile: () => user ? fetchProfile(user.id) : Promise.resolve(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
