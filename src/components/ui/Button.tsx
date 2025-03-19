import clsx from "clsx";
import Link from "next/link";
import React from "react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const colorStyles = {
  primary:
    "bg-button text-button-text hover:bg-opacity-90 dark:bg-button dark:text-button-text dark:hover:bg-opacity-90",
  secondary:
    "text-text-primary hover:bg-border dark:text-text-secondary dark:hover:bg-border",
  filled:
    "bg-button text-button-text hover:bg-opacity-90 dark:bg-button dark:text-button-text dark:hover:bg-opacity-90",
  danger:
    "bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500",
  amber:
    "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600",
  blue: "bg-button text-button-text hover:bg-opacity-90 dark:bg-blue-600/10 dark:text-blue-600 dark:ring-1 dark:ring-inset dark:ring-blue-600/20 dark:hover:bg-blue-600/10 dark:hover:text-blue-300",
  blue_filled:
    "bg-button text-button-text hover:bg-opacity-90 dark:bg-blue-600 dark:text-white dark:hover:bg-opacity-90",
  text: "text-link hover:text-link-hover dark:text-link dark:hover:text-link-hover",
  text_gray:
    "text-text-secondary hover:text-text-primary dark:text-text-secondary dark:hover:text-text-primary",
  disabled: "bg-border text-text-secondary cursor-not-allowed hover:bg-border",
  light: "bg-button text-button-text hover:bg-opacity-90",
  transparent:
    "bg-transparent text-text-primary hover:bg-border dark:text-text-secondary dark:hover:bg-border",
};

const shapeStyles = {
  default: "rounded-md px-1 py-1",
  rounded: "rounded-full px-1 py-1",
  outline:
    "px-1 py-1 ring-1 ring-inset ring-zinc-900/10 dark:ring-white/10 rounded-md",
  outline_wide:
    "px-2 py-1 ring-1 ring-inset ring-zinc-900/10 dark:ring-white/10 rounded-md",
  slim: "rounded-md px-0.5 py-0.5 h-9 flex items-center justify-center",
};

type ButtonBaseProps = {
  color?: keyof typeof colorStyles;
  shape?: keyof typeof shapeStyles;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  as?: "button" | "anchor";
};

export type ButtonAsButton = ButtonBaseProps & {
  as?: "button";
  href?: undefined;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsAnchor = ButtonBaseProps & {
  as: "anchor";
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

interface ButtonProps extends ButtonBaseProps {
  as?: "button" | "anchor";
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
    as = "button",
    color = "primary",
    shape = "default",
    className,
    children,
    href,
    disabled = false,
    tooltip,
    ...restProps
  } = props;

  const buttonColor = disabled ? "disabled" : color;

  const buttonClassName = clsx(
    "inline-flex gap-0.5 justify-center overflow-hidden font-medium transition",
    colorStyles[buttonColor],
    shapeStyles[shape],
    className
  );

  let ButtonElement: React.ReactElement;

  if (as === "anchor") {
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

Button.displayName = "Button";

export { Button };
