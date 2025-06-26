
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  isInitialized: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<any>;
}
