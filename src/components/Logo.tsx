
import React from 'react';

const Logo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg viewBox="0 0 120 40" className="h-full w-auto">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        
        {/* Icon */}
        <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
        <path 
          d="M12 14l8 6-8 6V14z" 
          fill="white" 
          transform="rotate(-90 20 20)"
        />
        
        {/* Text */}
        <text 
          x="45" 
          y="16" 
          fontSize="14" 
          fontWeight="bold" 
          fill="#1f2937"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          NutefTalk
        </text>
        <text 
          x="45" 
          y="28" 
          fontSize="8" 
          fill="#6b7280"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Central de Atendimento
        </text>
      </svg>
    </div>
  );
};

export default Logo;
