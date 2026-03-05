/**
 * Audio Button Component
 * Button that plays sound on interaction
 */

import { useAudio } from '@/lib/useAudio';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface AudioButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  hoverSound?: string;
  clickSound?: string;
  className?: string;
}

export default function AudioButton({
  children,
  hoverSound = 'ui_hover',
  clickSound = 'ui_click',
  className = '',
  onClick,
  ...props
}: AudioButtonProps) {
  const { play } = useAudio();

  const handleMouseEnter = () => {
    if (hoverSound) {
      play(hoverSound);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (clickSound) {
      play(clickSound);
    }
    onClick?.(e);
  };

  return (
    <button
      {...props}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
