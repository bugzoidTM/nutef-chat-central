
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const UserAvatar = ({ size = 'md', showName = false, className = '' }: UserAvatarProps) => {
  const { profile } = useAuth();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const displayName = profile?.nickname || profile?.name || 'Usuario';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback className="bg-green-100 text-green-700 font-medium text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-gray-900 truncate text-sm">{displayName}</h2>
          {profile?.role && (
            <p className="text-xs text-gray-500">
              {profile.role === 'admin' ? 'Administrador' : 'Atendente'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
