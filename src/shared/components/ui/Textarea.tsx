import * as React from "react";
import { cn } from "@/shared/utils/class-names";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-2xl border border-line bg-white px-3 py-3 text-base text-ink transition outline-none placeholder:text-muted focus-visible:border-black/15 focus-visible:ring-2 focus-visible:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
