
import { useQuery } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useProfileQuery = (user: User | null) => {
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('👤 useAuth - No user ID, skipping profile fetch');
        return null;
      }
      
      console.log('👤 useAuth - Fetching profile for user:', user.id);
      console.log('👤 useAuth - User email:', user.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
      
      if (error) {
        console.error('❌ useAuth - Profile fetch error:', error);
        console.error('❌ useAuth - Error details:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }
      
      if (!data) {
        console.warn('⚠️ useAuth - No profile found for user:', user.id);
        console.log('📝 useAuth - Available user data:', { 
          id: user.id, 
          email: user.email, 
          created_at: user.created_at 
        });
      } else {
        console.log('✅ useAuth - Profile fetched successfully:', { 
          id: data.id, 
          name: data.name, 
          role: data.role, 
          email: data.email 
        });
      }
      
      return data;
    },
    enabled: !!user?.id,
    retry: (failureCount, error: any) => {
      console.log(`🔄 useAuth - Profile fetch retry ${failureCount}:`, error?.message);
      // Não tentar novamente se for erro de recursão
      if (error?.code === '42P17') {
        return false;
      }
      return failureCount < 2;
    },
  });
};
