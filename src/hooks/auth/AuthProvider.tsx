
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './authContext';
import { useProfileQuery } from './useProfileQuery';
import { createAuthActions } from './authActions';
import { cleanupAuthState } from './authUtils';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: profile, error: profileError, isLoading: profileLoading, refetch: refetchProfile } = useProfileQuery(user);

  const { signIn, signUp, signOut } = createAuthActions();

  useEffect(() => {
    console.log('useAuth - Profile query state:', { 
      data: profile, 
      error: profileError, 
      isLoading: profileLoading 
    });
  }, [profile, profileError, profileLoading]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth - Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth - Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Refetch profile when user changes
        if (session?.user) {
          setTimeout(() => {
            refetchProfile();
          }, 100);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refetchProfile]);

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    cleanupAuthState,
    loading: loading || profileLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
