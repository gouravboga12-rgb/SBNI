import React from 'react';

export const SBNILogo: React.FC<{ className?: string; imgClassName?: string }> = ({
  className = '',
  imgClassName = 'h-14 sm:h-16 md:h-18 w-auto object-contain',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/sbni_logo.png"
        alt="SBNI Money App"
        className={imgClassName}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.png';
        }}
      />
    </div>
  );
};

