import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  disableLink?: boolean;
  priority?: boolean;
}

export function Logo({
  width = 25,
  height = 25,
  className = '',
  onClick,
  disableLink = false,
  priority = true,
  ...rest
}: LogoProps) {
  const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const imageElement = (
    <Image
      alt="sciphi.png"
      src="/images/sciphi.png"
      width={width}
      height={height}
      className="w-full h-full"
      priority={priority}
      {...rest}
    />
  );

  const combinedClassName =
    `${className} ${disableLink ? 'cursor-default' : 'cursor-pointer'}`.trim();

  if (disableLink) {
    return (
      <div className={combinedClassName} onClick={handleClick}>
        {imageElement}
      </div>
    );
  }

  return (
    <Link href="/" passHref onClick={handleClick} className={combinedClassName}>
      {imageElement}
    </Link>
  );
}
