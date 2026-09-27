import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/_utils/class-names";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-signal-400/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-ink shadow-[0_12px_28px_-14px_rgba(100,255,218,0.28)] hover:bg-signal-300",
        signal:
          "bg-accent text-ink shadow-[0_12px_28px_-14px_rgba(100,255,218,0.28)] hover:bg-signal-300",
        light:
          "border-slate-300 bg-white text-slate-950 shadow-sm hover:border-signal-200 hover:bg-signal-50/40",
        success:
          "bg-success-700 text-white shadow-[0_12px_28px_-14px_rgba(4,120,87,0.62)] hover:bg-success-800",
        primary: "bg-accent text-ink hover:bg-signal-300",
        outline: "border-line bg-white text-ink hover:border-signal-200 hover:bg-signal-50/40",
        secondary: "bg-surface text-ink hover:bg-black/[0.04]",
        ghost: "bg-transparent text-ink hover:bg-surface",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "border-none bg-transparent px-0 text-signal-700 shadow-none hover:text-signal-900",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-7 text-base sm:px-8",
        xl: "h-14 px-8 text-lg sm:px-10",
        icon: "size-10 px-0",
        "icon-sm": "size-9 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
