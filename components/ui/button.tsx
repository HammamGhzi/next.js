import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-[#29453f]",
        outline: "border border-[#b9c1ba] bg-transparent hover:bg-[#f0f0e9] text-ink",
        ghost: "hover:bg-[#f0f0e9] text-ink",
        destructive: "bg-red-700 text-white hover:bg-red-800",
        link: "text-[#6caa91] underline-offset-4 hover:underline",
        secondary: "bg-[#bfe6d8] text-ink hover:bg-[#a8d9c8]",
        publish: "bg-[#28473b] text-white hover:bg-[#203a34]",
      },
      size: {
        default: "px-4 py-3",
        sm: "px-3 py-2",
        lg: "px-5 py-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
