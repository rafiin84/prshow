"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { SpinnerGap } from "@phosphor-icons/react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-[transform,background-color,box-shadow,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg shadow-sm hover:brightness-110",
        secondary: "bg-muted text-fg hover:bg-border",
        outline: "border border-border bg-surface text-fg hover:bg-muted",
        ghost: "text-fg hover:bg-muted",
        danger: "bg-danger text-white hover:brightness-110 dark:text-[#1a0508]",
        ink: "bg-ink text-on-ink hover:opacity-90 dark:bg-on-ink dark:text-ink",
      },
      size: { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-[0.95rem]", lg: "h-13 px-7 text-base", icon: "size-11" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  loading?: boolean;
  /** Explains why the button is disabled (rendered as visible helper text via title + aria-describedby by callers). */
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, loading, disabled, children, type = "button", ...props }, ref) {
  return (
    <button ref={ref} type={type} className={cn(buttonStyles({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <SpinnerGap className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
