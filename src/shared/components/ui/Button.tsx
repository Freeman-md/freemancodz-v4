import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/class-names";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent px-3 py-2 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-black/10 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-black/85",
        outline: "border-line bg-white text-ink hover:bg-surface",
        secondary: "bg-surface text-ink hover:bg-black/[0.04]",
        ghost: "bg-transparent text-ink hover:bg-surface",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "border-none bg-transparent px-0 text-ink hover:text-accent",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-11 px-4",
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
