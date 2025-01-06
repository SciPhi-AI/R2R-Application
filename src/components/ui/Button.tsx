import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

const colorStyles = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-accent-darker dark:text-accent-contrast dark:ring-1 dark:ring-inset dark:ring-accent-dark dark:hover:bg-accent-dark dark:hover:text-accent-contrast dark:hover:ring-accent-base',
  secondary:
    'text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
  filled:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-accent-darker dark:text-white dark:hover:bg-accent-dark',
  danger:
    'bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500',
  amber:
    'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600',
  blue: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-blue-600/10 dark:text-blue-600 dark:ring-1 dark:ring-inset dark:ring-blue-600/20 dark:hover:bg-blue-600/10 dark:hover:text-blue-300',
  blue_filled:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-blue-600 dark:text-white dark:hover:bg-opacity-90',
  text: 'text-accent-base hover:text-accent-dark dark:text-accent-base dark:hover:text-accent-dark',
  text_gray:
    'text-gray-200 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-500',
  disabled: 'bg-zinc-600 text-white cursor-not-allowed hover:bg-zinc-500',
  light: 'bg-zinc-700 text-white hover:bg-zinc-600',
  transparent:
    'bg-transparent text-zinc-900 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800',
};

const shapeStyles = {
  default: 'rounded-md px-1 py-1',
  rounded: 'rounded-full px-1 py-1',
  outline:
    'px-1 py-1 ring-1 ring-inset ring-zinc-900/10 dark:ring-white/10 rounded-md',
  outline_wide:
    'px-2 py-1 ring-1 ring-inset ring-zinc-900/10 dark:ring-white/10 rounded-md',
  slim: 'rounded-md px-0.5 py-0.5 h-9 flex items-center justify-center',
};

type ButtonBaseProps = {
  color?: keyof typeof colorStyles;
  shape?: keyof typeof shapeStyles;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  as?: 'button' | 'anchor';
};

export type ButtonAsButton = ButtonBaseProps & {
  as?: 'button';
  href?: undefined;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsAnchor = ButtonBaseProps & {
  as: 'anchor';
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

interface ButtonProps extends ButtonBaseProps {
  as?: 'button' | 'anchor';
  href?: string;
}

type ButtonAttributes = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  keyof ButtonProps
>;
type AnchorAttributes = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof ButtonProps
>;

interface ButtonWithTooltipProps extends ButtonProps {
  tooltip?: React.ReactNode;
}

const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonWithTooltipProps & (ButtonAttributes | AnchorAttributes)
>((props, ref) => {
  const {
    as = 'button',
    color = 'primary',
    shape = 'default',
    className,
    children,
    href,
    disabled = false,
    tooltip,
    ...restProps
  } = props;

  const buttonColor = disabled ? 'disabled' : color;

  const buttonClassName = clsx(
    'inline-flex gap-0.5 justify-center overflow-hidden font-medium transition',
    colorStyles[buttonColor],
    shapeStyles[shape],
    className
  );

  let ButtonElement: React.ReactElement;

  if (as === 'anchor') {
    if (!href) {
      throw new Error(
        "The 'href' prop is required when using Button as 'anchor'."
      );
    }

    ButtonElement = (
      <Link href={href} passHref legacyBehavior>
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={buttonClassName}
          {...(restProps as AnchorAttributes)}
        >
          {children}
        </a>
      </Link>
    );
  } else {
    ButtonElement = (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled}
        className={buttonClassName}
        {...(restProps as ButtonAttributes)}
      >
        {children}
      </button>
    );
  }

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{ButtonElement}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return ButtonElement;
});

Button.displayName = 'Button';

export { Button };
