import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

const colorStyles = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-1 dark:ring-inset dark:ring-indigo-400/20 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-300 dark:hover:ring-indigo-300',
  secondary:
    'text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
  filled:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-indigo-600 dark:text-white dark:hover:bg-opacity-90',
  danger:
    'bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500',
  amber:
    'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600',
  blue: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-blue-600/10 dark:text-blue-600 dark:ring-1 dark:ring-inset dark:ring-blue-600/20 dark:hover:bg-blue-600/10 dark:hover:text-blue-300 dark:hover:ring-blue-300',
  blue_filled:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-blue-600 dark:text-white dark:hover:bg-opacity-90',
  text: 'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500',
  text_gray:
    'text-gray-200 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-500',
  disabled: 'bg-zinc-600 text-white cursor-not-allowed hover:bg-zinc-500',
  light: 'bg-zinc-700 text-white hover:bg-zinc-600',
};

const shapeStyles = {
  default: 'rounded-md px-1 py-1',
  rounded: 'rounded-full px-1 py-1',
  outline:
    'px-1 py-1 ring-1 ring-inset ring-zinc-900/10 dark:ring-white/10 rounded-md',
  outline_wide:
    'px-2 py-1 ring-1 ring-inset ring-zinc-900/10 dark:ring-white/10 rounded-md',
  slim: 'rounded-md px-0.5 py-0.5',
};

type ButtonProps = {
  color?: keyof typeof colorStyles;
  shape?: keyof typeof shapeStyles;
  className?: string;
  href?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  color = 'primary',
  shape = 'default',
  className,
  children,
  href,
  disabled = false,
  ...props
}: ButtonProps) {
  const buttonClassName = clsx(
    'inline-flex gap-0.5 justify-center overflow-hidden font-medium transition',
    colorStyles[color],
    shapeStyles[shape],
    className
  );

  const commonProps = {
    className: buttonClassName,
    disabled: disabled,
  };

  if (href && !disabled) {
    return (
      <Link
        href={href}
        {...commonProps}
        {...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button {...commonProps} {...props}>
      {children}
    </button>
  );
}
