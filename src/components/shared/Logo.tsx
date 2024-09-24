import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  disableLink?: boolean;
}

export function Logo({
  width = 25,
  height = 25,
  className = '',
  onClick,
  disableLink = false,
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
      alt="sciphi.svg"
      src="/images/sciphi.svg"
      width={width}
      height={height}
      className={className}
      priority={true}
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
    <Link href="/" className={combinedClassName}>
      <span onClick={handleClick}>{imageElement}</span>
    </Link>
  );
}
