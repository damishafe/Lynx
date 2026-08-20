import * as React from "react";
import { cn } from "@/lib/utils";

type BentoCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "inverted" | "muted";
  asChild?: boolean;
};

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[2rem] p-6 sm:p-8 transition-all duration-300",
        variant === "default" &&
          "bg-white text-zinc-950 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100",
        variant === "inverted" &&
          "bg-[#09090B] text-white border border-white/5 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.35)]",
        variant === "muted" &&
          "bg-[#F3F4F6] text-zinc-950 border border-gray-100/80",
        className,
      )}
      {...props}
    />
  ),
);
BentoCard.displayName = "BentoCard";

const BentoCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
BentoCardHeader.displayName = "BentoCardHeader";

const BentoCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold tracking-tight text-zinc-900",
      className,
    )}
    {...props}
  />
));
BentoCardTitle.displayName = "BentoCardTitle";

const BentoCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed text-gray-500 font-medium",
      className,
    )}
    {...props}
  />
));
BentoCardDescription.displayName = "BentoCardDescription";

const BentoCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
BentoCardContent.displayName = "BentoCardContent";

const BentoCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
));
BentoCardFooter.displayName = "BentoCardFooter";

export {
  BentoCard,
  BentoCardHeader,
  BentoCardTitle,
  BentoCardDescription,
  BentoCardContent,
  BentoCardFooter,
};
