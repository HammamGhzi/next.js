import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-sm border border-[#d9ded8] bg-[#fcfcfa] px-3 py-3 text-xs text-ink placeholder:text-[#a0aba5] focus:outline-none focus:border-[#76ad93] focus:ring-2 focus:ring-[#8fc5a21f] disabled:cursor-not-allowed disabled:opacity-50 font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
