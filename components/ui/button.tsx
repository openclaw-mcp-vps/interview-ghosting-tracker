import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline";
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" &&
            "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.25)]",
          variant === "secondary" &&
            "bg-slate-800 text-slate-100 hover:bg-slate-700",
          variant === "outline" &&
            "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-900",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
