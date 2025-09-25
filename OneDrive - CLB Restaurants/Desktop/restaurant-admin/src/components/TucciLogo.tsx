import Image from 'next/image';

interface TucciLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'white' | 'dark';
}

export default function TucciLogo({ size = 'md', showText = true, className = '', variant = 'default' }: TucciLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
    xl: 'h-32 w-32',
    '2xl': 'h-40 w-40',
    '3xl': 'h-48 w-48',
    '4xl': 'h-64 w-64',
    '5xl': 'h-128 w-128'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl',
    '3xl': 'text-6xl',
    '4xl': 'text-7xl',
    '5xl': 'text-8xl'
  };

  // Choose the appropriate logo based on variant
  const logoSrc = variant === 'dark' ? '/tuccis-logo-black-bg.png' : '/tucci-logo.png';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <Image
          src={logoSrc}
          alt="Tucci's Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          {size === 'lg' || size === 'xl' || size === '2xl' || size === '3xl' || size === '4xl' || size === '5xl' ? (
            <span className={`text-sm font-medium tracking-wide ${variant === 'white' ? 'text-gray-300' : 'text-[#ab974f]'}`}>
              RESTAURANT ADMIN
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
