'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/Helios-logo.png';

export type HeliosLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<HeliosLogoSize, string> = {
  xs: 'h-5 w-auto max-w-[100px]',
  sm: 'h-6 w-auto max-w-[120px]',
  md: 'h-7 w-auto max-w-[140px]',
  lg: 'h-10 w-auto max-w-[180px]',
  xl: 'h-12 w-auto max-w-[220px]',
};

interface HeliosLogoProps {
  size?: HeliosLogoSize;
  className?: string;
  priority?: boolean;
}

/**
 * Helios brand mark — use everywhere the app previously showed the sun “logo”.
 */
export function HeliosLogo({ size = 'md', className, priority }: HeliosLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Helios"
      width={320}
      height={96}
      priority={priority}
      className={cn(
        'object-contain object-left shrink-0 -rotate-90',
        sizeClasses[size],
        className
      )}
    />
  );
}
