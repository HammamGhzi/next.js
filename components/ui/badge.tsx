import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 text-[9px] font-mono tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#fff1d7] text-[#94703a]",
        pending: "bg-[#fff1d7] text-[#94703a]",
        published: "bg-[#e3f2e8] text-[#4f7d5d]",
        rejected: "bg-[#fde8e8] text-[#8b3a3a]",
        submitted: "bg-[#e8f0fe] text-[#3a5f8b]",
        under_review: "bg-[#f3e8fd] text-[#6b3a8b]",
        verified: "bg-[#e3f2e8] text-[#4f7d5d]",
        draft: "bg-[#f0f0e9] text-[#6b7a6d]",
        active: "bg-[#bfe6d8] text-[#28473b]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
