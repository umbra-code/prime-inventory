import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Orokin buttons: beveled corners, borders drawn as inset shadows (clip-path
// would cut a real border).
const buttonVariants = cva(
  "bevel cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-wide transition-[color,background-color,box-shadow,filter] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-b from-oro-gold-hi to-oro-gold text-oro-gold-ink font-semibold hover:brightness-110",
        extra: "bg-oro-extra text-oro-gold-ink font-semibold hover:brightness-110",
        outline:
          "bg-oro-surface-2 text-oro-ink shadow-[inset_0_0_0_1px_var(--oro-line-strong)] hover:text-oro-gold hover:shadow-[inset_0_0_0_1px_var(--oro-gold)]",
        danger:
          "bg-transparent text-oro-danger shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--oro-danger)_55%,transparent)] hover:bg-oro-danger/10",
        destructive: "bg-oro-danger text-oro-bg font-semibold hover:brightness-110",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-oro-ink-muted hover:text-oro-gold",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-7 [--cut:5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };