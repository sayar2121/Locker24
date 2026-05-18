import React from 'react';

/**
 * A premium, high-fidelity loader component with multiple variants.
 */
export const Loader = ({ 
  variant = 'dots', 
  size = 'md', 
  color = 'primary', 
  text = '', 
  center = false 
}) => {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const colorMap = {
    primary: {
      text: 'text-primary',
      textLight: 'text-primary/20',
      bg: 'bg-primary',
      border: 'border-primary',
      borderLight: 'border-primary/20',
      borderT: 'border-t-primary'
    },
    accent: {
      text: 'text-accent',
      textLight: 'text-accent/20',
      bg: 'bg-accent',
      border: 'border-accent',
      borderLight: 'border-accent/20',
      borderT: 'border-t-accent'
    },
    white: {
      text: 'text-white',
      textLight: 'text-white/20',
      bg: 'bg-white',
      border: 'border-white',
      borderLight: 'border-white/20',
      borderT: 'border-t-white'
    }
  };

  const colors = colorMap[color] || colorMap.primary;

  const containerClasses = center 
    ? 'flex flex-col items-center justify-center min-h-[200px] w-full' 
    : 'flex flex-col items-center justify-center';

  const renderLoader = () => {
    switch (variant) {
      case 'vault':
        return (
          <div className={`relative ${sizeMap[size]}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full animate-spin [animation-duration:3s]">
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="20 10"
                className={colors.textLight}
              />
              <circle 
                cx="50" cy="50" r="35" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeDasharray="60 120"
                className={colors.text}
                strokeLinecap="round"
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center ${colors.text}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
               </svg>
            </div>
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 ${colors.bg} rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        );

      case 'skeleton':
        return (
          <div className="w-full space-y-4 p-4 animate-pulse">
            <div className="h-4 bg-muted rounded-full w-3/4"></div>
            <div className="h-4 bg-muted rounded-full"></div>
            <div className="h-4 bg-muted rounded-full w-5/6"></div>
          </div>
        );

      case 'ring':
      default:
        return (
          <div className={`relative ${sizeMap[size]}`}>
            <div className={`absolute inset-0 border-4 ${colors.borderLight} rounded-full`} />
            <div className={`absolute inset-0 border-4 ${colors.borderT} border-transparent rounded-full animate-spin`} />
          </div>
        );
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {text && (
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
