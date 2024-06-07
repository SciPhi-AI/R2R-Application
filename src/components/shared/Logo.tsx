import Image from 'next/image';
import Link from 'next/link'; // Import Link from next/link
import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
}

export function Logo({
  width = 25,
  height = 25,
  className = 'cursor-pointer',
  onClick,
  ...rest
}: LogoProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (onClick) {
      e.preventDefault();
    }
  };

  return (
    <Link href="/" passHref onClick={handleClick} className={className}>
      <Image
        alt="sciphi.png"
        src="/images/sciphi.png"
        width={width}
        height={height}
        {...rest} // Now rest only contains props that are compatible with the Image component
      />
    </Link>
  );
}
