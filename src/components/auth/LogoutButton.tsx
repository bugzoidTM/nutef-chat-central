
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="w-full flex items-center justify-center space-x-2 text-gray-700 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4" />
      <span>Sair</span>
    </Button>
  );
};
