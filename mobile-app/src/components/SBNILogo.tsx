import React from 'react';

export const SBNILogo: React.FC<{
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}> = ({
  className = '',
  imgClassName = 'h-14 sm:h-16 md:h-20 w-auto object-contain',
  style,
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/sbni_logo.png"
        alt="Just Paisa - Money Made Simple"
        className={`object-contain ${imgClassName}`}
        style={style}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.png';
        }}
      />
    </div>
  );
};

